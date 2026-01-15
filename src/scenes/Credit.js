export default class Credit extends Phaser.Scene {

    constructor() {
        super('Credit');
    }

    create() {
        const returnBtn = this.physics.add.sprite(200, 650, 'button');

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
