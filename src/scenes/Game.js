import Enemy from '../gameObjects/Enemy.js';
import { buildGameWorld } from '../world/buildGameWorld.js';
import { GameHUD } from '../ui/GameHUD.js';
import { InterceptCalculator } from '../ui/InterceptCalculator.js';
import { MissileLaunchInput } from '../ui/MissileLaunchInput.js';
import * as GameMath from '../utils/gameMath.js';
import { dismissDomeThreatState } from '../systems/domeThreatFreeze.js';
import { onEnemyHitGround, onPlayerHitGround, setupGameCollisions } from '../systems/gameCollisions.js';
import { getEnemyCount, getSpawnTime } from '../systems/waveConfig.js';
import {
    clearMultiIntercept,
    isMultiInterceptActive,
    isMultiInterceptWave,
    setupBigEnemy,
    updateMultiIntercept
} from '../systems/multiIntercept.js';

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
        this.waveTargetCount = getEnemyCount(this.wave);
        this.bigEnemySpawnIndex = this.pickBigEnemySpawnIndex(this.wave, this.waveTargetCount);

        this.missiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.trails = this.add.group();
        this.houses = this.physics.add.group();
        this.ruinedHouses = this.physics.add.group();

        this.isEnemyDetected = false;
        this.isGameOver = false;
        this.multiIntercept = null;

        buildGameWorld(this, { houses: this.houses, missiles: this.missiles, ppm: this.PPM });

        this.shiftOriginX = this.turret.x;
        this.shiftOriginY = this.turret.y;

        this.gameHud = new GameHUD(this);
        this.missileLaunchInput = new MissileLaunchInput(this);
        this.interceptCalculator = new InterceptCalculator(this);
        this.calculatorToggleKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.dualInputTabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

        this.input.keyboard.on('keydown-TAB', (event) => {
            if (this.hasDualInputOpen()) {
                event.preventDefault();
            }
        });

        this.createReturnButton();

        setupGameCollisions(this);

        this._nextEnemyId = 1;
        this.startEnemySpawning();
    }

    pickBigEnemySpawnIndex(wave, count = getEnemyCount(wave)) {
        if (!isMultiInterceptWave(wave)) return -1;
        return Phaser.Math.Between(0, Math.max(0, count - 1));
    }

    createReturnButton() {
        const x = 200;
        const y = 680;

        this.returnButton = this.add.sprite(x, y, 'button3')
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .setDepth(10)
            .setScale(0.8);

        this.returnButton.on('pointerdown', function () {
            this.setTint(0xaaaaaa);
        });

        this.returnButton.on('pointerout', function () {
            this.clearTint();
        });

        this.returnButton.on('pointerup', () => {
            this.returnButton.clearTint();
            this.scene.start('Menu');
        });
    }

    update() {
        if (!this.isGameOver && this.houses.getLength() === 0) {
            this.triggerGameOver();
        }

        this.turret.update();
        this.gameHud.updateStatus(this.wave, this.houses.getLength());
        updateMultiIntercept(this);

        if (Phaser.Input.Keyboard.JustDown(this.calculatorToggleKey)) {
            this.interceptCalculator.toggle();
        }

        if (this.hasDualInputOpen()) {
            this.handleDualInputTab();
        }

        if (this.interceptCalculator.isVisible()) {
            this.interceptCalculator.update();
        }
        if (this.missileLaunchInput.isActive()) {
            this.missileLaunchInput.update();
        }

        this.cleanupMissiles();

        this.missiles.children.iterate((missile) => onPlayerHitGround(this, missile, null));
        this.enemies.children.iterate((enemy) => onEnemyHitGround(this, enemy, null));

        [this.missiles, this.enemies].forEach((group) => {
            group.children.iterate(GameMath.alignSpriteRotationToVelocity);
        });
    }

    startEnemySpawning() {
        if (this.isSpawnPaused || isMultiInterceptActive(this)) return;

        if (this.enemyCount >= this.waveTargetCount) {
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
        if (this.isEnemyDetected || isMultiInterceptActive(this)) return;

        const enemy = (new Enemy(this, this.houses, this.PPM)).setScale(0.7);
        if (enemy.active) {
            if (this.enemyCount === this.bigEnemySpawnIndex) {
                setupBigEnemy(enemy);
            }
            enemy.enemyId = this._nextEnemyId++;
            this.enemies.add(enemy);
            enemy.launch();
        }
    }

    checkForWave() {
        if (this.waveTargetCount <= this.enemyCount) {
            this.wave += 1;
            this.enemyCount = 0;
            this.waveTargetCount = getEnemyCount(this.wave);
            this.bigEnemySpawnIndex = this.pickBigEnemySpawnIndex(this.wave, this.waveTargetCount);

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
        clearMultiIntercept(this);
        this.missileLaunchInput.hide();
        this.interceptCalculator.hide();
        this.gameHud.dismissInterceptionPanel();

        if (this.enemySpawnTimer && this.enemySpawnTimer.active) {
            this.enemySpawnTimer.remove(false);
        }

        this.add.sprite(640, 280, 'game_over').setScale(0.8);

        const replayBtn = this.add.sprite(200, 615, 'button4').setInteractive({ useHandCursor: true });
        replayBtn.setScale(0.8);
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

        this.returnButton.setVisible(true);
    }

    hasDualInputOpen() {
        return this.interceptCalculator.isVisible() && this.missileLaunchInput.isActive();
    }

    focusLaunchInputField(field) {
        if (!this.missileLaunchInput.isActive()) return;
        this.missileLaunchInput.focusField(field);
        if (this.interceptCalculator.isVisible()) {
            this.interceptCalculator.clearFieldFocus();
        }
    }

    focusCalculatorField(fieldId) {
        if (!this.interceptCalculator.isVisible()) return;
        this.interceptCalculator.focusField(fieldId);
        if (this.missileLaunchInput.isActive()) {
            this.missileLaunchInput.clearFieldFocus();
        }
    }

    switchToLaunchPanel() {
        this.focusLaunchInputField('velocity');
    }

    switchToCalculatorPanel() {
        this.focusCalculatorField('mx');
    }

    handleDualInputTab() {
        if (!Phaser.Input.Keyboard.JustDown(this.dualInputTabKey)) return;

        if (this.missileLaunchInput.hasFieldFocus()) {
            this.switchToCalculatorPanel();
        } else if (this.interceptCalculator.hasFieldFocus()) {
            this.switchToLaunchPanel();
        }
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
        if (isMultiInterceptActive(this)) {
            this.isSpawnPaused = true;
            return;
        }
        this.isSpawnPaused = false;
        this.startEnemySpawning();
    }
}
