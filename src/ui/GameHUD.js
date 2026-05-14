import * as GameMath from '../utils/gameMath.js';

export class GameHUD {
    constructor(scene) {
        this.scene = scene;
        const textStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' };

        this.waveText = scene.add.text(20, 20, 'Wave : ', textStyle);
        this.lifeText = scene.add.text(20, 50, 'House : ', textStyle);
        this.angleText = scene.add.text(20, 80, 'Launch angle : ', textStyle);
        this.missileText = scene.add.text(20, 110, 'Missile : ', textStyle);

        this.interceptPointText = scene.add.text(20, 160, 'Intercept point : ', textStyle).setVisible(false);
        this.timeToInterceptText = scene.add.text(20, 190, 'Time untill intercept : ', textStyle).setVisible(false);
    }

    updateStatus(wave, houseCount, turret) {
        this.waveText.setText(`Wave : ${wave}`);
        this.lifeText.setText(`House : ${houseCount}`);
        this.angleText.setText(`Launch angle : ${turret.getLaunchAngle()}`);
        this.missileText.setText(
            `Missile : ${turret.getCurrentMissileType()} (speed: ${turret.getCurrentMissileSpeed()} m/s)`
        );
    }

    dismissInterceptionPanel() {
        this.interceptPointText.setVisible(false);
        this.timeToInterceptText.setVisible(false);
    }

    showInterceptionPanel(enemy, interceptPoint) {
        if (!enemy || !enemy.body || !interceptPoint) return;

        const scene = this.scene;
        const w = scene.scale.width;
        const h = scene.scale.height;
        const ppm = scene.PPM;

        const interceptX = GameMath.toShiftedX(Math.round(interceptPoint.x), w, scene.shiftOriginX) / ppm;
        const interceptY = GameMath.toShiftedY(Math.round(interceptPoint.y), h, scene.shiftOriginY) / ppm;

        const timeToIntercept =
            Math.round(((interceptPoint.x - enemy.x) / enemy._savedVelocityX) * 100) / 100;

        this.interceptPointText.setText(`Intercept point : (${interceptX}, ${interceptY})`).setVisible(true);
        this.timeToInterceptText.setText(`Time untill intercept : ${timeToIntercept}`).setVisible(true);
    }
}
