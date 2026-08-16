import { onMultiInterceptLaunch } from '../systems/multiIntercept.js';

export default class Turret extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, PPM, missileGroup) {
        super(scene, x, y, 'turrettop');

        scene.add.existing(this);

        this.PPM = PPM;
        this.missileGroup = missileGroup;
        this.launchAngle = 45;
        this.displayAngle = 45;
        this.rotationSpeedDeg = 100;
        this.rotationEpsilon = 0.5;
        this.pendingLaunchSpeed = null;

        this.turretBarrel = this.scene.textures.get('turrettop').getSourceImage().height;
        this.turretBase = this.scene.textures.get('turretbase').getSourceImage().height;
        this.missileHeight = this.scene.textures.get('missile').getSourceImage().width;

        this.setDisplayOrigin(this.width/2, this.height + 25); // 30 is the turret base radius
    }

    update() {
        this.handleTurretRotation();
        this.tryLaunchWhenReady();
    }

    setTargetAngle(angleDeg) {
        this.launchAngle = angleDeg;
    }

    launchMissileAt(angleDeg, speedMs) {
        this.launchAngle = angleDeg;
        this.pendingLaunchSpeed = speedMs;
    }

    isAimed() {
        return Math.abs(this.displayAngle - this.launchAngle) <= this.rotationEpsilon;
    }

    tryLaunchWhenReady() {
        if (this.pendingLaunchSpeed === null || !this.isAimed()) return;

        const speedMs = this.pendingLaunchSpeed;
        this.pendingLaunchSpeed = null;
        this.fireMissile(speedMs);
    }

    fireMissile(speedMs) {
        const missileSpeedPx = this.metersToPixels(speedMs);
        const angleInRadians = Phaser.Math.DegToRad(-this.launchAngle);

        const missile = this.scene.physics.add.sprite(this.x, this.y, 'missile').setScale(0.7);
        missile.setVisible(false);

        this.missileGroup.add(missile);

        const velocityX = Math.cos(angleInRadians) * missileSpeedPx;
        const velocityY = Math.sin(angleInRadians) * missileSpeedPx;

        missile.setVelocity(velocityX, velocityY);
        missile.setRotation(angleInRadians);

        const distance = this.turretBarrel + this.turretBase + this.missileHeight / 2;
        const revealDelayMs = (distance / missileSpeedPx) * 1000;
        this.scene.time.delayedCall(revealDelayMs, () => {
            if (missile.active) {
                missile.setVisible(true);
            }
        });

        // Multi-intercept big enemies: brief resume, then next point (until last launch).
        if (onMultiInterceptLaunch(this.scene)) {
            return;
        }

        this.scene.dismissDomeThreat();
        this.scene.dismissInterceptionPanel();
        this.scene.interceptCalculator?.hide();
    }

    handleTurretRotation() {
        const delta = this.scene.game.loop.delta;
        const maxStep = this.rotationSpeedDeg * (delta / 1000);
        const diff = this.launchAngle - this.displayAngle;

        if (Math.abs(diff) <= maxStep) {
            this.displayAngle = this.launchAngle;
        } else {
            this.displayAngle += Math.sign(diff) * maxStep;
        }

        const angleInRadians = Phaser.Math.DegToRad(-this.displayAngle);
        this.setRotation(angleInRadians + Math.PI / 2);
    }

    metersToPixels(meters) {
        return meters * this.PPM;
    }
}
