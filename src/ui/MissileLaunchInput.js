import {
    applyAppendDecimal,
    applyAppendDigit
} from '../utils/numericInput.js';

const PANEL_MARGIN = 16;
const PANEL_PAD = 16;
const ROW_H = 34;
const ROW_GAP = 10;
const VEL_SECTION_H = 72;
const VEL_MIN = 10;
const VEL_MAX = 120;
const VEL_SCALE_MAX = 120;
const VEL_SCALE_LABELS = [0, 20, 40, 60, 80, 100, 120];
const VEL_TICK_COUNT = 12; // 12 × 10 m/s steps from 0 to 120
/** Full round-trip duration (start → end → start), milliseconds. */
const VEL_SWEEP_CYCLE_MS = 2200;

const DIGIT_KEYS = [
    Phaser.Input.Keyboard.KeyCodes.ZERO,
    Phaser.Input.Keyboard.KeyCodes.ONE,
    Phaser.Input.Keyboard.KeyCodes.TWO,
    Phaser.Input.Keyboard.KeyCodes.THREE,
    Phaser.Input.Keyboard.KeyCodes.FOUR,
    Phaser.Input.Keyboard.KeyCodes.FIVE,
    Phaser.Input.Keyboard.KeyCodes.SIX,
    Phaser.Input.Keyboard.KeyCodes.SEVEN,
    Phaser.Input.Keyboard.KeyCodes.EIGHT,
    Phaser.Input.Keyboard.KeyCodes.NINE
];

const NUMPAD_KEYS = [
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_SEVEN,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT,
    Phaser.Input.Keyboard.KeyCodes.NUMPAD_NINE
];

export class MissileLaunchInput {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.activeField = 'velocity'; // 'angle' | 'velocity' | null
        this.lastFocusedField = 'velocity';
        this.angleBuffer = '';
        this.velocityBuffer = '';
        this.velocityLocked = false;
        this.angleLocked = false;
        this.velocitySweepElapsed = 0;
        this.errorText = '';

        const panelW = 320;
        const panelH = 188;
        this.panelW = panelW;
        this.panelH = panelH;
        const cx = scene.scale.width - panelW - PANEL_MARGIN;
        const cy = PANEL_MARGIN;

        this.container = scene.add.container(cx, cy);
        this.container.setScrollFactor(0);
        this.container.setDepth(2100);
        this.container.setVisible(false);

        const bg = scene.add.graphics();
        bg.fillStyle(0x0c1224, 0.94);
        bg.lineStyle(2, 0x38bdf8, 0.9);
        bg.fillRoundedRect(0, 0, panelW, panelH, 8);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 8);

        const titleStyle = {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#7dd3fc',
            fontStyle: 'bold'
        };
        const labelStyle = {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#cbd5e1'
        };
        const bodyStyle = {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '22px',
            color: '#f8fafc'
        };
        const hintStyle = {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#94a3b8'
        };
        const tickStyle = {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#94a3b8'
        };
        const errorStyle = {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#f87171'
        };

        this.promptText = scene.add.text(PANEL_PAD, PANEL_PAD, 'LAUNCH MISSILE', titleStyle);

        const rowsY = PANEL_PAD + 30;
        this.velocitySectionY = rowsY;
        this.angleRowY = rowsY + VEL_SECTION_H + ROW_GAP;

        this.velocityRowBg = scene.add.graphics();
        this.velocityRowBg.setPosition(PANEL_PAD, this.velocitySectionY);
        this.angleRowBg = scene.add.graphics();
        this.angleRowBg.setPosition(PANEL_PAD, this.angleRowY);

        this.velocityLabelText = scene.add.text(PANEL_PAD + 10, this.velocitySectionY + 6, 'Velocity (m/s)', labelStyle);
        this.velocityHintText = scene.add.text(
            panelW - PANEL_PAD - 10,
            this.velocitySectionY + 7,
            'SPACE to lock',
            hintStyle
        );
        this.velocityHintText.setOrigin(1, 0);

        this.velocityTrackGfx = scene.add.graphics();
        this.velocityTrackGfx.setPosition(PANEL_PAD, this.velocitySectionY);

        this.velocityScaleLabels = VEL_SCALE_LABELS.map((value) => {
            const text = scene.add.text(0, 0, `${value}`, tickStyle);
            if (value === 0) {
                text.setOrigin(0, 0);
            } else if (value === VEL_SCALE_MAX) {
                text.setOrigin(1, 0);
            } else {
                text.setOrigin(0.5, 0);
            }
            return { value, text };
        });

        this.angleLabelText = scene.add.text(PANEL_PAD + 10, this.angleRowY + 7, 'Angle (deg)', labelStyle);
        const valueX = panelW - PANEL_PAD - 10;
        this.angleValueText = scene.add.text(valueX, this.angleRowY + 4, '', bodyStyle);
        this.angleValueText.setOrigin(1, 0);

        this.velocityHit = scene.add.zone(
            PANEL_PAD + (panelW - PANEL_PAD * 2) / 2,
            this.velocitySectionY + VEL_SECTION_H / 2,
            panelW - PANEL_PAD * 2,
            VEL_SECTION_H
        );
        this.angleHit = scene.add.zone(
            PANEL_PAD + (panelW - PANEL_PAD * 2) / 2,
            this.angleRowY + ROW_H / 2,
            panelW - PANEL_PAD * 2,
            ROW_H
        );
        this.angleHit.setInteractive({ useHandCursor: true });
        this.velocityHit.setInteractive({ useHandCursor: true });
        this.angleHit.on('pointerup', () => this.selectField('angle'));
        this.velocityHit.on('pointerup', () => this.selectField('velocity'));

        const errorY = this.angleRowY + ROW_H + 8;
        this.errorLabel = scene.add.text(PANEL_PAD, errorY, '', errorStyle);

        this.trackLeft = 10;
        this.trackWidth = panelW - PANEL_PAD * 2 - 20;
        this.trackY = 30;
        this.trackH = 14;

        const tickY = this.velocitySectionY + this.trackY + this.trackH + 2;
        this.velocityScaleLabels.forEach(({ value, text }) => {
            const x = PANEL_PAD + this.trackLeft + (this.trackWidth * value) / VEL_SCALE_MAX;
            text.setPosition(x, tickY);
        });

        this.container.add([
            bg,
            this.promptText,
            this.velocityRowBg,
            this.angleRowBg,
            this.velocityLabelText,
            this.velocityHintText,
            this.velocityTrackGfx,
            ...this.velocityScaleLabels.map(({ text }) => text),
            this.angleLabelText,
            this.angleValueText,
            this.errorLabel,
            this.angleHit,
            this.velocityHit
        ]);

        this.backspaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.upKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.downKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.periodKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
        this.numpadDecimalKey = scene.input.keyboard.addKey(110); // numpad period key
        this.digitKeys = DIGIT_KEYS.map((code) => scene.input.keyboard.addKey(code));
        this.numpadKeys = NUMPAD_KEYS.map((code) => scene.input.keyboard.addKey(code));
    }

    begin() {
        this.active = true;
        this.activeField = 'velocity';
        this.lastFocusedField = 'velocity';
        this.angleBuffer = '';
        this.velocityBuffer = '';
        this.velocityLocked = false;
        this.angleLocked = false;
        this.velocitySweepElapsed = 0;
        this.errorText = '';
        this.container.setVisible(true);
        if (this.scene.hasDualInputOpen()) {
            this.scene.focusLaunchInputField('velocity');
        } else {
            this.refreshDisplay();
        }
    }

    hide() {
        this.active = false;
        this.angleBuffer = '';
        this.velocityBuffer = '';
        this.velocityLocked = false;
        this.angleLocked = false;
        this.velocitySweepElapsed = 0;
        this.errorText = '';
        this.container.setVisible(false);
    }

    isActive() {
        return this.active;
    }

    update(time, delta) {
        if (!this.active) return;
        if (this.scene.hasDualInputOpen() && !this.hasFieldFocus()) return;

        const dt = typeof delta === 'number' ? delta : this.scene.game.loop.delta;
        this.updateVelocitySweep(dt);
        this.updateAngleFromMouse();
        this.handleSpaceLock();
        this.handleDigitInput();
        this.handleDecimalInput();
        this.handleBackspace();
        this.handleUpDown();
        this.handleEnter();
        this.refreshDisplay();
    }

    hasFieldFocus() {
        return this.activeField !== null;
    }

    focusField(field) {
        if (!this.active) return;
        if (field !== 'angle' && field !== 'velocity') return;
        this.activeField = field;
        this.lastFocusedField = field;
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    clearFieldFocus() {
        if (!this.active) return;
        if (this.activeField !== null) {
            this.lastFocusedField = this.activeField;
        }
        this.activeField = null;
        this.refreshDisplay();
    }

    restoreFieldFocus() {
        if (!this.active) return;
        this.focusField(this.lastFocusedField);
    }

    selectField(field) {
        if (!this.active) return;
        if (this.scene.hasDualInputOpen()) {
            this.scene.focusLaunchInputField(field);
            return;
        }
        this.focusField(field);
    }

    appendDigit(digit) {
        if (!this.active || this.activeField !== 'angle' || this.angleLocked) return;
        const current = this.angleBuffer;
        const next = applyAppendDigit(current, digit);
        if (next === current) return;
        this.angleBuffer = next;
        this.angleLocked = false;
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    appendDecimal() {
        if (!this.active || this.activeField !== 'angle' || this.angleLocked) return;
        const current = this.angleBuffer;
        const next = applyAppendDecimal(current);
        if (next === current) return;
        this.angleBuffer = next;
        this.angleLocked = false;
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    backspace() {
        if (!this.active) return;

        if (this.activeField === 'velocity') {
            if (this.velocityLocked) {
                this.unlockVelocity();
            }
            return;
        }

        if (this.activeField !== 'angle') return;
        if (this.angleLocked) {
            this.unlockAngle();
            this.refreshDisplay();
            return;
        }
        this.angleBuffer = this.angleBuffer.slice(0, -1);
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    rejectValue(message, invalidField = null) {
        this.errorText = message;
        if (invalidField === 'angle') {
            this.angleBuffer = '';
            this.angleLocked = false;
        } else if (invalidField === 'velocity') {
            this.unlockVelocity();
        }
        this.previewAngle();
        this.refreshDisplay();
    }

    validateField(field) {
        if (field === 'velocity') {
            if (!this.velocityLocked || this.velocityBuffer === '') {
                return { message: 'Press SPACE to lock velocity' };
            }

            const value = Number(this.velocityBuffer);
            if (!Number.isFinite(value)) {
                return { message: 'Invalid velocity' };
            }
            if (value < VEL_MIN) {
                return { message: `Velocity must be at least ${VEL_MIN} m/s` };
            }
            if (value > VEL_MAX) {
                return { message: `Velocity must be at most ${VEL_MAX} m/s` };
            }
            return null;
        }

        const buffer = this.angleBuffer;
        if (buffer === '') {
            return { message: 'Enter angle' };
        }

        const value = Number(buffer);
        if (!Number.isFinite(value)) {
            return { message: 'Invalid angle' };
        }
        if (value < 10) {
            return { message: 'Angle must be at least 10 degrees' };
        }
        if (value > 170) {
            return { message: 'Angle must be less than 170 degrees' };
        }

        return null;
    }

    confirm() {
        if (!this.active) return;

        if (this.angleLocked && this.velocityLocked) {
            this.scene.turret.launchMissileAt(Number(this.angleBuffer), Number(this.velocityBuffer));
            this.hide();
            return;
        }

        const activeLocked = this.activeField === 'angle'
            ? this.angleLocked
            : this.velocityLocked;
        if (activeLocked) {
            const otherField = this.activeField === 'angle' ? 'velocity' : 'angle';
            this.activeField = otherField;
            this.errorText = '';
            this.refreshDisplay();
        }
    }

    updateVelocitySweep(delta) {
        if (this.velocityLocked || this.activeField !== 'velocity') return;
        this.velocitySweepElapsed += delta;
    }

    getSweepProgress() {
        const cycle = ((this.velocitySweepElapsed % VEL_SWEEP_CYCLE_MS) + VEL_SWEEP_CYCLE_MS) % VEL_SWEEP_CYCLE_MS;
        const t = cycle / VEL_SWEEP_CYCLE_MS;
        // Ping-pong: 0 → 1 → 0
        return t < 0.5 ? t * 2 : 2 - t * 2;
    }

    getLiveVelocity() {
        if (this.velocityLocked) {
            return Number(this.velocityBuffer);
        }
        const progress = this.getSweepProgress();
        return Math.round(VEL_MIN + progress * (VEL_MAX - VEL_MIN));
    }

    lockVelocity() {
        const velocity = this.getLiveVelocity();
        this.velocityBuffer = `${velocity}`;
        this.velocityLocked = true;
        this.errorText = '';
    }

    unlockVelocity() {
        this.velocityLocked = false;
        this.velocityBuffer = '';
        this.errorText = '';
    }

    lockAngle() {
        this.angleLocked = true;
        this.errorText = '';
    }

    unlockAngle() {
        this.angleLocked = false;
        this.errorText = '';
    }

    handleSpaceLock() {
        if (!Phaser.Input.Keyboard.JustDown(this.spaceKey)) return;

        if (this.activeField === 'velocity') {
            if (this.velocityLocked) {
                this.unlockVelocity();
            } else {
                this.lockVelocity();
            }
        } else if (this.activeField === 'angle') {
            if (this.angleLocked) {
                this.unlockAngle();
            } else {
                const angleError = this.validateField('angle');
                if (angleError) {
                    this.rejectValue(angleError.message, 'angle');
                    return;
                }
                this.lockAngle();
            }
        }
        this.refreshDisplay();
    }

    handleDigitInput() {
        if (this.activeField !== 'angle') return;

        this.digitKeys.forEach((key, digit) => {
            if (Phaser.Input.Keyboard.JustDown(key)) {
                this.appendDigit(digit);
            }
        });

        this.numpadKeys.forEach((key, digit) => {
            if (Phaser.Input.Keyboard.JustDown(key)) {
                this.appendDigit(digit);
            }
        });
    }

    handleDecimalInput() {
        if (this.activeField !== 'angle') return;
        if (
            Phaser.Input.Keyboard.JustDown(this.periodKey) ||
            Phaser.Input.Keyboard.JustDown(this.numpadDecimalKey)
        ) {
            this.appendDecimal();
        }
    }

    handleBackspace() {
        if (!Phaser.Input.Keyboard.JustDown(this.backspaceKey)) return;
        this.backspace();
    }

    handleUpDown() {
        if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
            this.selectField('velocity');
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
            this.selectField('angle');
        }
    }

    handleEnter() {
        if (!Phaser.Input.Keyboard.JustDown(this.enterKey)) return;
        this.confirm();
    }

    previewAngle() {
        if (this.activeField !== 'angle' || this.angleLocked || this.angleBuffer === '') return;

        const angle = Number(this.angleBuffer);
        if (Number.isFinite(angle) && angle >= 10 && angle <= 170) {
            this.scene.turret.setTargetAngle(angle);
        }
    }

    updateAngleFromMouse() {
        if (this.activeField !== 'angle' || this.angleLocked) return;

        const pointer = this.scene.input.activePointer;
        const turret = this.scene.turret;
        if (!pointer || !turret) return;

        const pointerX = pointer.worldX;
        const pointerY = pointer.worldY;
        if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) return;

        const deltaX = pointerX - turret.x;
        const deltaY = turret.y - pointerY;
        if (deltaX === 0 && deltaY === 0) return;

        const pointerAngle = Phaser.Math.RadToDeg(Math.atan2(deltaY, deltaX));
        const angle = pointerAngle < 0
            ? (pointerAngle < -90 ? 170 : 10)
            : Phaser.Math.Clamp(pointerAngle, 10, 170);
        this.angleBuffer = `${Math.round(angle * 100) / 100}`;
        this.scene.turret.setTargetAngle(angle);
        this.errorText = '';
    }

    drawVelocityTrack(active) {
        const g = this.velocityTrackGfx;
        g.clear();

        const left = this.trackLeft;
        const top = this.trackY;
        const w = this.trackWidth;
        const h = this.trackH;

        g.fillStyle(0x020617, 0.95);
        g.fillRoundedRect(left, top, w, h, 4);
        g.lineStyle(1, active ? 0x38bdf8 : 0x475569, active ? 0.9 : 0.55);
        g.strokeRoundedRect(left, top, w, h, 4);

        // Scale ticks every 10 m/s; majors at 0, 20, 40, 60, 80, 100, 120
        for (let i = 0; i <= VEL_TICK_COUNT; i += 1) {
            const x = left + (w * i) / VEL_TICK_COUNT;
            const major = i % 2 === 0;
            g.lineStyle(1, major ? 0x94a3b8 : 0x475569, major ? 0.9 : 0.55);
            g.beginPath();
            g.moveTo(x, top);
            g.lineTo(x, top + (major ? h : h * 0.55));
            g.strokePath();
        }

        const velocity = this.velocityLocked ? Number(this.velocityBuffer) : this.getLiveVelocity();
        const markerX = left + Phaser.Math.Clamp(velocity / VEL_SCALE_MAX, 0, 1) * w;

        // Fill behind marker
        g.fillStyle(this.velocityLocked ? 0x22c55e : 0x38bdf8, this.velocityLocked ? 0.35 : 0.22);
        g.fillRoundedRect(left + 1, top + 1, Math.max(0, markerX - left - 1), h - 2, 3);

        // Moving / locked bar
        const barW = 4;
        g.fillStyle(this.velocityLocked ? 0x4ade80 : 0xf8fafc, 1);
        g.fillRect(markerX - barW / 2, top - 3, barW, h + 6);
        g.lineStyle(1, this.velocityLocked ? 0x166534 : 0x0ea5e9, 0.9);
        g.strokeRect(markerX - barW / 2, top - 3, barW, h + 6);
    }

    refreshDisplay() {
        const angleDisplay = this.angleBuffer === '' ? '_' : this.angleBuffer;
        this.angleValueText.setText(angleDisplay);
        this.angleValueText.setColor(this.angleLocked ? '#4ade80' : '#f8fafc');

        const liveVelocity = this.getLiveVelocity();
        const velSuffix = this.velocityLocked ? ' LOCKED' : '';
        this.velocityHintText.setText(this.velocityLocked ? 'SPACE to unlock' : 'SPACE to lock');

        const drawRow = (g, active, height) => {
            g.clear();
            g.fillStyle(active ? 0x1e3a5f : 0x0f172a, active ? 0.85 : 0.55);
            g.lineStyle(1, active ? 0x38bdf8 : 0x334155, active ? 0.9 : 0.6);
            const w = this.panelW - PANEL_PAD * 2;
            g.fillRoundedRect(0, 0, w, height, 6);
            g.strokeRoundedRect(0, 0, w, height, 6);
        };

        drawRow(this.velocityRowBg, this.activeField === 'velocity', VEL_SECTION_H);
        drawRow(this.angleRowBg, this.activeField === 'angle', ROW_H);
        this.drawVelocityTrack(this.activeField === 'velocity');

        this.errorLabel.setText(this.errorText);
    }
}
