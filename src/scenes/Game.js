export default class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.PPM = 10;
        
        this.initMap();
        
        this.life = 5;
        this.launchAngle = 0;
        this.angleDelayShift = 120; // ms delay when Shift is held
        this.angleDelayNormal = 10; // ms delay otherwise
        this.nextAngleStepAt = 0;

        // Missile speeds in m/s (meters per second)
        this.missileTypes = ['light', 'standard', 'heavy'];
        this.missileSpeeds = { light: 100, standard: 150, heavy: 200 }; // m/s
        this.currentMissileIndex = 1;

        const textStyle = { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff' };

        this.lifeText = this.add.text(20, 20, `Life : ${this.life}`, textStyle);
        this.angleText = this.add.text(20, 50, `Launch angle : ${this.launchAngle}`, textStyle);
        this.missileText = this.add.text(20, 80, `Missile : ${this.missileTypes[this.currentMissileIndex]} (speed: ${this.missileSpeeds[this.missileTypes[this.currentMissileIndex]]} m/s)`, textStyle);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        this.AngleInput();
        this.MissileInput();
        this.LaunchMissile();
        this.angleText.setText(`Launch angle : ${this.launchAngle}`);
        this.missileText.setText(`Missile : ${this.missileTypes[this.currentMissileIndex]} (speed: ${this.missileSpeeds[this.missileTypes[this.currentMissileIndex]]} m/s)`);
    }

    initMap() {
        const canvas_W = this.scale.width;
        const canvas_H = this.scale.height;

        const ground_H = this.textures.get('ground').getSourceImage().height;
        const house_H = this.textures.get('house').getSourceImage().height;
        const ground_lv = canvas_H - ground_H;

        this.add.image(canvas_W/2, canvas_H/2, 'background');

        const ground = this.physics.add.sprite(canvas_W/2, canvas_H - ground_H/2, 'ground');
        this.dome = this.physics.add.sprite(canvas_W/2, ground_lv - 150/2, 'dome');

        //draw houses
        const centerX = canvas_W / 2;
        const houseY = canvas_H - ground_H - house_H / 2;
        const spacing = 50;

        const startX = centerX - (2 * spacing);

        const houses = this.physics.add.group({
            key: 'house',
            repeat: 4,
            setXY: { 
                x: startX,
                y: houseY,
                stepX: spacing
            }
        });
    }

    AngleInput() {
        const now = this.time.now;
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

    MissileInput() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.currentMissileIndex < this.missileTypes.length - 1) {
            this.currentMissileIndex += 1;
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) && this.currentMissileIndex > 0) {
            this.currentMissileIndex -= 1;
        }
    }

    LaunchMissile() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            // Get missile speed in m/s and convert to pixels/s
            const missileSpeedMs = this.missileSpeeds[this.missileTypes[this.currentMissileIndex]]; // m/s
            const missileSpeedPx = this.metersToPixels(missileSpeedMs); // pixels/s
            
            const angleInRadians = Phaser.Math.DegToRad(-this.launchAngle);
            
            // Position in pixels (Phaser uses pixels)
            const missile = this.physics.add.sprite(this.dome.x, this.dome.y, 'missile');
            
            // Velocity in pixels/s (converted from m/s)
            const velocityX = Math.cos(angleInRadians) * missileSpeedPx;
            const velocityY = Math.sin(angleInRadians) * missileSpeedPx;
            
            missile.setVelocity(velocityX, velocityY);
            missile.setRotation(angleInRadians);
        }
    }

    // Conversion helper functions
    pixelsToMeters(pixels) {
        return pixels / this.PPM;
    }

    metersToPixels(meters) {
        return meters * this.PPM;
    }

    // For setting positions in meters
    setPositionInMeters(sprite, xMeters, yMeters) {
        sprite.x = this.metersToPixels(xMeters);
        sprite.y = this.metersToPixels(yMeters);
    }

    // For setting velocity in m/s
    setVelocityInMs(sprite, vxMs, vyMs) {
        sprite.setVelocity(
            this.metersToPixels(vxMs),
            this.metersToPixels(vyMs)
        );
    }

    // For setting acceleration in m/s²
    setAccelerationInMs2(sprite, axMs2, ayMs2) {
        sprite.setAcceleration(
            this.metersToPixels(axMs2),
            this.metersToPixels(ayMs2)
        );
    }
}