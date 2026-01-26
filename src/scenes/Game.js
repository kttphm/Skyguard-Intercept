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

        this.enemies = this.physics.add.group();
        this.houses = this.physics.add.group();

        this.initMap();
        this.initText();
        this.initEnemyCollisions();
        this.startEnemySpawning();

        const a = this.add.image(1280/2, 720/2, 'missile');
        a.setScale(0.3);
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
        const house_H = this.textures.get('house').getSourceImage().height;
        const dome_R = this.textures.get('dome').getSourceImage().height
        const turretbase_H = this.textures.get('turretbase').getSourceImage().height;

        const ground_lv = canvas_H - ground_H;
        const DomeEdge_L = canvas_W/2 - dome_R;
        const DomeEdge_R = canvas_W/2 + dome_R;

        //--------------------------------//

        // draw background, ground, dome
        const background = this.add.image(centerX, canvas_H/2, 'background');
        this.ground = this.physics.add.sprite(centerX, canvas_H - ground_H/2, 'ground');
        this.dome = this.dome = this.physics.add.sprite(centerX, ground_lv - dome_R/2, 'dome');

        // draw house
        const houseY = canvas_H - ground_H - house_H / 1;
        this.spawnHouses(DomeEdge_L + 100, houseY); // DomeEdge_L + spacing
        this.spawnHouses(centerX + 40, houseY);
        
        // draw turret
        this.add.image(centerX, ground_lv - turretbase_H/2, 'turretbase');
        this.missiles = this.physics.add.group();
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

    spawnEnemy() {
        const enemy = new Enemy(this, this.houses, this.PPM);
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

    spawnHouses(startX, startY) {
        const spacingPairs = [
            [100, 100]
        ];

        const gaps = Phaser.Utils.Array.GetRandom(spacingPairs);

        let x = startX;

        for (let i = 0; i < 3; i++) {
            const house = this.physics.add.sprite(x, startY, "house");
            house.setScale(2);
            this.houses.add(house);

            if (i < 2) {
                x += gaps[i];
            }
        }
    }
}
