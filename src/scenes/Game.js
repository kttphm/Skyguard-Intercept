import Turret from '../gameObjects/Turret.js';
import Enemy from '../gameObjects/Enemy.js';

export default class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.PPM = 2;
        this.life = 5;
        this.wave = 1;
        this.enemyCount = 0;
        this.waveDelayMs = 5000;
        this.physics.world.gravity.y = 70 * this.PPM;

        this.isSpawnPaused = false;
        this.enemySpawnTimer = this.time.addEvent({});

        this.missiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.trails = this.add.group();
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

        this.waveText.setText(`Wave : ${this.wave}`);
        this.lifeText.setText(`House : ${this.houses.getLength()}`);
        this.angleText.setText(`Launch angle : ${this.turret.getLaunchAngle()}`);
        this.missileText.setText(`Missile : ${this.turret.getCurrentMissileType()} (speed: ${this.turret.getCurrentMissileSpeed()} m/s)`);
        
        this.cleanupMissiles();

        [this.missiles, this.enemies].forEach((group) => {
            group.children.iterate(this.alignSpriteRotationToVelocity, this);
        });
    }

// --- Initialization ---
    initMap() {
        const canvas_W = this.scale.width;
        const canvas_H = this.scale.height;
        const centerX = canvas_W / 2;
        const centerY = canvas_H/2;

        const ground_H = this.textures.get('ground').getSourceImage().height;
        const dome_R = this.textures.get('dome').getSourceImage().height;

        // draw background
        const background = this.add.image(centerX, centerY, 'background');

        // draw ground
        this.ground = this.physics.add.sprite(centerX, canvas_H - ground_H/2, 'ground');
        const ground_lv = this.ground.getBounds().top;

        // draw dome
        this.dome = this.physics.add.sprite(centerX, ground_lv - dome_R/2, 'dome');
        const DomeEdge_L = this.dome.getBounds().left;
        const DomeEdge_R = this.dome.getBounds().right;

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
        const textStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' };

        this.waveText = this.add.text(20, 20, `Life : `, textStyle);
        this.lifeText = this.add.text(20, 50, `Life : `, textStyle);
        this.angleText = this.add.text(20, 80, `Launch angle : `, textStyle);
        this.missileText = this.add.text(20, 110, `Missile : `, textStyle);

        this.interceptPointText = this.add.text(20, 160, `Intercept point : `, textStyle).setVisible(false);
        this.timeToInterceptText = this.add.text(20, 190, `Time untill intercept : `, textStyle).setVisible(false);
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
        if (this.isSpawnPaused) return;

        const targetEnemyCount = this.getEnemyCount(this.wave);
        if (this.enemyCount >= targetEnemyCount) {
            this.checkForWave();
            return;
        }

        this.spawnEnemy();
        this.enemyCount += 1;

        this.enemySpawnTimer.reset({
            delay: this.getSpawnTime(2200, 300),
            callback: this.startEnemySpawning,
            callbackScope: this,
            loop: false
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

    checkForWave() {
        const enemyCount = this.getEnemyCount(this.wave);
        if (enemyCount <= this.enemyCount) {
            this.wave += 1;
            this.enemyCount = 0;

            this.pauseSpawning();

            this.time.delayedCall(this.waveDelayMs, () => {
                this.resumeSpawning();
            });
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
        
        if (!this.isEnemyDetected) {
            this.isEnemyDetected = true;
            this.freezeEnemiesAndMissiles();
            this.pauseSpawning();
        }

        this.showDomeThreatAlert(enemy);
        this.renderMissileTrajectory(enemy, 0.067);
        this.renderInterceptPoint(enemy, this.trails);
        this.showInterceptionPanel(enemy, this.interceptPoint);
    }


// --- Game State Control ---
    freezeEnemiesAndMissiles() {
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
        
            this.resumeSpawning();

            if (this.trails) {
                this.trails.clear(true, true);
            }
        }
    }

    dismissInterceptionPanel() {
        this.interceptPointText.setVisible(false)
        this.timeToInterceptText.setVisible(false)
    }


// --- UI and Display Logic ---
    showDomeThreatAlert(enemy) {
        if (!this.domeThreatContainer || !enemy || !enemy.body) return;

        const vx = enemy._savedVelocityX / this.PPM;
        const vy = enemy._savedVelocityY / this.PPM;
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

    showInterceptionPanel(enemy, interceptPoint) {
        if (!enemy || !enemy.body || !interceptPoint) return;
        const interceptX = this.toShiftedX(Math.round(interceptPoint.x)) / this.PPM;
        const interceptY = this.toShiftedX(Math.round(interceptPoint.y)) / this.PPM;

        const timeToIntercept = Math.round(((interceptPoint.x - enemy.x) / enemy._savedVelocityX) * 100) / 100;

        const textStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' };

        this.interceptPointText.setText(`Intercept point : (${interceptX}, ${interceptY})`).setVisible(true);
        this.timeToInterceptText.setText(`Time untill intercept : ${timeToIntercept}`).setVisible(true);
    }

    renderMissileTrajectory(enemy, dt) {
        if (!enemy || !enemy.body || !this.ground) return;

        this.trails.clear(true, true);

        const x0 = enemy.x;
        const y0 = enemy.y;
        const vx = enemy._savedVelocityX;
        const vy0 = enemy._savedVelocityY;
        const g = this.physics.world.gravity.y;
        const house = enemy.targetHouse;
        const houseTop = (house && house.active) ? house.getBounds().top - 0.0 : this.ground.getBounds().top - 0.0;
        const maxT = 30;

        for (let t = dt; t < maxT; t += dt) {
            const sx = x0 + vx * t;
            const sy = y0 + vy0 * t + 0.5 * g * t * t;

            if (t > 0 && sy >= houseTop) break;

            const vyAtT = vy0 + g * t;
            const trail = this.add.image(sx, sy, 'enemy').setScale(0.5); // this.add.rectangle(sx, sy, 6, 2, 0xffffff, 0.85);
            trail.alpha = 0.4;
            trail.setDepth(500);
            trail.setRotation(Math.atan2(vyAtT, vx));
            this.trails.add(trail);

            if (sx < -200 || sx > this.scale.width + 200) break;
        }
    }

    renderInterceptPoint(enemy, trails) {
        if (!enemy || !enemy.body) return;

        const possibleInterceptPoint = this.add.group();
        trails.children.iterate((trail) => {
            if (200 <= this.toShiftedY(trail.y) && this.toShiftedY(trail.y) <= 0.75 * this.toShiftedY(enemy.y)) { // use in game coordinate
                possibleInterceptPoint.add(trail);
            }
        });

        this.interceptPoint = Phaser.Utils.Array.GetRandom(possibleInterceptPoint.getChildren());

        if (!this.interceptPoint) return;

        this.interceptPoint.alpha = 1;
        this.interceptPoint.tint = 0xff0000;
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

    getEnemyCount(wave) {
        if (wave <= 5) {
            return [3, 4, 6, 8, 10][wave - 1];
        }

        return Math.floor(10 + wave * 1.3) + Phaser.Math.Between(-1, 1);
    }

    getSpawnTime(base, variance) {
        return base + Phaser.Math.Between(-variance, variance);
    }

    pauseSpawning() {
        this.isSpawnPaused = true;
    }

    resumeSpawning() {
        this.isSpawnPaused = false;
        this.startEnemySpawning();
    }
}