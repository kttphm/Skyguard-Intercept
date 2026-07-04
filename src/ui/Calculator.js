const KEY_W = 52;
const KEY_H = 44;
const KEY_GAP = 6;
const PANEL_PAD = 12;
const DISPLAY_H = 40;

const KEY_ROWS = [
    [
        { label: '√', colSpan: 1 },
        { label: 'x²', colSpan: 1 },
        { label: 'Del', colSpan: 1 },
        { label: '/', colSpan: 1 }
    ],
    [
        { label: '7', colSpan: 1 },
        { label: '8', colSpan: 1 },
        { label: '9', colSpan: 1 },
        { label: '×', colSpan: 1 }
    ],
    [
        { label: '4', colSpan: 1 },
        { label: '5', colSpan: 1 },
        { label: '6', colSpan: 1 },
        { label: '-', colSpan: 1 }
    ],
    [
        { label: '1', colSpan: 1 },
        { label: '2', colSpan: 1 },
        { label: '3', colSpan: 1 },
        { label: '+', colSpan: 1 }
    ],
    [
        { label: '.', colSpan: 1 },
        { label: '0', colSpan: 1 },
        { label: '=', colSpan: 2 }
    ]
];

export class Calculator {
    constructor(scene) {
        this.scene = scene;
        this.keys = [];
        this.display = '0';
        this.storedValue = null;
        this.pendingOp = null;
        this.freshEntry = true;
        this.hasError = false;

        const cols = 4;
        const gridW = cols * KEY_W + (cols - 1) * KEY_GAP;
        const gridH = KEY_ROWS.length * KEY_H + (KEY_ROWS.length - 1) * KEY_GAP;
        const panelW = gridW + PANEL_PAD * 2;
        const panelH = PANEL_PAD * 2 + DISPLAY_H + 8 + gridH;

        const margin = 16;
        const cx = margin;
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

        this.displayText = scene.add.text(panelW - PANEL_PAD, PANEL_PAD + DISPLAY_H / 2, '0', {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '24px',
            color: '#f8fafc'
        });
        this.displayText.setOrigin(1, 0.5);

        const displayBg = scene.add.graphics();
        displayBg.fillStyle(0x1e293b, 1);
        displayBg.fillRoundedRect(PANEL_PAD, PANEL_PAD, panelW - PANEL_PAD * 2, DISPLAY_H, 6);

        this.container.add([
            bg,
            displayBg,
            this.displayText
        ]);

        const gridY = PANEL_PAD + DISPLAY_H + 8;
        KEY_ROWS.forEach((row, rowIndex) => {
            let colIndex = 0;
            row.forEach((keyDef) => {
                const span = keyDef.colSpan ?? 1;
                const w = span * KEY_W + (span - 1) * KEY_GAP;
                const x = PANEL_PAD + colIndex * (KEY_W + KEY_GAP);
                const y = gridY + rowIndex * (KEY_H + KEY_GAP);
                const key = this.createKey(keyDef.label, x, y, w);
                this.keys.push(key);
                this.container.add([key.bg, key.text, key.hit]);
                colIndex += span;
            });
        });
    }

    createKey(label, x, y, width = KEY_W) {
        const scene = this.scene;
        const height = KEY_H;

        const bg = scene.add.graphics();
        bg.setPosition(x, y);
        const isOp = ['+', '-', '×', '/', '=', '√', 'x²', 'Del'].includes(label);
        const normalFill = isOp ? 0x1e3a5f : 0x1e293b;
        const pressedFill = isOp ? 0x2563eb : 0x334155;

        const drawBg = (fill) => {
            bg.clear();
            bg.fillStyle(fill, 1);
            bg.lineStyle(1, 0x475569, 1);
            bg.fillRoundedRect(0, 0, width, height, 6);
            bg.strokeRoundedRect(0, 0, width, height, 6);
        };

        drawBg(normalFill);

        const fontSize = label.length > 1 ? '14px' : '18px';
        const text = scene.add.text(x + width / 2, y + height / 2, label, {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize,
            color: '#f8fafc'
        });
        text.setOrigin(0.5);

        const hit = scene.add.zone(x + width / 2, y + height / 2, width, height);
        hit.setInteractive({ useHandCursor: true });

        const restoreKey = () => drawBg(normalFill);

        hit.on('pointerdown', () => drawBg(pressedFill));

        hit.on('pointerup', () => {
            restoreKey();
            this.handleKeyPress(label);
        });

        hit.on('pointerout', restoreKey);

        return { bg, text, hit, label };
    }

    handleKeyPress(label) {
        if (this.hasError && label !== 'Del') {
            this.reset();
        }

        if (/^\d$/.test(label)) {
            this.inputDigit(label);
        } else {
            switch (label) {
                case '.':
                    this.inputDecimal();
                    break;
                case 'Del':
                    this.deleteChar();
                    break;
                case '+':
                case '-':
                case '×':
                case '/':
                    this.inputOperator(label);
                    break;
                case '=':
                    this.calculate();
                    break;
                case 'x²':
                    this.applySquare();
                    break;
                case '√':
                    this.applySqrt();
                    break;
                default:
                    break;
            }
        }

        this.refreshDisplay();
    }

    inputDigit(digit) {
        if (this.freshEntry) {
            this.display = String(digit);
            this.freshEntry = false;
        } else if (this.display === '0' && !this.display.includes('.')) {
            this.display = String(digit);
        } else if (this.display.replace('-', '').replace('.', '').length < 12) {
            this.display += digit;
        }
    }

    inputDecimal() {
        if (this.freshEntry) {
            this.display = '0.';
            this.freshEntry = false;
            return;
        }
        if (!this.display.includes('.')) {
            this.display += '.';
        }
    }

    deleteChar() {
        if (this.hasError) {
            this.reset();
            return;
        }

        if (this.freshEntry) {
            this.reset();
            return;
        }

        if (this.display.length <= 1 || (this.display.length === 2 && this.display.startsWith('-'))) {
            this.display = '0';
            this.freshEntry = true;
        } else {
            this.display = this.display.slice(0, -1);
        }
    }

    inputOperator(op) {
        const current = this.parseDisplay();
        if (current === null) return;

        if (this.pendingOp !== null && !this.freshEntry) {
            const result = this.compute(this.storedValue, current, this.pendingOp);
            if (result === null) {
                this.showError();
                return;
            }
            this.display = this.formatResult(result);
            this.storedValue = result;
        } else {
            this.storedValue = current;
        }

        this.pendingOp = op;
        this.freshEntry = true;
    }

    calculate() {
        if (this.pendingOp === null) return;

        const current = this.parseDisplay();
        if (current === null || this.storedValue === null) return;

        const result = this.compute(this.storedValue, current, this.pendingOp);
        if (result === null) {
            this.showError();
            return;
        }

        this.display = this.formatResult(result);
        this.storedValue = null;
        this.pendingOp = null;
        this.freshEntry = true;
    }

    applySquare() {
        const value = this.parseDisplay();
        if (value === null) return;

        this.display = this.formatResult(value * value);
        this.pendingOp = null;
        this.storedValue = null;
        this.freshEntry = true;
    }

    applySqrt() {
        const value = this.parseDisplay();
        if (value === null) return;

        if (value < 0) {
            this.showError();
            return;
        }

        this.display = this.formatResult(Math.sqrt(value));
        this.pendingOp = null;
        this.storedValue = null;
        this.freshEntry = true;
    }

    compute(a, b, op) {
        switch (op) {
            case '+':
                return a + b;
            case '-':
                return a - b;
            case '×':
                return a * b;
            case '/':
                if (b === 0) return null;
                return a / b;
            default:
                return null;
        }
    }

    parseDisplay() {
        const value = Number(this.display);
        return Number.isFinite(value) ? value : null;
    }

    formatResult(value) {
        if (!Number.isFinite(value)) return '0';
        const rounded = Math.round(value * 1e10) / 1e10;
        return String(rounded);
    }

    showError() {
        this.display = 'Error';
        this.hasError = true;
        this.storedValue = null;
        this.pendingOp = null;
        this.freshEntry = true;
    }

    reset() {
        this.display = '0';
        this.storedValue = null;
        this.pendingOp = null;
        this.freshEntry = true;
        this.hasError = false;
    }

    refreshDisplay() {
        this.displayText.setText(this.display);
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
}
