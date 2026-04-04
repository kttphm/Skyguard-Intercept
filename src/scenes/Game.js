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

        this.isEnemyDetected = false;

        this.initMap();
        this.initText();
        this.initDomeThreatPanel();
        this.initEnemyCollisions();
        this._nextEnemyId = 1;
        this.startEnemySpawning();
    }

    update() {
        this.turret.update();
        this.angleText.setText(`Launch angle : ${this.turret.getLaunchAngle()}`);
        this.missileText.setText(`Missile : ${this.turret.getCurrentMissileType()} (speed: ${this.turret.getCurrentMissileSpeed()} m/s)`);
        
        this.cleanupMissiles();

        [this.missiles, this.enemies].forEach((group) => {
            group.children.iterate(this.alignSpriteRotationToVelocity, this);
        });
    }

// --- Initialization ---
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

    initDomeThreatPanel() {
        const margin = 16;
        const panelW = 300;
        const panelH = 168;
        const pad = 14;
        const lineH = 22;

        const xRight = this.scale.width - margin;
        const yTop = margin;

        this.domeThreatContainer = this.add.container(xRight - panelW, yTop);
        this.domeThreatContainer.setScrollFactor(0);
        this.domeThreatContainer.setDepth(2000);
        this.domeThreatContainer.setVisible(false);

        const bg = this.add.graphics();
        bg.fillStyle(0x0c1224, 0.92);
        bg.lineStyle(2, 0xf59e0b, 0.85);
        bg.fillRoundedRect(0, 0, panelW, panelH, 8);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 8);

        const titleStyle = {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#fde68a',
            fontStyle: 'bold'
        };
        const bodyStyle = {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '14px',
            color: '#e2e8f0'
        };

        const title = this.add.text(pad, pad, '⚠ MISSILE DETECTED', titleStyle);
        const sepY = pad + lineH + 4;
        const sep = this.add.graphics();
        sep.lineStyle(1, 0x334155, 1);
        sep.lineBetween(pad, sepY, panelW - pad, sepY);

        let y = sepY + 10;
        this.domeThreatLines = {
            id: this.add.text(pad, y, '', bodyStyle),
            pos: this.add.text(pad, y + lineH, '', bodyStyle),
            vel: this.add.text(pad, y + lineH * 2, '', bodyStyle),
            speed: this.add.text(pad, y + lineH * 3, '', bodyStyle),
            dir: this.add.text(pad, y + lineH * 4, '', bodyStyle)
        };

        this.domeThreatContainer.add([
            bg,
            title,
            sep,
            this.domeThreatLines.id,
            this.domeThreatLines.pos,
            this.domeThreatLines.vel,
            this.domeThreatLines.speed,
            this.domeThreatLines.dir
        ]);
    }

    initEnemyCollisions() {
        this.physics.add.overlap(this.missiles, this.ground, this.onPlayerHitGround, null, this);
        this.physics.add.overlap(this.enemies, this.ground, this.onEnemyHitGround, null, this);
        this.physics.add.overlap(this.enemies, this.missiles, this.onEnemyHitMissile, null, this);
        this.physics.add.overlap(this.enemies, this.houses, this.onEnemyHitHouse, null, this);
        this.physics.add.overlap(this.enemies, this.dome, this.onEnemyEnteredDome, this.isInsideDomeArc, this);
    }

    startEnemySpawning() {
        this.spawnEnemy();
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2000, // ms
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }


// --- Lifecycle ---
    spawnEnemy() {
        if (this.isEnemyDetected) return;

        const enemy = (new Enemy(this, this.houses, this.PPM)).setScale(0.5);
        if (enemy.active) {
            enemy.enemyId = this._nextEnemyId++;
            this.enemies.add(enemy);
            enemy.launch();
        }
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


// --- Event Handlers ---
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

    onEnemyEnteredDome(obj1, obj2) {
        const enemy = this.enemies.contains(obj1) ? obj1 : obj2;
        if (!enemy || enemy._hasTriggeredStop) return;
        enemy._hasTriggeredStop = true;

        this.showDomeThreatAlert(enemy);

        if (!this.isEnemyDetected) {
            this.isEnemyDetected = true;
            this.freezeEnemiesAndMissilesForDomeThreat();
            if (this.enemySpawnTimer) {
                this.enemySpawnTimer.paused = true;
            }
        }
    }


// --- Game State Control ---
    freezeEnemiesAndMissilesForDomeThreat() {
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

    dismissDomeThreat() {
        if (this.domeThreatContainer) {
            this.domeThreatContainer.setVisible(false);
        }

        if (this.isEnemyDetected) {
            this.isEnemyDetected = false;

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

        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = false;
        }
    }


// --- UI and Display Logic ---
    showDomeThreatAlert(enemy) {
        if (!this.domeThreatContainer || !enemy || !enemy.body) return;

        const vx = enemy.body.velocity.x / this.PPM;
        const vy = enemy.body.velocity.y / this.PPM;
        const px = this.toShiftedX(Math.round(enemy.x)) / this.PPM;
        const py = this.toShiftedY(Math.round(enemy.y)) / this.PPM;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const idNum = enemy.enemyId != null ? enemy.enemyId : 0;
        const idStr = String(idNum).padStart(2, '0');
        const arrow = this.velocityToDirArrow(vx, vy);

        this.domeThreatLines.id.setText(`ID: #${idStr}`);
        this.domeThreatLines.pos.setText(`Pos: (${px}, ${py})`);
        this.domeThreatLines.vel.setText(`Vel: (${Math.round(vx)}, ${Math.round(vy)})`);
        this.domeThreatLines.speed.setText(`Speed: ${Math.round(speed)} m/s`);
        this.domeThreatLines.dir.setText(`Dir: ${arrow}`);

        this.domeThreatContainer.setVisible(true);
    }


// --- Utility Functions ---
    alignSpriteRotationToVelocity(sprite) {
        if (!sprite || !sprite.body) return;

        const vx = sprite.body.velocity.x;
        const vy = sprite.body.velocity.y;
        if (vx === 0 && vy === 0) return;

        sprite.rotation = Math.atan2(vy, vx);
    }

    velocityToDirArrow(vx, vy) {
        if (vx === 0 && vy === 0) return '·';
        const deg = (Phaser.Math.RadToDeg(Math.atan2(vy, vx)) + 360) % 360;
        const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
        const i = Math.floor((deg + 22.5) / 45) % 8;
        return arrows[i];
    }

    toShiftedX(x) {
        const originX = this.shiftOriginX ?? (this.scale.width / 2);
        return x - originX;
    }

    toShiftedY(y) {
        const originY = this.shiftOriginY ?? this.scale.height;
        return originY - y;
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
}
