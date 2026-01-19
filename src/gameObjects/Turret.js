export default class Turret extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, PPM, missileGroup) {
        super(scene, x, y, 'turrettop');

        scene.add.existing(this);

        this.PPM = PPM;
        this.missileGroup = missileGroup;
        this.launchAngle = 0;
        this.angleDelayShift = 120; // ms delay when Shift is held
        this.angleDelayNormal = 10; // ms delay otherwise
        this.nextAngleStepAt = 0;

        // Missile speeds in m/s (meters per second)
        this.missileTypes = ['light', 'standard', 'heavy', 'test'];
        this.missileSpeeds = { light: 100, standard: 150, heavy: 200 , test: 1000}; // m/s
        this.currentMissileIndex = 1;

        // Input keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        this.handleAngleInput();
        this.handleMissileInput();
        this.handleLaunchMissile();
        this.handleTurretRotation();
    }

    handleAngleInput() {
        const now = this.scene.time.now;
        const delay = this.cursors?.shift.isDown ? this.angleDelayShift : this.angleDelayNormal;
        if (now < this.nextAngleStepAt) return;

        if (this.cursors?.left.isDown && this.launchAngle < 180) {
            this.launchAngle += 1;
            this.nextAngleStepAt = now + delay;
        } else if (this.cursors?.right.isDown && this.launchAngle > 0) {
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
        const turretBarrel = 31; // 25.6

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const missileSpeedMs = this.missileSpeeds[this.missileTypes[this.currentMissileIndex]]; // m/s
            const missileSpeedPx = this.metersToPixels(missileSpeedMs); // pixels/s
            
            const angleInRadians = Phaser.Math.DegToRad(-this.launchAngle);
            
            let missileX, missileY;

            if (this.launchAngle > 90) {
                missileX = this.x + Math.cos(angleInRadians + 0.14889) * turretBarrel;
                missileY = this.y + Math.sin(angleInRadians + 0.14889) * turretBarrel;
            }
            else {
                missileX = this.x + Math.cos(angleInRadians - 0.14889) * turretBarrel;
                missileY = this.y + Math.sin(angleInRadians - 0.14889) * turretBarrel;    
            }

            const missile = this.scene.physics.add.sprite(missileX, missileY, 'missile');

            // Add missile to group for tracking and cleanup
            this.missileGroup.add(missile);
            
            // Velocity in pixels/s (converted from m/s)
            const velocityX = Math.cos(angleInRadians) * missileSpeedPx;
            const velocityY = Math.sin(angleInRadians) * missileSpeedPx;
            
            missile.setVelocity(velocityX, velocityY);
            missile.setRotation(angleInRadians);
        }
    }

    handleTurretRotation() {
        let angleInRadians = Phaser.Math.DegToRad(-this.launchAngle);

        this.setFlipY(this.launchAngle > 90);
        
        const baseX = this.displayWidth / 2;
        const baseY = this.displayHeight / 2;

        if (this.flipY) {
            this.setDisplayOrigin(baseX - 9, baseY - 4);
        } else {
            this.setDisplayOrigin(baseX - 9, baseY + 4);
        }

        this.setRotation(angleInRadians);
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
