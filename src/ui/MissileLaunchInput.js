import {
    applyAppendDecimal,
    applyAppendDigit
} from '../utils/numericInput.js';

const PANEL_MARGIN = 16;
const PANEL_PAD = 16;
const ROW_H = 34;
const ROW_GAP = 10;

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
        this.activeField = 'angle'; // 'angle' | 'velocity'
        this.angleBuffer = '';
        this.velocityBuffer = '';
        this.errorText = '';

        const panelW = 320;
        const panelH = 132;
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
        const errorStyle = {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#f87171'
        };

        this.promptText = scene.add.text(PANEL_PAD, PANEL_PAD, 'LAUNCH MISSILE', titleStyle);

        const rowsY = PANEL_PAD + 30;

        this.angleRowBg = scene.add.graphics();
        this.angleRowBg.setPosition(PANEL_PAD, rowsY);
        this.velocityRowBg = scene.add.graphics();
        this.velocityRowBg.setPosition(PANEL_PAD, rowsY + ROW_H + ROW_GAP);

        this.angleLabelText = scene.add.text(PANEL_PAD + 10, rowsY + 7, 'Angle (deg)', labelStyle);
        this.velocityLabelText = scene.add.text(
            PANEL_PAD + 10,
            rowsY + ROW_H + ROW_GAP + 7,
            'Velocity (m/s)',
            labelStyle
        );

        const valueX = panelW - PANEL_PAD - 10;
        this.angleValueText = scene.add.text(valueX, rowsY + 4, '', bodyStyle);
        this.angleValueText.setOrigin(1, 0);
        this.velocityValueText = scene.add.text(valueX, rowsY + ROW_H + ROW_GAP + 4, '', bodyStyle);
        this.velocityValueText.setOrigin(1, 0);

        this.angleHit = scene.add.zone(
            PANEL_PAD + (panelW - PANEL_PAD * 2) / 2,
            rowsY + ROW_H / 2,
            panelW - PANEL_PAD * 2,
            ROW_H
        );
        this.velocityHit = scene.add.zone(
            PANEL_PAD + (panelW - PANEL_PAD * 2) / 2,
            rowsY + ROW_H + ROW_GAP + ROW_H / 2,
            panelW - PANEL_PAD * 2,
            ROW_H
        );
        this.angleHit.setInteractive({ useHandCursor: true });
        this.velocityHit.setInteractive({ useHandCursor: true });
        this.angleHit.on('pointerup', () => this.selectField('angle'));
        this.velocityHit.on('pointerup', () => this.selectField('velocity'));

        const errorY = rowsY + ROW_H * 2 + ROW_GAP + 8;
        this.errorLabel = scene.add.text(PANEL_PAD, errorY, '', errorStyle);

        this.container.add([
            bg,
            this.promptText,
            this.angleRowBg,
            this.velocityRowBg,
            this.angleLabelText,
            this.velocityLabelText,
            this.angleValueText,
            this.velocityValueText,
            this.errorLabel,
            this.angleHit,
            this.velocityHit
        ]);

        this.backspaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.upKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.downKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.periodKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
        this.numpadDecimalKey = scene.input.keyboard.addKey(110); // numpad period key
        this.digitKeys = DIGIT_KEYS.map((code) => scene.input.keyboard.addKey(code));
        this.numpadKeys = NUMPAD_KEYS.map((code) => scene.input.keyboard.addKey(code));
    }

    begin() {
        this.active = true;
        this.activeField = 'angle';
        this.angleBuffer = '';
        this.velocityBuffer = '';
        this.errorText = '';
        this.container.setVisible(true);
        this.refreshDisplay();
    }

    hide() {
        this.active = false;
        this.angleBuffer = '';
        this.velocityBuffer = '';
        this.errorText = '';
        this.container.setVisible(false);
    }

    isActive() {
        return this.active;
    }

    update() {
        if (!this.active) return;

        this.handleDigitInput();
        this.handleDecimalInput();
        this.handleBackspace();
        this.handleUpDown();
        this.handleEnter();
        this.refreshDisplay();
    }

    selectField(field) {
        if (!this.active) return;
        if (field !== 'angle' && field !== 'velocity') return;
        this.activeField = field;
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    getActiveBuffer() {
        return this.activeField === 'angle' ? this.angleBuffer : this.velocityBuffer;
    }

    setActiveBuffer(next) {
        if (this.activeField === 'angle') {
            this.angleBuffer = next;
        } else {
            this.velocityBuffer = next;
        }
    }

    appendDigit(digit) {
        if (!this.active) return;
        const current = this.getActiveBuffer();
        const next = applyAppendDigit(current, digit);
        if (next === current) return;
        this.setActiveBuffer(next);
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    appendDecimal() {
        if (!this.active) return;
        const current = this.getActiveBuffer();
        const next = applyAppendDecimal(current);
        if (next === current) return;
        this.setActiveBuffer(next);
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    backspace() {
        if (!this.active) return;
        const current = this.getActiveBuffer();
        this.setActiveBuffer(current.slice(0, -1));
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    rejectValue(message, invalidField = null) {
        this.errorText = message;
        if (invalidField === 'angle') {
            this.angleBuffer = '';
        } else if (invalidField === 'velocity') {
            this.velocityBuffer = '';
        }
        this.previewAngle();
        this.refreshDisplay();
    }

    confirm() {
        if (!this.active) return;

        if (this.angleBuffer === '' || this.velocityBuffer === '') {
            this.rejectValue('Enter both angle and velocity');
            return;
        }

        const angle = Number(this.angleBuffer);
        if (!Number.isFinite(angle)) {
            this.rejectValue('Invalid angle', 'angle');
            return;
        }
        if (angle < 10) {
            this.rejectValue('Angle must be at least 10 degrees', 'angle');
            return;
        }
        if (angle > 170) {
            this.rejectValue('Angle must be less than 170 degrees', 'angle');
            return;
        }

        const velocity = Number(this.velocityBuffer);
        if (!Number.isFinite(velocity)) {
            this.rejectValue('Invalid velocity', 'velocity');
            return;
        }
        if (velocity < 10) {
            this.rejectValue('Velocity must be at least 10 m/s', 'velocity');
            return;
        }
        if (velocity > 100) {
            this.rejectValue('Velocity must be less than 100 m/s', 'velocity');
            return;
        }

        this.scene.turret.launchMissileAt(angle, velocity);
        this.hide();
    }

    handleDigitInput() {
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
            this.selectField(this.activeField === 'angle' ? 'velocity' : 'angle');
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
            this.selectField(this.activeField === 'angle' ? 'velocity' : 'angle');
        }
    }

    handleEnter() {
        if (!Phaser.Input.Keyboard.JustDown(this.enterKey)) return;
        this.confirm();
    }

    previewAngle() {
        if (this.activeField !== 'angle' || this.angleBuffer === '') return;

        const angle = Number(this.angleBuffer);
        if (Number.isFinite(angle) && angle >= 10 && angle <= 170) {
            this.scene.turret.setTargetAngle(angle);
        }
    }

    refreshDisplay() {
        const angleDisplay = this.angleBuffer === '' ? '_' : this.angleBuffer;
        const velDisplay = this.velocityBuffer === '' ? '_' : this.velocityBuffer;
        this.angleValueText.setText(angleDisplay);
        this.velocityValueText.setText(velDisplay);

        const drawRow = (g, active) => {
            g.clear();
            g.fillStyle(active ? 0x1e3a5f : 0x0f172a, active ? 0.85 : 0.55);
            g.lineStyle(1, active ? 0x38bdf8 : 0x334155, active ? 0.9 : 0.6);
            const w = this.panelW - PANEL_PAD * 2;
            g.fillRoundedRect(0, 0, w, ROW_H, 6);
            g.strokeRoundedRect(0, 0, w, ROW_H, 6);
        };

        drawRow(this.angleRowBg, this.activeField === 'angle');
        drawRow(this.velocityRowBg, this.activeField === 'velocity');

        this.errorLabel.setText(this.errorText);
    }
}
