export default class Preload extends Phaser.Scene {

    constructor() {
        super('Preload');
    }

    preload() {
        this.load.image('space', 'assets/space.png');
        this.load.image('button', 'assets/button.png');
        this.load.image('background', 'assets/background.png');
        this.load.image('ground', 'assets/ground.png');
        this.load.image('missile', 'assets/missile.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('house', 'assets/house.png');
        this.load.image('turrettop', 'assets/TurretTop.png');
        this.load.image('turretbase', 'assets/TurretBase.png');
    }

    create() {
        const dome_R = 425;
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
        
        this.scene.start('Menu');
    }
}
