export default class Turret extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, PPM, missileGroup) {
        super(scene, x, y, 'turrettop');

        scene.add.existing(this);

        this.PPM = PPM;
        this.missileGroup = missileGroup;
        this.launchAngle = 45;
        this.angleDelayShift = 120; // ms delay when Shift is held
        this.angleDelayNormal = 10; // ms delay otherwise
        this.nextAngleStepAt = 0;

        this.turretBarrel = this.scene.textures.get('turrettop').getSourceImage().height;
        this.turretBase = this.scene.textures.get('turretbase').getSourceImage().height;
        this.missileHeight = this.scene.textures.get('missile').getSourceImage().width;

        this.setDisplayOrigin(this.width/2, this.height + 25); // 30 is the turret base radius

        // Missile speeds in m/s (meters per second)
        this.missileTypes = ['light', 'standard', 'heavy'];
        this.missileSpeeds = { light: 10, standard: 20, heavy: 30}; // m/s
        this.currentMissileIndex = 1;

        // Input keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        this.handleTurretRotation();
        if (this.scene.isEnemyDetected) return;
        this.handleAngleInput();
        this.handleMissileInput();
        this.handleLaunchMissile();
    }

    handleAngleInput() {
        const maxAngle = 170;
        const minAngle = 10;

        const now = this.scene.time.now;
        const delay = this.cursors?.shift.isDown ? this.angleDelayShift : this.angleDelayNormal;

        if (now < this.nextAngleStepAt) return;

        if (this.cursors?.left.isDown && this.launchAngle < maxAngle) {
            this.launchAngle += 1;
            this.nextAngleStepAt = now + delay;
        } else if (this.cursors?.right.isDown && this.launchAngle > minAngle) {
            this.launchAngle -= 1;
            this.nextAngleStepAt = now + delay;
        }
    }

    handleMissileInput() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.currentMissileIndex < this.missileTypes.length - 1) {
            this.currentMissileIndex += 1;
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) && this.currentMissileIndex > 0) {
            this.currentMissileIndex -= 1;
        }
    }

    handleLaunchMissile() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const missileSpeedMs = this.missileSpeeds[this.missileTypes[this.currentMissileIndex]];
            this.launchMissileAt(this.launchAngle, missileSpeedMs);
        }
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

    // Getters for UI updates
    getLaunchAngle() {
        return this.launchAngle;
    }

    getCurrentMissileType() {
        return this.missileTypes[this.currentMissileIndex];
    }

    getCurrentMissileSpeed() {
        return this.missileSpeeds[this.missileTypes[this.currentMissileIndex]];
    }

    // Conversion helper function
    metersToPixels(meters) {
        return meters * this.PPM;
    }
}
