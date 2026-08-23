import { solveInterceptLaunch } from '../utils/interceptSolver.js';

const COLORS = {
    ink: '#e2e8f0',
    muted: '#94a3b8',
    cyan: 0x38bdf8,
    amber: 0xf59e0b,
    red: 0xfb7185,
    green: 0x4ade80,
    panel: 0x0c1224
};

function format(value, digits = 2) {
    if (!Number.isFinite(value)) return '?';
    return Number(value).toFixed(digits);
}

export default class Solution extends Phaser.Scene {
    constructor() {
        super('Solution');
    }

    init(data) {
        this.solverInputs = data?.solverInputs || null;
    }

    create() {
        this.stage = 0;
        this.tweens.killAll();

        const result = this.solverInputs && solveInterceptLaunch(
            this.solverInputs.missilePos,
            this.solverInputs.interceptPos,
            this.solverInputs.missileVel
        );

        if (!result?.ok) {
            this.createErrorState(result?.message || 'No solution data');
            return;
        }

        this.result = result;
        this.calculations = result.calculations;
        this.createWorld();
        this.createLessonPanel();
        this.createNavigationButtons();
        this.createBackButton();
        this.updateStage();
        this.events.once('shutdown', this.cleanup, this);
    }

    createWorld() {
        const width = this.scale.width;
        const height = this.scale.height;
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        this.add.text(32, 24, 'INTERCEPT SOLUTION', {
            fontFamily: 'Arial', fontSize: '24px', color: COLORS.ink, fontStyle: 'bold'
        });
        this.add.text(34, 56, 'A visual walkthrough of the current launch calculation', {
            fontFamily: 'Arial', fontSize: '14px', color: COLORS.muted
        });

        this.worldLeft = 35;
        this.worldTop = 105;
        this.worldWidth = 700;
        this.worldBottom = height - 72;
        this.worldGraphics = this.add.graphics().setDepth(2);
        this.worldLabels = this.add.group();

        const dome = this.add.image(370, this.worldBottom, 'dome').setScale(0.56).setOrigin(0.5, 1);
        dome.setAlpha(0.5).setDepth(1);
        this.add.image(370, this.worldBottom, 'minInterceptDome').setScale(0.56).setOrigin(0.5, 1).setAlpha(0.35).setDepth(1);

        this.turretPoint = { x: 370, y: this.worldBottom - 2 };
        this.add.image(this.turretPoint.x, this.turretPoint.y, 'turretbase').setDepth(3);
        this.add.image(this.turretPoint.x, this.turretPoint.y - 18, 'turrettop').setAngle(-38).setDepth(3);

        const positions = [
            this.solverInputs.missilePos,
            this.solverInputs.interceptPos
        ];
        const maxValue = Math.max(
            40,
            ...positions.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)])
        );
        this.diagramScale = Math.min(4.5, 245 / maxValue);
        this.missilePoint = this.toDiagramPoint(this.solverInputs.missilePos);
        this.interceptPoint = this.toDiagramPoint(this.solverInputs.interceptPos);

        this.enemy = this.add.image(this.missilePoint.x, this.missilePoint.y, 'enemy')
            .setScale(0.42).setDepth(4).setAlpha(0);
        this.interceptMarker = this.add.circle(this.interceptPoint.x, this.interceptPoint.y, 9, COLORS.amber, 1)
            .setStrokeStyle(2, 0xfff7ed).setDepth(4).setAlpha(0);
        this.add.text(this.interceptPoint.x + 12, this.interceptPoint.y - 8, 'INTERCEPT', {
            fontFamily: 'Arial', fontSize: '12px', color: '#fef3c7', fontStyle: 'bold'
        }).setDepth(5).setAlpha(0).setName('interceptLabel');

        this.vectorGraphics = this.add.graphics().setDepth(5);
        this.equationGraphics = this.add.graphics().setDepth(5);
    }

    toDiagramPoint(point) {
        return {
            x: this.turretPoint.x + point.x * this.diagramScale,
            y: this.turretPoint.y - point.y * this.diagramScale
        };
    }

    createLessonPanel() {
        const x = 770;
        const y = 105;
        const width = this.scale.width - x - 28;
        const height = 535;
        this.add.rectangle(x, y, width, height, COLORS.panel, 0.94)
            .setOrigin(0).setStrokeStyle(2, COLORS.cyan, 0.8);
        this.add.text(x + 18, y + 16, 'HOW THE LAUNCH IS FOUND', {
            fontFamily: 'Arial', fontSize: '18px', color: '#7dd3fc', fontStyle: 'bold'
        });
        this.stepText = this.add.text(x + 18, y + 56, '', {
            fontFamily: 'Consolas, Courier New, monospace', fontSize: '15px', color: COLORS.ink,
            lineSpacing: 8, wordWrap: { width: width - 36 }
        });
        this.progressText = this.add.text(x + 18, y + height - 36, '', {
            fontFamily: 'Arial', fontSize: '13px', color: COLORS.muted
        });
        this.panelX = x;
        this.panelY = y;
        this.panelWidth = width;
        this.panelHeight = height;
    }

    createNavigationButtons() {
        const buttonY = this.panelY + this.panelHeight - 92;
        this.previousButton = this.createLessonButton(
            this.panelX + 18,
            buttonY,
            112,
            'Previous',
            () => this.changeStage(-1)
        );
        this.nextButton = this.createLessonButton(
            this.panelX + this.panelWidth - 130,
            buttonY,
            112,
            'Next',
            () => this.changeStage(1)
        );
    }

    createLessonButton(x, y, width, label, onClick) {
        const background = this.add.graphics();
        const text = this.add.text(x + width / 2, y + 16, label, {
            fontFamily: 'Arial', fontSize: '13px', color: COLORS.ink, fontStyle: 'bold'
        }).setOrigin(0.5);
        const hitArea = this.add.zone(x + width / 2, y + 16, width, 32)
            .setInteractive({ useHandCursor: true });

        const draw = (hovered = false) => {
            const enabled = label === 'Previous' ? this.stage > 0 : this.stage < 5;
            background.clear();
            background.fillStyle(enabled ? (hovered ? 0x1e3a5f : 0x0f172a) : 0x111827, enabled ? 0.95 : 0.55);
            background.lineStyle(1.5, enabled ? (hovered ? 0x7dd3fc : COLORS.cyan) : 0x334155, enabled ? 0.9 : 0.5);
            background.fillRoundedRect(x, y, width, 32, 5);
            background.strokeRoundedRect(x, y, width, 32, 5);
            text.setColor(enabled ? COLORS.ink : '#64748b');
            hitArea.setVisible(enabled);
        };

        hitArea.on('pointerup', onClick);
        hitArea.on('pointerover', () => draw(true));
        hitArea.on('pointerout', () => draw(false));
        draw();
        return { draw };
    }

    createBackButton() {
        this.backButton = this.add.image(120, this.scale.height - 26, 'button3')
            .setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(20);
        this.backButton.on('pointerdown', () => this.backButton.setTint(0xaaaaaa));
        this.backButton.on('pointerout', () => this.backButton.clearTint());
        this.backButton.on('pointerup', () => {
            this.backButton.clearTint();
            this.scene.stop('Solution');
            this.scene.resume('Game');
            this.scene.get('Game').interceptCalculator?.drawShowButton(false);
        });
    }

    changeStage(amount) {
        const nextStage = Phaser.Math.Clamp(this.stage + amount, 0, 5);
        if (nextStage === this.stage) return;
        this.stage = nextStage;
        this.updateStage();
    }

    updateStage() {
        const { missilePos, interceptPos, missileVel } = this.solverInputs;
        const c = this.calculations;
        const stageText = [
            `1. Locate the intercept\n\nMissile: (${format(missilePos.x)}, ${format(missilePos.y)}) m\nIntercept: (${format(interceptPos.x)}, ${format(interceptPos.y)}) m\n\nThe amber point is where the missile will be met.`,
            `2. Find time until intercept\n\nΔx = x₂ - x₁\nΔx = ${format(interceptPos.x)} - ${format(missilePos.x)}\n   = ${format(c.deltaX)} m\n\ns = vt\nt = s / v\nt = ${format(c.distance)} / ${format(c.enemySpeedX)}\n  = ${format(c.time)} s`,
            `3. Find horizontal launch velocity\n\ns = vt\nv = s / t\nv = ${format(interceptPos.x)} / ${format(c.time)}\n  = ${format(c.launchVx)} m/s`,
            `4. Find vertical launch velocity\n\ns = ut + ½at²\nu = (s - ½at²) / t\n\nu = (${format(interceptPos.y)} - 0.5 × ${format(c.gravity)} × ${format(c.time)}²) / ${format(c.time)}\nu = ${format(c.launchVy)} m/s`,
            `5. Add the velocity components\n\nVelocity vector = (vₓ, vᵧ)\n                = (${format(c.launchVx)}, ${format(c.launchVy)}) m/s\n\nv = √(vₓ² + vᵧ²)\nv = ${format(c.speed)} m/s`,
            `6. Find the launch angle\n\nangle = tan⁻¹(vᵧ / vₓ)\n      = tan⁻¹(${format(c.launchVy)} / ${format(c.launchVx)})\n      = ${format(c.angleDeg)}°\n\nLaunch with ${format(c.speed)} m/s at ${format(c.angleDeg)}°`
        ];
        this.stepText.setText(stageText[Math.min(this.stage, stageText.length - 1)]);
        this.progressText.setText(`STEP ${Math.min(this.stage + 1, stageText.length)} / ${stageText.length}`);
        this.drawStage();
        this.previousButton?.draw();
        this.nextButton?.draw();
    }

    drawStage() {
        const stage = this.stage;
        const c = this.calculations;
        this.enemy.setAlpha(stage >= 1 ? 1 : 0);
        this.interceptMarker.setAlpha(stage >= 0 ? 1 : 0);
        this.worldLabels.getChildren().forEach((label) => label.destroy());
        this.worldLabels.add(this.add.text(this.missilePoint.x + 12, this.missilePoint.y - 22, 'MISSILE', {
            fontFamily: 'Arial', fontSize: '12px', color: '#fecdd3', fontStyle: 'bold'
        }).setAlpha(stage >= 1 ? 1 : 0).setDepth(6));
        this.worldLabels.add(this.add.text(this.turretPoint.x - 42, this.turretPoint.y + 10, 'TURRET', {
            fontFamily: 'Arial', fontSize: '12px', color: COLORS.ink
        }).setDepth(6));

        this.vectorGraphics.clear();
        this.equationGraphics.clear();
        if (stage >= 1) this.drawDeltaX();
        if (stage >= 1) this.drawEnemyVelocity(c);
        if (stage >= 2) this.drawLaunchVector(c, stage >= 4 ? COLORS.green : COLORS.cyan);
        if (stage >= 4) this.drawResultant(c);
    }

    drawDeltaX() {
        const y = this.missilePoint.y + 28;
        this.vectorGraphics.lineStyle(2, COLORS.amber, 1);
        this.vectorGraphics.lineBetween(this.missilePoint.x, y, this.interceptPoint.x, y);
        this.vectorGraphics.lineBetween(this.missilePoint.x, y - 7, this.missilePoint.x, y + 7);
        this.vectorGraphics.lineBetween(this.interceptPoint.x, y - 7, this.interceptPoint.x, y + 7);
        this.worldLabels.add(this.add.text((this.missilePoint.x + this.interceptPoint.x) / 2, y + 10, `delta x = ${format(this.calculations.deltaX)} m`, {
            fontFamily: 'Arial', fontSize: '13px', color: '#fef3c7'
        }).setOrigin(0.5, 0).setDepth(6));
    }

    drawEnemyVelocity(c) {
        const velocity = this.solverInputs.missileVel;
        this.drawArrow(this.missilePoint, {
            x: this.missilePoint.x + velocity.x * this.diagramScale * 2,
            y: this.missilePoint.y - velocity.y * this.diagramScale * 2
        }, COLORS.red);
        this.worldLabels.add(this.add.text(this.missilePoint.x + 18, this.missilePoint.y + 18, `enemy v = (${format(this.solverInputs.missileVel.x)}, ${format(this.solverInputs.missileVel.y)}) m/s`, {
            fontFamily: 'Arial', fontSize: '12px', color: '#fecdd3'
        }).setDepth(6));
    }

    drawLaunchVector(c, color) {
        this.drawArrow(this.turretPoint, this.interceptPoint, color);
        this.worldLabels.add(this.add.text(this.turretPoint.x + 12, this.turretPoint.y - 64, 'launch velocity', {
            fontFamily: 'Arial', fontSize: '12px', color: color === COLORS.green ? '#bbf7d0' : '#bae6fd'
        }).setDepth(6));
    }

    drawResultant(c) {
        const end = { x: this.turretPoint.x + c.launchVx * this.diagramScale * 2, y: this.turretPoint.y - c.launchVy * this.diagramScale * 2 };
        this.drawArrow(this.turretPoint, end, COLORS.green);
    }

    drawArrow(start, end, color) {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        this.vectorGraphics.lineStyle(3, color, 1);
        this.vectorGraphics.lineBetween(start.x, start.y, end.x, end.y);
        this.vectorGraphics.fillStyle(color, 1);
        this.vectorGraphics.beginPath();
        this.vectorGraphics.moveTo(end.x, end.y);
        this.vectorGraphics.lineTo(end.x - 12 * Math.cos(angle - 0.45), end.y - 12 * Math.sin(angle - 0.45));
        this.vectorGraphics.lineTo(end.x - 12 * Math.cos(angle + 0.45), end.y - 12 * Math.sin(angle + 0.45));
        this.vectorGraphics.closePath();
        this.vectorGraphics.fillPath();
    }

    createErrorState(message) {
        this.add.text(640, 300, message, {
            fontFamily: 'Arial', fontSize: '24px', color: '#fecdd3'
        }).setOrigin(0.5);
        this.createBackButton();
    }

    cleanup() {
        this.tweens.killAll();
    }
}
