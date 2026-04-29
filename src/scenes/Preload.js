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
        this.load.image('turrettop', 'assets/TurretTop.png');
        this.load.image('turretbase', 'assets/TurretBase.png');
    }

    create() {
        this.generateGroundTexture()
        this.generateDomeTexture()
        this.generateHouseTexture()
        this.scene.start('Menu');
    }

    generateDomeTexture() {
        const dome_R = 550; // 425
        const lineThickness = 0.5;
        const domeGraphics = this.add.graphics();

        domeGraphics.lineStyle(lineThickness, 0x0f766e, 1); 
        domeGraphics.fillStyle(0x0f766e, 0.12);

        domeGraphics.beginPath();
        domeGraphics.arc(dome_R + lineThickness, dome_R + lineThickness, dome_R, Math.PI, 0, false);
        domeGraphics.closePath();

        domeGraphics.fillPath();
        domeGraphics.strokePath(); 

        domeGraphics.generateTexture('dome', 2 * (dome_R + lineThickness), dome_R + lineThickness);
        domeGraphics.destroy();
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
}
