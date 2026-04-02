import Turret from '../gameObjects/Turret.js';
import Enemy from '../gameObjects/Enemy.js';

export default class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.PPM = 2;
        this.life = 5;
        this.physics.world.gravity.y = 9.8 * this.PPM;

        this.missiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.houses = this.physics.add.group();

        this.initMap();
        this.initText();
        this.initEnemyCollisions();
        this.startEnemySpawning();
    }

    update() {
        this.turret.update();
        this.angleText.setText(`Launch angle : ${this.turret.getLaunchAngle()}`);
        this.missileText.setText(`Missile : ${this.turret.getCurrentMissileType()} (speed: ${this.turret.getCurrentMissileSpeed()} m/s)`);
        
        this.cleanupMissiles();

        // rotate missile into moving direction
        this.missiles.children.iterate(missile => {
            if (!missile || !missile.body) return;

            const vx = missile.body.velocity.x;
            const vy = missile.body.velocity.y;

            if (vx === 0 && vy === 0) return;

            // Rotate to face velocity
            missile.rotation = Math.atan2(vy, vx) + 0;
        });

        // rotate enemy into moving direction
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.body) return;

            const vx = enemy.body.velocity.x;
            const vy = enemy.body.velocity.y;

            if (vx === 0 && vy === 0) return;

            // Rotate to face velocity
            enemy.rotation = Math.atan2(vy, vx) + 0;
        });
    }

    initMap() {
        // canvas's constant
        const canvas_W = this.scale.width;
        const canvas_H = this.scale.height;
        const centerX = canvas_W / 2;

        // asset's constant
        const ground_H = this.textures.get('ground').getSourceImage().height;
        const dome_R = this.textures.get('dome').getSourceImage().height;

        const ground_lv = canvas_H - ground_H;
        const DomeEdge_L = canvas_W/2 - dome_R;
        const DomeEdge_R = canvas_W/2 + dome_R;

        //--------------------------------//

        // draw background, ground, dome
        const background = this.add.image(centerX, canvas_H/2, 'background');
        this.ground = this.physics.add.sprite(centerX, canvas_H - ground_H/2, 'ground');
        this.dome = this.physics.add.sprite(centerX, ground_lv - dome_R/2, 'dome');

        // draw house
        const spacing_dome = 150;
        const spacing_house = 30;
        const house_count = 5; // 5 each side
        const house_scaling = 1.5;

        const house_H = this.textures.get('house').getSourceImage().height * house_scaling;
        const house_W = this.textures.get('house').getSourceImage().width * house_scaling;

        const houseX1 = DomeEdge_L + spacing_dome + house_W/2;
        const houseX2 = DomeEdge_R - spacing_dome - (house_count-1)*house_W - (house_count-1)*spacing_house - house_W/2;
        const houseY = canvas_H - ground_H - house_H / 2;

        this.houses.createMultiple({
            key: 'house',
            repeat: house_count - 1,
            setXY: { x: houseX1, y: houseY, stepX: spacing_house + house_W }
        })
        this.houses.createMultiple({
            key: 'house',
            repeat: house_count - 1,
            setXY: { x: houseX2, y: houseY, stepX: spacing_house + house_W }
        })
        // set scale
        this.houses.children.iterate(house => {
            house.setScale(house_scaling);
        });
        
        // draw turret
        const turretbase_H = this.textures.get('turretbase').getSourceImage().height;

        this.add.image(centerX, ground_lv - turretbase_H/2, 'turretbase');
        this.turret = new Turret(this, centerX, ground_lv - turretbase_H, this.PPM, this.missiles);

        //--------------------------------//

        // set gravity
        this.ground.body.setAllowGravity(false);
        this.dome.body.setAllowGravity(false);
        this.houses.children.iterate((house) => {
        if (!house) return;
            house.body.setAllowGravity(false);
        });
    }

    initText () {
        const textStyle = { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff' };

        this.lifeText = this.add.text(20, 20, `Life : `, textStyle); //`Life : ${this.life}`
        this.angleText = this.add.text(20, 50, `Launch angle : `, textStyle); //`Launch angle : ${this.turret.getLaunchAngle()}`
        this.missileText = this.add.text(20, 80, `Missile : `, textStyle); //`Missile : ${this.turret.getCurrentMissileType()} (speed: ${this.turret.getCurrentMissileSpeed()} m/s)`
    }

    initEnemyCollisions() {
        this.physics.add.overlap(this.missiles, this.ground, this.onPlayerHitGround, null, this);
        this.physics.add.overlap(this.enemies, this.ground, this.onEnemyHitGround, null, this);
        this.physics.add.overlap(this.enemies, this.missiles, this.onEnemyHitMissile, null, this);
        this.physics.add.overlap(this.enemies, this.houses, this.onEnemyHitHouse, null, this);
        this.physics.add.overlap(this.enemies, this.dome, this.stopEnemyAndMissiles, this.isInsideDomeArc, this);
    }

    onPlayerHitGround(obj1, obj2) {
        const missile = obj1 === this.ground ? obj2 : obj1;
        if (missile.active) missile.destroy();
    }

    onEnemyHitGround(obj1, obj2) {
        const enemy = obj1 === this.ground ? obj2 : obj1;
        if (enemy.active) enemy.destroy();
    }

    onEnemyHitMissile(obj1, obj2) {
        const enemy = this.missiles.contains(obj1) ? obj2 : obj1;
        const missile = this.missiles.contains(obj1) ? obj1 : obj2;
        if (enemy.active) enemy.destroy();
        if (missile.active) missile.destroy();
    }

    onEnemyHitHouse(obj1, obj2) {
        const enemy = this.enemies.contains(obj1) ? obj1 : obj2;
        const house = this.houses.contains(obj1) ? obj1 : obj2;
        if (enemy.active) enemy.destroy();
        if (house.active) house.destroy();
    }

    isInsideDomeArc(obj1, obj2) {
        const enemy = this.enemies.contains(obj1) ? obj1 : obj2;
        const dome = enemy === obj1 ? obj2 : obj1;
        if (!enemy || !dome) return false;

        const DOME_TEX_LINE_THICKNESS = 0.5;
        const centerX = dome.x;
        const centerY = dome.y + dome.displayHeight / 2;
        const radius = dome.displayWidth / 2 - DOME_TEX_LINE_THICKNESS * dome.scaleX;
        const enemyRadius = Math.max(enemy.displayWidth, enemy.displayHeight) * 0.25;
        const dx = enemy.x - centerX;
        const dy = enemy.y - centerY;
        const collisionRadius = radius + enemyRadius;
        const distSq = dx * dx + dy * dy;

        return enemy.y <= centerY && distSq <= (collisionRadius * collisionRadius);
    }

    spawnEnemy() {
        const enemy = (new Enemy(this, this.houses, this.PPM)).setScale(0.5);
        if (enemy.active) this.enemies.add(enemy);
    }

    startEnemySpawning() {
        this.spawnEnemy();
        this.enemySpawnTimer = this.time.addEvent({
            delay: 500, // ms
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    stopEnemyAndMissiles() {
        const freezeBody = (targetSprite) => {
            if (!targetSprite || !targetSprite.body || targetSprite.body.moves === false) return;

            targetSprite._savedVelocityX = targetSprite.body.velocity.x;
            targetSprite._savedVelocityY = targetSprite.body.velocity.y;
            targetSprite._savedAngularVelocity = targetSprite.body.angularVelocity;
            targetSprite._savedAccelerationX = targetSprite.body.acceleration.x;
            targetSprite._savedAccelerationY = targetSprite.body.acceleration.y;
            targetSprite._savedAngularAcceleration = targetSprite.body.angularAcceleration;
            targetSprite.body.setVelocity(0, 0);
            targetSprite.body.setAngularVelocity(0);
            targetSprite.body.setAcceleration(0, 0);
            targetSprite.body.setAngularAcceleration(0);
            targetSprite.body.moves = false;
        };

        this.enemies.children.iterate(freezeBody);
        this.missiles.children.iterate(freezeBody);
    }

    resumeEnemyAndMissiles() {
        const resumeBody = (targetSprite) => {
            if (!targetSprite || !targetSprite.body || targetSprite.body.moves === true) return;

            targetSprite.body.moves = true;
            targetSprite.body.setVelocity(targetSprite._savedVelocityX ?? 0, targetSprite._savedVelocityY ?? 0);
            targetSprite.body.setAngularVelocity(targetSprite._savedAngularVelocity ?? 0);
            targetSprite.body.setAcceleration(targetSprite._savedAccelerationX ?? 0, targetSprite._savedAccelerationY ?? 0);
            targetSprite.body.setAngularAcceleration(targetSprite._savedAngularAcceleration ?? 0);
            delete targetSprite._savedVelocityX;
            delete targetSprite._savedVelocityY;
            delete targetSprite._savedAngularVelocity;
            delete targetSprite._savedAccelerationX;
            delete targetSprite._savedAccelerationY;
            delete targetSprite._savedAngularAcceleration;
        };

        this.enemies.children.iterate(resumeBody);
        this.missiles.children.iterate(resumeBody);
    }

    cleanupMissiles() {
        const canvas_W = this.scale.width;
        const canvas_H = this.scale.height;
        const margin = 100; // Destroy missiles slightly outside screen bounds
        
        this.missiles.children.entries.forEach(missile => {
            if (missile.x < -margin ||           // left
                missile.x > canvas_W + margin || // right
                missile.y > canvas_H + margin) { // down
                missile.destroy();
            }
        });
    }
}
