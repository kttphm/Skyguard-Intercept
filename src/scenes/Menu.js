export default class Menu extends Phaser.Scene {

    constructor() {
        super('Menu');
    }

    create() {
        this.initMap();
        this.initGameUi();
    }

    //--------------------------------------------------//

    initMap() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'space');
    }

    initGameUi() {
        const buttons = this.add.group();

        const centerX = this.scale.width * 0.5;
        const startY = 300;
        const spacing = 80;

        const playBtn  = this.add.sprite(centerX, startY, 'button');
        const tutorialBtn = this.add.sprite(centerX, startY + spacing, 'button');
        const settingBtn  = this.add.sprite(centerX, startY + spacing*2, 'button');
        const creditBtn  = this.add.sprite(centerX, startY + spacing*3, 'button');

        buttons.addMultiple([playBtn, tutorialBtn, settingBtn, creditBtn]);

        buttons.children.iterate((btn) => {
            btn.setInteractive({ useHandCursor: true });

            btn.on('pointerdown', function () {
                this.setTint(0xaaaaaa);
            });

            btn.on('pointerout', function () {
                this.clearTint();
            });
        });

        playBtn.on('pointerup', () => {
            playBtn.clearTint();
            this.scene.start('Game');
        });

        tutorialBtn.on('pointerup', () => {
            tutorialBtn.clearTint();
            this.scene.start('Tutorial');
        });
        
        settingBtn.on('pointerup', () => {
            settingBtn.clearTint();
            this.scene.launch('Setting');
        });

        creditBtn.on('pointerup', () => {
            creditBtn.clearTint();
            this.scene.start('Credit');
        });
    }
}