import * as GameMath from '../utils/gameMath.js';

const INFO_LINE_Y = 100;
const INFO_LINE_STEP = 30;

export class GameHUD {
    constructor(scene) {
        this.scene = scene;
        const textStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' };

        this.waveText = scene.add.text(20, 20, 'Wave : ', textStyle);
        this.lifeText = scene.add.text(20, 50, 'House : ', textStyle);

        this.interceptPointText = scene.add.text(20, INFO_LINE_Y, 'Intercept point : ', textStyle).setVisible(false);
        this.timeToInterceptText = scene.add.text(20, INFO_LINE_Y, 'Time until intercept : ', textStyle).setVisible(false);
        this.missilePositionText = scene.add.text(20, INFO_LINE_Y, 'Missile position : ', textStyle).setVisible(false);
        this.missileVelocityText = scene.add.text(20, INFO_LINE_Y, 'Missile velocity : ', textStyle).setVisible(false);
    }

    updateStatus(wave, houseCount) {
        this.waveText.setText(`Wave : ${wave}`);
        this.lifeText.setText(`House : ${houseCount}`);
    }

    dismissInterceptionPanel() {
        this.interceptPointText.setVisible(false);
        this.timeToInterceptText.setVisible(false);
        this.missilePositionText.setVisible(false);
        this.missileVelocityText.setVisible(false);
    }

    showLine(text, content, y) {
        text.setText(content).setY(y).setVisible(true);
        return y + INFO_LINE_STEP;
    }

    showInterceptionPanel(enemy, interceptPoint, infoMode) {
        if (!enemy || !enemy.body) return;

        this.dismissInterceptionPanel();

        const scene = this.scene;
        const w = scene.scale.width;
        const h = scene.scale.height;
        const ppm = scene.PPM;

        const missileX = GameMath.toShiftedX(Math.round(enemy.x), w, scene.shiftOriginX) / ppm;
        const missileY = GameMath.toShiftedY(Math.round(enemy.y), h, scene.shiftOriginY) / ppm;
        const vx = enemy._savedVelocityX / ppm;
        const vy = -enemy._savedVelocityY / ppm;

        let timeToIntercept = null;
        if (interceptPoint && enemy._savedVelocityX !== 0) {
            timeToIntercept =
                Math.round(((interceptPoint.x - enemy.x) / enemy._savedVelocityX) * 1000) / 1000;
        }

        let interceptX = null;
        let interceptY = null;
        if (interceptPoint) {
            interceptX = GameMath.toShiftedX(Math.round(interceptPoint.x), w, scene.shiftOriginX) / ppm;
            interceptY = GameMath.toShiftedY(Math.round(interceptPoint.y), h, scene.shiftOriginY) / ppm;
        }

        let y = INFO_LINE_Y;

        switch (infoMode) {
            case 1:
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
                this.showLine(
                    this.missileVelocityText,
                    `Missile velocity : (${Math.round(vx)}, ${Math.round(vy)})`,
                    y
                );
                break;
            case 2:
                if (timeToIntercept !== null) {
                    y = this.showLine(
                        this.timeToInterceptText,
                        `Time until intercept : ${timeToIntercept}`,
                        y
                    );
                }
                y = this.showLine(
                    this.missileVelocityText,
                    `Missile velocity : (${Math.round(vx)}, ${Math.round(vy)})`,
                    y
                );
                this.showLine(
                    this.missilePositionText,
                    `Missile position : (${missileX}, ${missileY})`,
                    y
                );
                break;
            case 3:
                if (interceptPoint) {
                    y = this.showLine(
                        this.interceptPointText,
                        `Intercept point : (${interceptX}, ${interceptY})`,
                        y
                    );
                }
                if (timeToIntercept !== null) {
                    this.showLine(
                        this.timeToInterceptText,
                        `Time until intercept : ${timeToIntercept}`,
                        y
                    );
                }
                break;
            default:
                break;
        }
    }
}
