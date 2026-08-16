import * as GameMath from '../utils/gameMath.js';
import { solveInterceptLaunch } from '../utils/interceptSolver.js';

const INFO_LINE_Y = 100;
const INFO_LINE_STEP = 30;
const PANEL_X = 20;
const PANEL_PAD = 12;
const PANEL_W = 260;
const PANEL_H = 185;

export class GameHUD {
    constructor(scene) {
        this.scene = scene;
        this.solutionOpen = false;
        this.infoBottomY = INFO_LINE_Y;
        this.solverInputs = null;

        const textStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' };

        this.waveText = scene.add.text(20, 20, 'Wave : ', textStyle);
        this.lifeText = scene.add.text(20, 50, 'House : ', textStyle);

        this.interceptPointText = scene.add.text(20, INFO_LINE_Y, 'Intercept point : ', textStyle).setVisible(false);
        this.missilePositionText = scene.add.text(20, INFO_LINE_Y, 'Missile position : ', textStyle).setVisible(false);
        this.missileVelocityText = scene.add.text(20, INFO_LINE_Y, 'Missile velocity : ', textStyle).setVisible(false);

        this.solutionContainer = scene.add.container(PANEL_X, INFO_LINE_Y);
        this.solutionContainer.setScrollFactor(0);
        this.solutionContainer.setDepth(1500);
        this.solutionContainer.setVisible(false);

        this.solutionBg = scene.add.graphics();
        this.solutionBg.fillStyle(0x0c1224, 0.92);
        this.solutionBg.lineStyle(2, 0x38bdf8, 0.85);
        this.solutionBg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, 8);
        this.solutionBg.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, 8);

        this.solutionTitle = scene.add.text(PANEL_PAD, PANEL_PAD, 'HOW TO SOLVE', {
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

    syncCalculatorGuideButton() {
        this.scene.interceptCalculator?.drawShowButton(false);
    }

    dismissInterceptionPanel() {
        this.interceptPointText.setVisible(false);
        this.missilePositionText.setVisible(false);
        this.missileVelocityText.setVisible(false);
        this.closeSolutionPanel();
        this.solverInputs = null;
    }

    showLine(text, content, y) {
        text.setText(content).setY(y).setVisible(true);
        return y + INFO_LINE_STEP;
    }

    buildSolutionText(missilePos, interceptPos, missileVel) {
        const result = solveInterceptLaunch(missilePos, interceptPos, missileVel);
        if (!result.ok) return result.message;
        return Array.isArray(result.steps) ? result.steps.join('\n') : result.steps;
    }

    refreshSolutionBody() {
        if (!this.solverInputs) {
            this.solutionBody.setText('');
            return;
        }
        const { missilePos, interceptPos, missileVel } = this.solverInputs;
        this.solutionBody.setText(this.buildSolutionText(missilePos, interceptPos, missileVel));
    }

    openSolutionPanel(solverInputs) {
        if (!solverInputs) return;

        this.solverInputs = solverInputs;
        this.refreshSolutionBody();
        this.solutionContainer.setY(this.infoBottomY + 8);
        this.solutionContainer.setVisible(true);
        this.solutionOpen = true;
        this.syncCalculatorGuideButton();
    }

    closeSolutionPanel() {
        this.solutionContainer.setVisible(false);
        this.solutionOpen = false;
        this.syncCalculatorGuideButton();
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
    }
}
