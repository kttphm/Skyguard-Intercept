export default class Turret {
    constructor(scene, dome, ppm, missileGroup) {
        this.scene = scene;
        this.dome = dome;
        this.PPM = ppm;
        this.missileGroup = missileGroup;
        
        this.launchAngle = 0;
        this.angleDelayShift = 120; // ms delay when Shift is held
        this.angleDelayNormal = 10; // ms delay otherwise
        this.nextAngleStepAt = 0;

        // Missile speeds in m/s (meters per second)
        this.missileTypes = ['light', 'standard', 'heavy'];
        this.missileSpeeds = { light: 100, standard: 150, heavy: 200 }; // m/s
        this.currentMissileIndex = 1;

        // Input keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        this.handleAngleInput();
        this.handleMissileInput();
        this.handleLaunchMissile();
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
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            // Get missile speed in m/s and convert to pixels/s
            const missileSpeedMs = this.missileSpeeds[this.missileTypes[this.currentMissileIndex]]; // m/s
            const missileSpeedPx = this.metersToPixels(missileSpeedMs); // pixels/s
            
            const angleInRadians = Phaser.Math.DegToRad(-this.launchAngle);
            
            // Position in pixels (Phaser uses pixels)
            const missile = this.scene.physics.add.sprite(this.dome.x, this.dome.y, 'missile');
            
            // Add missile to group for tracking and cleanup
            this.missileGroup.add(missile);
            
            // Velocity in pixels/s (converted from m/s)
            const velocityX = Math.cos(angleInRadians) * missileSpeedPx;
            const velocityY = Math.sin(angleInRadians) * missileSpeedPx;
            
            missile.setVelocity(velocityX, velocityY);
            missile.setRotation(angleInRadians);
        }
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

