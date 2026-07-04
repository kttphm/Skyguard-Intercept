const KEY_W = 56;
const KEY_H = 48;
const KEY_GAP = 8;
const PANEL_PAD = 16;

const KEY_ROWS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['⌫', '0', 'Enter']
];

export class OnScreenKeypad {
    constructor(scene, launchInput) {
        this.scene = scene;
        this.launchInput = launchInput;
        this.keys = [];

        const cols = 3;
        const gridW = cols * KEY_W + (cols - 1) * KEY_GAP;
        const gridH = KEY_ROWS.length * KEY_H + (KEY_ROWS.length - 1) * KEY_GAP;
        const hintH = 18;
        const panelW = gridW + PANEL_PAD * 2;
        const panelH = gridH + PANEL_PAD * 2 + hintH + 8;

        const margin = 16;
        const cx = scene.scale.width - panelW - margin;
        const cy = scene.scale.height - panelH - margin;

        this.container = scene.add.container(cx, cy);
        this.container.setScrollFactor(0);
        this.container.setDepth(2100);
        this.container.setVisible(false);

        if (scene.input) {
            scene.input.setTopOnly(false);
        }

        const bg = scene.add.graphics();
        bg.fillStyle(0x0c1224, 0.94);
        bg.lineStyle(2, 0x38bdf8, 0.9);
        bg.fillRoundedRect(0, 0, panelW, panelH, 8);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 8);

        const hintStyle = {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#94a3b8'
        };
        this.hintText = scene.add.text(
            PANEL_PAD,
            PANEL_PAD,
            'Keypad active when launch input is open',
            hintStyle
        );

        const gridY = PANEL_PAD + hintH + 8;
        KEY_ROWS.forEach((row, rowIndex) => {
            row.forEach((label, colIndex) => {
                const x = PANEL_PAD + colIndex * (KEY_W + KEY_GAP);
                const y = gridY + rowIndex * (KEY_H + KEY_GAP);
                const key = this.createKey(label, x, y);
                this.keys.push(key);
            });
        });

        this.container.add([bg, this.hintText, ...this.keys.map((k) => k.container)]);
    }

    createKey(label, x, y) {
        const scene = this.scene;
        const keyContainer = scene.add.container(x, y);

        const bg = scene.add.graphics();
        bg.fillStyle(0x1e293b, 1);
        bg.lineStyle(1, 0x475569, 1);
        bg.fillRoundedRect(0, 0, KEY_W, KEY_H, 6);
        bg.strokeRoundedRect(0, 0, KEY_W, KEY_H, 6);

        const isWide = label === 'Enter';
        const fontSize = isWide ? '13px' : '20px';
        const text = scene.add.text(KEY_W / 2, KEY_H / 2, label, {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize,
            color: '#f8fafc'
        });
        text.setOrigin(0.5);

        keyContainer.add([bg, text]);
        keyContainer.setSize(KEY_W, KEY_H);
        keyContainer.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, KEY_W, KEY_H),
            Phaser.Geom.Rectangle.Contains
        );
        keyContainer.input.cursor = 'pointer';

        const keyBg = bg;
        const normalFill = 0x1e293b;
        const pressedFill = 0x334155;

        keyContainer.on('pointerdown', () => {
            keyBg.clear();
            keyBg.fillStyle(pressedFill, 1);
            keyBg.lineStyle(1, 0x475569, 1);
            keyBg.fillRoundedRect(0, 0, KEY_W, KEY_H, 6);
            keyBg.strokeRoundedRect(0, 0, KEY_W, KEY_H, 6);
        });

        const restoreKey = () => {
            keyBg.clear();
            keyBg.fillStyle(normalFill, 1);
            keyBg.lineStyle(1, 0x475569, 1);
            keyBg.fillRoundedRect(0, 0, KEY_W, KEY_H, 6);
            keyBg.strokeRoundedRect(0, 0, KEY_W, KEY_H, 6);
        };

        keyContainer.on('pointerup', () => {
            restoreKey();
            this.handleKeyPress(label);
        });

        keyContainer.on('pointerout', restoreKey);

        return { container: keyContainer, label };
    }

    handleKeyPress(label) {
        if (!this.launchInput.isActive()) return;

        if (label === '⌫') {
            this.launchInput.backspace();
            return;
        }
        if (label === 'Enter') {
            this.launchInput.confirm();
            return;
        }
        if (/^\d$/.test(label)) {
            this.launchInput.appendDigit(Number(label));
        }
    }

    toggle() {
        this.container.setVisible(!this.container.visible);
    }

    show() {
        this.container.setVisible(true);
    }

    hide() {
        this.container.setVisible(false);
    }

    update() {
        if (!this.container.visible) return;

        const enabled = this.launchInput.isActive();
        const alpha = enabled ? 1 : 0.45;

        this.keys.forEach((key) => {
            key.container.setAlpha(alpha);
        });
        this.hintText.setAlpha(enabled ? 0 : 1);
    }
}
