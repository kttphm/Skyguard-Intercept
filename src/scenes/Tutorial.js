export default class Tutorial extends Phaser.Scene {

    constructor() {
        super('Tutorial');
    }

    create() {
        this.background = this.add.sprite(640, 360, 'tut');
        this.background.setScale(1.05);
        
        const returnBtn = this.physics.add.sprite(200, 650, 'button3');

        returnBtn.setInteractive({ useHandCursor: true });

        returnBtn.on('pointerdown', function () {
            this.setTint(0xaaaaaa);
        });

        returnBtn.on('pointerout', function () {
            this.clearTint();
        });

        returnBtn.on('pointerup', () => {
            returnBtn.clearTint();
            this.scene.start('Menu');
        });
    }
}
