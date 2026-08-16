import {
    applyAppendDecimal,
    applyAppendDigit,
    applyToggleSign
} from '../utils/numericInput.js';
import {
    solveInterceptLaunch
} from '../utils/interceptSolver.js';

const PANEL_MARGIN = 16;
const PANEL_PAD = 14;
const ROW_H = 28;
const ROW_GAP = 6;
const COL_GAP = 8;

const FIELDS = [
    { id: 'mx', label: 'Missile X' },
    { id: 'my', label: 'Missile Y' },
    { id: 'ix', label: 'Intercept X' },
    { id: 'iy', label: 'Intercept Y' },
    { id: 'vx', label: 'Velocity X' },
    { id: 'vy', label: 'Velocity Y' }
];

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

export class InterceptCalculator {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.activeField = 'mx';
        this.buffers = Object.fromEntries(FIELDS.map((f) => [f.id, '']));
        this.resultText = '';
        this.errorText = '';
        this.lastSolveInputs = null;
        this.showGuideEnabled = false;

        const colW = 148;
        const panelW = PANEL_PAD * 2 + colW * 2 + COL_GAP;
        const rows = Math.ceil(FIELDS.length / 2);
        const fieldsH = rows * ROW_H + (rows - 1) * ROW_GAP;
        const showBtnH = 28;
        const panelH = PANEL_PAD + 26 + fieldsH + 12 + 52 + 8 + 18 + 8 + showBtnH - 30;
        this.panelW = panelW;
        this.panelH = panelH;
        this.colW = colW;
        this.showBtnH = showBtnH;

        const cx = scene.scale.width - panelW - PANEL_MARGIN;
        const cy = scene.scale.height - panelH - PANEL_MARGIN;

        this.container = scene.add.container(cx, cy);
        this.container.setScrollFactor(0);
        this.container.setDepth(2200);
        this.container.setVisible(false);

        const bg = scene.add.graphics();
        bg.fillStyle(0x0c1224, 0.94);
        bg.lineStyle(2, 0x38bdf8, 0.9);
        bg.fillRoundedRect(0, 0, panelW, panelH, 8);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 8);

        const titleStyle = {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#7dd3fc',
            fontStyle: 'bold'
        };
        const labelStyle = {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#cbd5e1'
        };
        const bodyStyle = {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '16px',
            color: '#f8fafc'
        };
        const resultStyle = {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '13px',
            color: '#86efac'
        };
        const errorStyle = {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#f87171'
        };
        const hintStyle = {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#64748b'
        };

        this.titleText = scene.add.text(PANEL_PAD, PANEL_PAD, 'INTERCEPT SOLVER', titleStyle);

        this.fieldViews = {};
        const fieldsY = PANEL_PAD + 26;

        FIELDS.forEach((field, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = PANEL_PAD + col * (colW + COL_GAP);
            const y = fieldsY + row * (ROW_H + ROW_GAP);

            const rowBg = scene.add.graphics();
            rowBg.setPosition(x, y);

            const label = scene.add.text(x + 6, y + 6, field.label, labelStyle);
            const value = scene.add.text(x + colW - 6, y + 4, '', bodyStyle);
            value.setOrigin(1, 0);

            const hit = scene.add.zone(x + colW / 2, y + ROW_H / 2, colW, ROW_H);
            hit.setInteractive({ useHandCursor: true });
            hit.on('pointerup', () => this.selectField(field.id));

            this.fieldViews[field.id] = { rowBg, label, value, hit, x, y };
        });

        const resultY = fieldsY + fieldsH + 12;
        this.resultBg = scene.add.graphics();
        this.resultBg.fillStyle(0x0f172a, 0.85);
        this.resultBg.fillRoundedRect(PANEL_PAD, resultY, panelW - PANEL_PAD * 2, 52, 6);

        this.resultLabel = scene.add.text(PANEL_PAD + 8, resultY + 2, 'Angle: —\nVelocity: —', resultStyle);
        this.errorLabel = scene.add.text(PANEL_PAD + 8, resultY + 35, '', errorStyle);

        const actionBtnW = 96;
        const actionBtnGap = 8;
        const actionBtnY = resultY + 56 + 18 + 4 - 30;
        this.actionBtnH = showBtnH;
        this.calcBtnX = PANEL_PAD;
        this.calcBtnY = actionBtnY;
        this.calcBtnW = actionBtnW;
        this.showBtnX = PANEL_PAD + actionBtnW + actionBtnGap;
        this.showBtnY = actionBtnY;
        this.showBtnW = actionBtnW;

        this.calcBtnBg = scene.add.graphics();
        this.calcBtnText = scene.add.text(
            this.calcBtnX + actionBtnW / 2,
            actionBtnY + showBtnH / 2,
            'Calculate',
            {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#e2e8f0',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.calcBtnHit = scene.add.zone(
            this.calcBtnX + actionBtnW / 2,
            actionBtnY + showBtnH / 2,
            actionBtnW,
            showBtnH
        );
        this.calcBtnHit.setInteractive({ useHandCursor: true });
        this.calcBtnHit.on('pointerup', () => this.solve());
        this.calcBtnHit.on('pointerover', () => this.drawCalcButton(true));
        this.calcBtnHit.on('pointerout', () => this.drawCalcButton(false));

        this.showBtnBg = scene.add.graphics();
        this.showBtnText = scene.add.text(
            this.showBtnX + actionBtnW / 2,
            actionBtnY + showBtnH / 2,
            'Show',
            {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#e2e8f0',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.showBtnHit = scene.add.zone(
            this.showBtnX + actionBtnW / 2,
            actionBtnY + showBtnH / 2,
            actionBtnW,
            showBtnH
        );
        this.showBtnHit.setInteractive({ useHandCursor: true });
        this.showBtnHit.on('pointerup', () => this.toggleSolutionGuide());
        this.showBtnHit.on('pointerover', () => this.drawShowButton(true));
        this.showBtnHit.on('pointerout', () => this.drawShowButton(false));

        const children = [
            bg,
            this.titleText,
            this.resultBg,
            this.resultLabel,
            this.errorLabel,
            this.calcBtnBg,
            this.calcBtnText,
            this.calcBtnHit,
            this.showBtnBg,
            this.showBtnText,
            this.showBtnHit
        ];
        FIELDS.forEach((field) => {
            const view = this.fieldViews[field.id];
            children.push(view.rowBg, view.label, view.value, view.hit);
        });
        this.container.add(children);
        this.drawCalcButton(false);
        this.drawShowButton(false);

        this.backspaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.tabKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        this.upKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.downKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.leftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.periodKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
        this.numpadDecimalKey = scene.input.keyboard.addKey(110);
        this.minusKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
        this.numpadMinusKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT);
        this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.digitKeys = DIGIT_KEYS.map((code) => scene.input.keyboard.addKey(code));
        this.numpadKeys = NUMPAD_KEYS.map((code) => scene.input.keyboard.addKey(code));

        // Keep Tab inside the solver when open without the launch panel.
        scene.input.keyboard.on('keydown-TAB', (event) => {
            if (this.visible && !scene.hasDualInputOpen()) event.preventDefault();
        });

        this.refreshDisplay();
    }

    clearGuideState({ closePanel = true } = {}) {
        this.lastSolveInputs = null;
        this.showGuideEnabled = false;
        this.drawShowButton(false);
        if (closePanel && this.scene.gameHud?.solutionOpen) {
            this.scene.gameHud.closeSolutionPanel();
        }
    }

    drawCalcButton(hovered = false) {
        this.calcBtnBg.clear();
        this.calcBtnBg.fillStyle(hovered ? 0x1e3a5f : 0x0f172a, 0.95);
        this.calcBtnBg.lineStyle(1.5, hovered ? 0x7dd3fc : 0x38bdf8, 0.9);
        this.calcBtnBg.fillRoundedRect(this.calcBtnX, this.calcBtnY, this.calcBtnW, this.actionBtnH, 5);
        this.calcBtnBg.strokeRoundedRect(this.calcBtnX, this.calcBtnY, this.calcBtnW, this.actionBtnH, 5);
        this.calcBtnText.setColor('#e2e8f0');
    }

    drawShowButton(hovered = false) {
        if (!this.showBtnBg) return;

        const enabled = this.showGuideEnabled;
        const open = Boolean(this.scene.gameHud?.solutionOpen);
        this.showBtnBg.clear();
        this.showBtnBg.fillStyle(
            enabled ? (hovered ? 0x1e3a5f : 0x0f172a) : 0x111827,
            enabled ? 0.95 : 0.55
        );
        this.showBtnBg.lineStyle(1.5, enabled ? (hovered ? 0x7dd3fc : 0x38bdf8) : 0x334155, enabled ? 0.9 : 0.5);
        this.showBtnBg.fillRoundedRect(this.showBtnX, this.showBtnY, this.showBtnW, this.actionBtnH, 5);
        this.showBtnBg.strokeRoundedRect(this.showBtnX, this.showBtnY, this.showBtnW, this.actionBtnH, 5);
        this.showBtnText.setText(open ? 'Hide' : 'Show');
        this.showBtnText.setColor(enabled ? '#e2e8f0' : '#64748b');
        this.showBtnHit.setVisible(enabled);
    }

    toggleSolutionGuide() {
        if (!this.showGuideEnabled || !this.lastSolveInputs || !this.scene.gameHud) return;
        if (this.scene.gameHud.solutionOpen) {
            this.scene.gameHud.closeSolutionPanel();
        } else {
            this.scene.gameHud.openSolutionPanel(this.lastSolveInputs);
        }
        this.drawShowButton(false);
    }

    isVisible() {
        return this.visible;
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }

    show() {
        this.visible = true;
        this.container.setVisible(true);
        this.errorText = '';
        this.resultText = '';
        this.clearGuideState({ closePanel: false });
        if (this.scene.hasDualInputOpen()) {
            this.scene.focusCalculatorField('mx');
        } else {
            this.activeField = 'mx';
            this.refreshDisplay();
        }
    }

    hide() {
        this.visible = false;
        this.container.setVisible(false);
        if (this.scene.missileLaunchInput.isActive()) {
            this.scene.missileLaunchInput.restoreFieldFocus();
        }
    }

    hasFieldFocus() {
        return this.activeField !== null;
    }

    focusField(fieldId) {
        if (!this.visible) return;
        if (!this.buffers.hasOwnProperty(fieldId)) return;
        this.activeField = fieldId;
        this.errorText = '';
        this.refreshDisplay();
    }

    clearFieldFocus() {
        if (!this.visible) return;
        this.activeField = null;
        this.refreshDisplay();
    }

    selectField(fieldId) {
        if (!this.visible) return;
        if (this.scene.hasDualInputOpen()) {
            this.scene.focusCalculatorField(fieldId);
            return;
        }
        this.focusField(fieldId);
    }

    update() {
        if (!this.visible) return;
        if (this.scene.hasDualInputOpen() && !this.hasFieldFocus()) return;

        this.handleDigitInput();
        this.handleDecimalInput();
        this.handleSignInput();
        this.handleBackspace();
        this.handleArrowKeys();
        this.handleTab();
        this.handleEnter();
        this.refreshDisplay();
    }

    appendDigit(digit) {
        const current = this.buffers[this.activeField];
        const next = applyAppendDigit(current, digit);
        if (next === current) return;
        this.buffers[this.activeField] = next;
        this.errorText = '';
        this.resultText = '';
        this.clearGuideState();
    }

    appendDecimal() {
        const current = this.buffers[this.activeField];
        const next = applyAppendDecimal(current);
        if (next === current) return;
        this.buffers[this.activeField] = next;
        this.errorText = '';
        this.resultText = '';
        this.clearGuideState();
    }

    toggleSign() {
        const current = this.buffers[this.activeField];
        this.buffers[this.activeField] = applyToggleSign(current);
        this.errorText = '';
        this.resultText = '';
        this.clearGuideState();
    }

    backspace() {
        const current = this.buffers[this.activeField];
        this.buffers[this.activeField] = current.slice(0, -1);
        this.errorText = '';
        this.resultText = '';
        this.clearGuideState();
    }

    cycleField(forward = true) {
        const ids = FIELDS.map((f) => f.id);
        const index = ids.indexOf(this.activeField);
        const next = forward
            ? (index + 1) % ids.length
            : (index - 1 + ids.length) % ids.length;
        this.selectField(ids[next]);
    }

    parseBuffer(id) {
        const raw = this.buffers[id];
        if (raw === '' || raw === '-' || raw === '-.' || raw === '.') return null;
        const value = Number(raw);
        return Number.isFinite(value) ? value : null;
    }

    solve() {
        const mx = this.parseBuffer('mx');
        const my = this.parseBuffer('my');
        const ix = this.parseBuffer('ix');
        const iy = this.parseBuffer('iy');
        const vx = this.parseBuffer('vx');
        const vy = this.parseBuffer('vy');

        if ([mx, my, ix, iy, vx, vy].some((v) => v === null)) {
            this.errorText = 'Fill every field with a number';
            this.resultText = '';
            this.clearGuideState();
            this.refreshDisplay();
            return;
        }

        const result = solveInterceptLaunch(
            { x: mx, y: my },
            { x: ix, y: iy },
            { x: vx, y: vy }
        );

        if (!result.ok) {
            this.errorText = result.message;
            this.resultText = '';
            this.clearGuideState();
            this.refreshDisplay();
            return;
        }

        const angle = Math.round(result.angleDeg * 100) / 100;
        const speed = Math.round(result.speedMs * 100) / 100;

        this.errorText = '';
        this.resultText =
            `Velocity = ${speed} m/s\nAngle = ${angle}°  `;
        this.lastSolveInputs = {
            missilePos: { x: mx, y: my },
            interceptPos: { x: ix, y: iy },
            missileVel: { x: vx, y: vy }
        };
        this.showGuideEnabled = true;
        this.drawShowButton(false);
        this.refreshDisplay();
    }

    handleDigitInput() {
        this.digitKeys.forEach((key, digit) => {
            if (Phaser.Input.Keyboard.JustDown(key)) this.appendDigit(digit);
        });
        this.numpadKeys.forEach((key, digit) => {
            if (Phaser.Input.Keyboard.JustDown(key)) this.appendDigit(digit);
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

    handleSignInput() {
        if (
            Phaser.Input.Keyboard.JustDown(this.minusKey) ||
            Phaser.Input.Keyboard.JustDown(this.numpadMinusKey)
        ) {
            this.toggleSign();
        }
    }

    handleBackspace() {
        if (Phaser.Input.Keyboard.JustDown(this.backspaceKey)) {
            this.backspace();
        }
    }

    getFieldPosition(fieldId) {
        const index = FIELDS.findIndex((f) => f.id === fieldId);
        if (index < 0) return null;
        return { index, col: index % 2, row: Math.floor(index / 2) };
    }

    moveToAdjacentField(direction) {
        if (!this.hasFieldFocus()) return;

        const pos = this.getFieldPosition(this.activeField);
        if (!pos) return;

        const rows = Math.ceil(FIELDS.length / 2);
        let targetId = null;

        if (direction === 'up') {
            if (pos.row === 0) return;
            targetId = FIELDS[(pos.row - 1) * 2 + pos.col].id;
        } else if (direction === 'down') {
            if (pos.row >= rows - 1) return;
            const targetIndex = (pos.row + 1) * 2 + pos.col;
            if (targetIndex >= FIELDS.length) return;
            targetId = FIELDS[targetIndex].id;
        } else if (direction === 'left') {
            if (pos.index === 0) return;
            targetId = FIELDS[pos.index - 1].id;
        } else if (direction === 'right') {
            if (pos.index >= FIELDS.length - 1) return;
            targetId = FIELDS[pos.index + 1].id;
        }

        if (targetId) this.selectField(targetId);
    }

    handleArrowKeys() {
        if (!this.hasFieldFocus()) return;

        if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
            this.moveToAdjacentField('up');
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
            this.moveToAdjacentField('down');
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
            this.moveToAdjacentField('left');
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
            this.moveToAdjacentField('right');
        }
    }

    handleTab() {
        if (!Phaser.Input.Keyboard.JustDown(this.tabKey)) return;
        if (this.scene.hasDualInputOpen()) return;
        this.cycleField(!this.shiftKey.isDown);
    }

    handleEnter() {
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.solve();
        }
    }

    refreshDisplay() {
        FIELDS.forEach((field) => {
            const view = this.fieldViews[field.id];
            const buffer = this.buffers[field.id];
            const active = this.activeField === field.id;
            view.value.setText(buffer === '' ? (active ? '_' : '') : buffer);

            view.rowBg.clear();
            view.rowBg.fillStyle(active ? 0x1e3a5f : 0x0f172a, active ? 0.85 : 0.55);
            view.rowBg.lineStyle(1, active ? 0x38bdf8 : 0x334155, active ? 0.9 : 0.6);
            view.rowBg.fillRoundedRect(0, 0, this.colW, ROW_H, 5);
            view.rowBg.strokeRoundedRect(0, 0, this.colW, ROW_H, 5);
        });

        this.resultLabel.setText(this.resultText ? `${this.resultText}` : 'Velocity: —\nAngle: —');
        this.errorLabel.setText(this.errorText);
    }
}
