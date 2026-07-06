import {
    applyAppendDecimal,
    applyAppendDigit
} from '../utils/numericInput.js';

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
        this.step = 'angle';
        this.buffer = '';
        this.confirmedAngle = null;
        this.errorText = '';

        const panelW = 360;
        const panelH = 120;
        const pad = 16;
        const cx = scene.scale.width / 2 - panelW / 2;
        const cy = scene.scale.height * 0.1 - panelH / 2;

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
        const bodyStyle = {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '22px',
            color: '#f8fafc'
        };
        const hintStyle = {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#94a3b8'
        };
        const errorStyle = {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#f87171'
        };

        this.promptText = scene.add.text(pad, pad, '', titleStyle);
        this.valueText = scene.add.text(pad, pad + 30, '', bodyStyle);
        this.hintText = scene.add.text(
            pad,
            pad + 68,
            'Type number · Backspace delete · Enter confirm',
            hintStyle
        );
        this.errorLabel = scene.add.text(pad, pad + 88, '', errorStyle);

        this.container.add([bg, this.promptText, this.valueText, this.hintText, this.errorLabel]);

        this.backspaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.periodKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
        this.numpadDecimalKey = scene.input.keyboard.addKey(110); // numpad period key
        this.digitKeys = DIGIT_KEYS.map((code) => scene.input.keyboard.addKey(code));
        this.numpadKeys = NUMPAD_KEYS.map((code) => scene.input.keyboard.addKey(code));
    }

    begin() {
        this.active = true;
        this.step = 'angle';
        this.buffer = '';
        this.confirmedAngle = null;
        this.errorText = '';
        this.container.setVisible(true);
        this.refreshDisplay();
    }

    hide() {
        this.active = false;
        this.buffer = '';
        this.confirmedAngle = null;
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
        this.handleEnter();
        this.refreshDisplay();
    }

    appendDigit(digit) {
        if (!this.active) return;
        const next = applyAppendDigit(this.buffer, digit);
        if (next === this.buffer) return;
        this.buffer = next;
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    appendDecimal() {
        if (!this.active) return;
        const next = applyAppendDecimal(this.buffer);
        if (next === this.buffer) return;
        this.buffer = next;
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    backspace() {
        if (!this.active) return;
        this.buffer = this.buffer.slice(0, -1);
        this.errorText = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    rejectValue(message) {
        this.errorText = message;
        this.buffer = '';
        this.previewAngle();
        this.refreshDisplay();
    }

    confirm() {
        if (!this.active) return;

        if (this.buffer === '') {
            this.errorText = 'Enter a value first';
            this.refreshDisplay();
            return;
        }

        const value = Number(this.buffer);
        if (!Number.isFinite(value)) {
            this.rejectValue('Invalid number');
            return;
        }

        if (this.step === 'angle') {
            if (value < 10) {
                this.rejectValue('Angle must be at least 10 degrees');
                return;
            }
            if (value > 170) {
                this.rejectValue('Angle must be less than 170 degrees');
                return;
            }
            this.confirmedAngle = value;
            this.step = 'velocity';
            this.buffer = '';
            this.errorText = '';
            this.scene.turret.setTargetAngle(value);
            this.refreshDisplay();
            return;
        }

        if (value < 10) {
            this.rejectValue('Velocity must be at least 10 m/s');
            return;
        }
        if (value > 100) {
            this.rejectValue('Velocity must be less than 100 m/s');
            return;
        }

        this.scene.turret.launchMissileAt(this.confirmedAngle, value);
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

    handleEnter() {
        if (!Phaser.Input.Keyboard.JustDown(this.enterKey)) return;
        this.confirm();
    }

    previewAngle() {
        if (this.step !== 'angle' || this.buffer === '') return;

        const angle = Number(this.buffer);
        if (Number.isFinite(angle) && angle >= 10 && angle <= 170) {
            this.scene.turret.setTargetAngle(angle);
        }
    }

    refreshDisplay() {
        if (this.step === 'angle') {
            this.promptText.setText('Enter launch angle (degrees)');
        } else {
            this.promptText.setText('Enter launch velocity (m/s)');
        }

        const display = this.buffer === '' ? '_' : this.buffer;
        this.valueText.setText(display);
        this.errorLabel.setText(this.errorText);
    }
}
