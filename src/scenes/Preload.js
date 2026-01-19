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
        const dome_R = 250; // min = 150
        const domeGraphics = this.add.graphics();
        domeGraphics.fillStyle(0x0f766e, 0.12);
        domeGraphics.beginPath();
        domeGraphics.arc(dome_R, dome_R, dome_R, Math.PI, 0, false);
        domeGraphics.closePath();
        domeGraphics.fillPath();
        domeGraphics.generateTexture('dome', 2*dome_R, dome_R);
        domeGraphics.destroy();
        
        this.scene.start('Menu');
    }
}
