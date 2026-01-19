export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, housesGroup, PPM) {
        const { x, y } = Enemy.getSpawnPosition(scene);
        super(scene, x, y, "enemy");

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.PPM = PPM

        const houses = housesGroup.getChildren();
        this.targetHouse = Phaser.Utils.Array.GetRandom(houses);

        this.launch();
    }

    launch() {
        const target = this.targetHouse;
        const PPM = this.PPM

        const Sx_px = target.x - this.x;
        const Sy_px = target.y - this.y;

        const Sx = Sx_px / PPM;
        const Sy = Sy_px / PPM;

        // Random horizontal velocity (m/s)
        const Vx = Phaser.Math.FloatBetween(3, 7);

        const g = 9.8;

        // Your formula (in METERS)
        let Vy = Math.sqrt((Vx * Vx) + (2 * g * Sy)) - g * Sx;

        // Convert velocity back to PIXELS / SECOND
        const Vx_px = Vx * PPM;
        const Vy_px = -Vy * PPM; // invert Y for Phaser

        // Apply gravity in PIXELS / SECOND^2
        this.body.setGravityY(g * PPM);

        // Ensure horizontal direction toward target
        this.body.setVelocity(Vx_px * Math.sign(Sx_px), Vy_px);
    }

    static getSpawnPosition(scene) {
        const w = scene.scale.width;
        const h = scene.scale.height;

        const side = Phaser.Math.Between(0, 2);
        let x, y;

        switch (side) {
            case 0: // TOP
                x = Phaser.Math.Between(0, w);
                y = -50;
                break;
            case 1: // LEFT (upper half)
                x = -50;
                y = Phaser.Math.Between(0, h * 0.5);
                break;
            case 2: // RIGHT (upper half)
                x = w + 50;
                y = Phaser.Math.Between(0, h * 0.5);
                break;
        }

        return { x, y };
    }
}
