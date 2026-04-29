export default class Preload extends Phaser.Scene {

    constructor() {
        super('Preload');
    }

    preload() {
        this.load.image('space', 'assets/space.png');
        this.load.image('button', 'assets/button.png');
        this.load.image('background', 'assets/background.png');
        //this.load.image('ground', 'assets/ground.png');
        this.load.image('missile', 'assets/missile.png');
        this.load.image('enemy', 'assets/enemy.png');
        //this.load.image('house', 'assets/house.png');
        //this.load.image('turrettop', 'assets/TurretTop.png');
        //this.load.image('turretbase', 'assets/TurretBase.png');
    }

    create() {
        this.generateGroundTexture();
        this.generateDomeTexture();
        this.generateHouseTexture();
        this.generateTurretBaseTexture();
        this.generateTurretBarrelTexture();
        this.scene.start('Menu');
    }

    generateDomeTexture() {
        const radius = 550; // 425
        const lineThickness = 0.5;
        const graphics = this.add.graphics();

        graphics.lineStyle(lineThickness, 0x0f766e, 1);
        graphics.fillStyle(0x0f766e, 0.12);

        graphics.beginPath();
        graphics.arc(radius + lineThickness, radius + lineThickness, radius, Math.PI, 0, false);
        graphics.closePath();

        graphics.fillPath();
        graphics.strokePath();

        graphics.generateTexture('dome', 2 * (radius + lineThickness), radius + lineThickness);
        graphics.destroy();
    }

    generateHouseTexture() {
        const width = 20
        const height = 15
        const graphics = this.add.graphics();

        graphics.fillStyle(0xffde59, 1);

        graphics.fillRect(0, 0, width, height);

        graphics.generateTexture("house", width, height);

        graphics.destroy();
    }

    generateGroundTexture() {
        const width  = 1280;
        const height = 30;
        const graphics = this.add.graphics();
        
        graphics.fillStyle(0x262d32, 1);
        
        graphics.fillRect(0, 0, width, height);

        graphics.generateTexture("ground", width, height);

        graphics.destroy();
    }

    generateTurretBaseTexture() {
        const radius = 30;
        const graphics = this.add.graphics();

        graphics.fillStyle(0x12c8dd, 1);

        graphics.beginPath();
        graphics.arc(radius, radius, radius, Math.PI, 0, false);
        graphics.closePath();

        graphics.fillPath();

        graphics.generateTexture("turretbase", radius * 2, radius);

        graphics.destroy();
    }

    generateTurretBarrelTexture() {
        const width = 10
        const height = 36
        const graphics = this.add.graphics();

        graphics.fillStyle(0x8e9392, 1);

        graphics.fillRect(0, 0, width, height);

        graphics.generateTexture("turrettop", width, height);

        graphics.destroy();
    }
}
