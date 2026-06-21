export default class Turret extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, PPM, missileGroup) {
        super(scene, x, y, 'turrettop');

        scene.add.existing(this);

        this.PPM = PPM;
        this.missileGroup = missileGroup;
        this.launchAngle = 45;

        this.turretBarrel = this.scene.textures.get('turrettop').getSourceImage().height;
        this.turretBase = this.scene.textures.get('turretbase').getSourceImage().height;
        this.missileHeight = this.scene.textures.get('missile').getSourceImage().width;

        this.setDisplayOrigin(this.width/2, this.height + 25); // 30 is the turret base radius
    }

    update() {
        this.handleTurretRotation();
    }

    launchMissileAt(angleDeg, speedMs) {
        const missileSpeedPx = this.metersToPixels(speedMs);
        const angleInRadians = Phaser.Math.DegToRad(-angleDeg);

        this.launchAngle = angleDeg;

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
    }

    handleTurretRotation() {
        const angleInRadians = Phaser.Math.DegToRad(-this.launchAngle);

        this.setRotation(angleInRadians + Math.PI/2);
    }

    metersToPixels(meters) {
        return meters * this.PPM;
    }
}
