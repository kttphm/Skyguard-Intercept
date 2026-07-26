import Enemy from '../gameObjects/Enemy.js';
import { buildGameWorld } from '../world/buildGameWorld.js';
import { GameHUD } from '../ui/GameHUD.js';
import { MissileLaunchInput } from '../ui/MissileLaunchInput.js';
import * as GameMath from '../utils/gameMath.js';
import { dismissDomeThreatState } from '../systems/domeThreatFreeze.js';
import { setupGameCollisions } from '../systems/gameCollisions.js';
import { getEnemyCount, getSpawnTime } from '../systems/waveConfig.js';

export default class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.PPM = 20;
        this.life = 5;
        this.wave = 1;
        this.enemyCount = 0;
        this.waveDelayMs = 5000;
        this.physics.world.gravity.y = 9.81 * this.PPM;

        this.isSpawnPaused = false;
        this.enemySpawnTimer = this.time.addEvent({});

        this.missiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.trails = this.add.group();
        this.houses = this.physics.add.group();
        this.ruinedHouses = this.physics.add.group();

        this.isEnemyDetected = false;
        this.isGameOver = false;

        buildGameWorld(this, { houses: this.houses, missiles: this.missiles, ppm: this.PPM });

        this.shiftOriginX = this.turret.x;
        this.shiftOriginY = this.turret.y;

        this.gameHud = new GameHUD(this);
        this.missileLaunchInput = new MissileLaunchInput(this);
        this.keypadToggleKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);

        setupGameCollisions(this);

        this._nextEnemyId = 1;
        this.startEnemySpawning();
    }

    update() {
        if (!this.isGameOver && this.houses.getLength() === 0) {
            this.triggerGameOver();
        }

        this.turret.update();
        this.gameHud.updateStatus(this.wave, this.houses.getLength());

        if (this.isEnemyDetected) {
            this.missileLaunchInput.update();
        }

        this.cleanupMissiles();

        [this.missiles, this.enemies].forEach((group) => {
            group.children.iterate(GameMath.alignSpriteRotationToVelocity);
        });
    }

    startEnemySpawning() {
        if (this.isSpawnPaused) return;

        const targetEnemyCount = getEnemyCount(this.wave);
        if (this.enemyCount >= targetEnemyCount) {
            this.checkForWave();
            return;
        }

        this.spawnEnemy();
        this.enemyCount += 1;

        this.enemySpawnTimer.reset({
            delay: getSpawnTime(2200, 300),
            callback: this.startEnemySpawning,
            callbackScope: this,
            loop: false
        });
    }

    spawnEnemy() {
        if (this.isEnemyDetected) return;

        const enemy = (new Enemy(this, this.houses, this.PPM)).setScale(0.7);
        if (enemy.active) {
            enemy.enemyId = this._nextEnemyId++;
            this.enemies.add(enemy);
            enemy.launch();
        }
    }

    checkForWave() {
        const enemyCount = getEnemyCount(this.wave);
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
        const margin = 100;

        this.missiles.children.entries.forEach((missile) => {
            if (
                missile.x < -margin ||
                missile.x > canvas_W + margin ||
                missile.y > canvas_H + margin
            ) {
                missile.destroy();
            }
        });
    }

    triggerGameOver() {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.isSpawnPaused = true;
        this.missileLaunchInput.hide();
        this.gameHud.dismissInterceptionPanel();

        if (this.enemySpawnTimer && this.enemySpawnTimer.active) {
            this.enemySpawnTimer.remove(false);
        }

        this.add.sprite(640, 280, 'game_over').setScale(0.8);

        const replayBtn = this.add.sprite(200, 570, 'button4').setInteractive({ useHandCursor: true });
        const returnBtn = this.add.sprite(200, 650, 'button3').setInteractive({ useHandCursor: true });

        replayBtn.on('pointerdown', function () {
            this.setTint(0xaaaaaa);
        });

        replayBtn.on('pointerout', function () {
            this.clearTint();
        });

        replayBtn.on('pointerup', () => {
            replayBtn.clearTint();
            this.scene.start('Game');
        });

        returnBtn.on('pointerdown', function () {
            this.setTint(0xaaaaaa);
        });

        returnBtn.on('pointerout', function () {
            this.clearTint();
        });

        returnBtn.on('pointerup', () => {
            returnBtn.clearTint();
            this.scene.start('Menu');
        });
    }

    dismissDomeThreat() {
        this.missileLaunchInput.hide();
        dismissDomeThreatState(this);
    }

    dismissInterceptionPanel() {
        this.gameHud.dismissInterceptionPanel();
    }

    pauseSpawning() {
        this.isSpawnPaused = true;
    }

    resumeSpawning() {
        this.isSpawnPaused = false;
        this.startEnemySpawning();
    }
}
