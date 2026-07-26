export default class Preload extends Phaser.Scene {

    constructor() {
        super('Preload');
    }

    preload() {
        this.load.image('space', 'assets/bg1.png');
        this.load.image('background', 'assets/bg.png');
        this.load.image('tut', 'assets/tut.jpg');

        this.load.image('button1', 'assets/button1.png');
        this.load.image('button2', 'assets/button2.png');
        this.load.image('button3', 'assets/button3.png');
        this.load.image('button4', 'assets/button4.png');

        this.load.image('missile', 'assets/missile.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('house1', 'assets/house1.png');
        this.load.image('house2', 'assets/house2.png');

        this.load.image('title', 'assets/Title.png');
        this.load.image('game_over', 'assets/game_over.png');
    }

    create() {
        this.generateGroundTexture();
        this.generateDomeTexture();
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
        const radius = 25;
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
        const width = 8
        const height = 36
        const graphics = this.add.graphics();

        graphics.fillStyle(0x8e9392, 1);

        graphics.fillRect(0, 0, width, height);

        graphics.generateTexture("turrettop", width, height);

        graphics.destroy();
    }
}
