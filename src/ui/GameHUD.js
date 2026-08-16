import * as GameMath from '../utils/gameMath.js';
import {
    nearestVelocityOption,
    solveInterceptLaunch
} from '../utils/interceptSolver.js';
import { VELOCITY_OPTIONS } from './MissileLaunchInput.js';

const INFO_LINE_Y = 100;
const INFO_LINE_STEP = 30;
const PANEL_X = 20;
const PANEL_PAD = 12;
const PANEL_W = 360;
const PANEL_H = 168;
const BTN_W = 168;
const BTN_H = 32;

export class GameHUD {
    constructor(scene) {
        this.scene = scene;
        this.hasUsedSolver = false;
        this.solutionOpen = false;
        this.infoBottomY = INFO_LINE_Y;
        this.pendingInputs = null;

        const textStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' };

        this.waveText = scene.add.text(20, 20, 'Wave : ', textStyle);
        this.lifeText = scene.add.text(20, 50, 'House : ', textStyle);

        this.interceptPointText = scene.add.text(20, INFO_LINE_Y, 'Intercept point : ', textStyle).setVisible(false);
        this.missilePositionText = scene.add.text(20, INFO_LINE_Y, 'Missile position : ', textStyle).setVisible(false);
        this.missileVelocityText = scene.add.text(20, INFO_LINE_Y, 'Missile velocity : ', textStyle).setVisible(false);

        this.toggleBtnBg = scene.add.graphics().setVisible(false).setDepth(1501);
        this.toggleBtnText = scene.add.text(0, 0, 'Show how to solve', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#e2e8f0',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(1502);
        this.toggleBtnHit = scene.add.zone(0, 0, BTN_W, BTN_H)
            .setInteractive({ useHandCursor: true })
            .setVisible(false)
            .setDepth(1503);
        this.toggleBtnHit.on('pointerup', () => this.toggleSolutionPanel());
        this.toggleBtnHit.on('pointerover', () => this.drawToggleButton(true));
        this.toggleBtnHit.on('pointerout', () => this.drawToggleButton(false));

        this.solutionContainer = scene.add.container(PANEL_X, INFO_LINE_Y);
        this.solutionContainer.setScrollFactor(0);
        this.solutionContainer.setDepth(1500);
        this.solutionContainer.setVisible(false);

        this.solutionBg = scene.add.graphics();
        this.solutionBg.fillStyle(0x0c1224, 0.92);
        this.solutionBg.lineStyle(2, 0x38bdf8, 0.85);
        this.solutionBg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, 8);
        this.solutionBg.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, 8);

        this.solutionTitle = scene.add.text(PANEL_PAD, PANEL_PAD, 'HOW TO SOLVE IT', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#7dd3fc',
            fontStyle: 'bold'
        });

        this.solutionBody = scene.add.text(PANEL_PAD, PANEL_PAD + 22, '', {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '13px',
            color: '#cbd5e1',
            lineSpacing: 4,
            wordWrap: { width: PANEL_W - PANEL_PAD * 2 }
        });

        this.solutionContainer.add([this.solutionBg, this.solutionTitle, this.solutionBody]);
    }

    updateStatus(wave, houseCount) {
        this.waveText.setText(`Wave : ${wave}`);
        this.lifeText.setText(`House : ${houseCount}`);
    }

    drawToggleButton(hovered = false) {
        const y = this.infoBottomY + 8;
        const x = PANEL_X;
        this.toggleBtnBg.clear();
        this.toggleBtnBg.fillStyle(hovered ? 0x1e3a5f : 0x0f172a, 0.95);
        this.toggleBtnBg.lineStyle(2, hovered ? 0x7dd3fc : 0x38bdf8, 0.9);
        this.toggleBtnBg.fillRoundedRect(x, y, BTN_W, BTN_H, 6);
        this.toggleBtnBg.strokeRoundedRect(x, y, BTN_W, BTN_H, 6);

        this.toggleBtnText.setText(this.solutionOpen ? 'Close solution' : 'Show how to solve');
        this.toggleBtnText.setPosition(x + BTN_W / 2, y + BTN_H / 2);
        this.toggleBtnHit.setPosition(x + BTN_W / 2, y + BTN_H / 2);
    }

    setToggleButtonVisible(visible) {
        this.toggleBtnBg.setVisible(visible);
        this.toggleBtnText.setVisible(visible);
        this.toggleBtnHit.setVisible(visible);
        if (visible) this.drawToggleButton(false);
    }

    dismissInterceptionPanel() {
        this.interceptPointText.setVisible(false);
        this.missilePositionText.setVisible(false);
        this.missileVelocityText.setVisible(false);
        this.solutionContainer.setVisible(false);
        this.solutionOpen = false;
        this.hasUsedSolver = false;
        this.pendingInputs = null;
        this.setToggleButtonVisible(false);
    }

    showLine(text, content, y) {
        text.setText(content).setY(y).setVisible(true);
        return y + INFO_LINE_STEP;
    }

    buildSolutionText(missilePos, interceptPos, missileVel) {
        const result = solveInterceptLaunch(missilePos, interceptPos, missileVel);
        if (!result.ok) return result.message;

        const nearest = nearestVelocityOption(result.speedMs, VELOCITY_OPTIONS);
        return result.steps.join('\n') + `\n   (~${nearest.speedMs} m/s on dial)`;
    }

    refreshSolutionBody() {
        if (!this.pendingInputs) {
            this.solutionBody.setText('');
            return;
        }
        const { missilePos, interceptPos, missileVel } = this.pendingInputs;
        this.solutionBody.setText(this.buildSolutionText(missilePos, interceptPos, missileVel));
    }

    openSolutionPanel() {
        if (!this.hasUsedSolver || !this.pendingInputs) return;

        this.refreshSolutionBody();
        const panelY = this.infoBottomY + 8 + BTN_H + 10;
        this.solutionContainer.setY(panelY);
        this.solutionContainer.setVisible(true);
        this.solutionOpen = true;
        this.drawToggleButton(false);
    }

    closeSolutionPanel() {
        this.solutionContainer.setVisible(false);
        this.solutionOpen = false;
        if (this.hasUsedSolver) this.drawToggleButton(false);
    }

    toggleSolutionPanel() {
        if (!this.hasUsedSolver) return;
        if (this.solutionOpen) this.closeSolutionPanel();
        else this.openSolutionPanel();
    }

    // Called after a successful Intercept Calculator solve.
    unlockSolutionGuide() {
        if (!this.pendingInputs) return;

        this.hasUsedSolver = true;
        this.setToggleButtonVisible(true);
    }

    showInterceptionPanel(enemy, interceptPoint) {
        if (!enemy || !enemy.body) return;

        this.dismissInterceptionPanel();

        const scene = this.scene;
        const w = scene.scale.width;
        const h = scene.scale.height;
        const ppm = scene.PPM;

        const missileX = Math.round((GameMath.toShiftedX(enemy.x, w, scene.shiftOriginX) / ppm) * 100) / 100;
        const missileY = Math.round((GameMath.toShiftedY(enemy.y, h, scene.shiftOriginY) / ppm) * 100) / 100;
        const vx = Math.round((enemy._savedVelocityX / ppm) * 100) / 100;
        const vy = Math.round((-enemy._savedVelocityY / ppm) * 100) / 100;
        const vxShown = Math.round(vx);
        const vyShown = Math.round(vy);

        let interceptX = null;
        let interceptY = null;
        if (interceptPoint) {
            interceptX = Math.round((GameMath.toShiftedX(Math.round(interceptPoint.x), w, scene.shiftOriginX) / ppm) * 100) / 100;
            interceptY = Math.round((GameMath.toShiftedY(Math.round(interceptPoint.y), h, scene.shiftOriginY) / ppm) * 100) / 100;
        }

        let y = INFO_LINE_Y;

        if (interceptPoint) {
            y = this.showLine(
                this.interceptPointText,
                `Intercept point : (${interceptX}, ${interceptY})`,
                y
            );
        }

        y = this.showLine(
            this.missilePositionText,
            `Missile position : (${missileX}, ${missileY})`,
            y
        );

        y = this.showLine(
            this.missileVelocityText,
            `Missile velocity : (${vxShown}, ${vyShown})`,
            y
        );

        this.infoBottomY = y;

        if (interceptPoint) {
            this.pendingInputs = {
                missilePos: { x: missileX, y: missileY },
                interceptPos: { x: interceptX, y: interceptY },
                missileVel: { x: vxShown, y: vyShown }
            };
        }
    }
}
