export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, housesGroup, PPM) {
        const { x, y } = Enemy.getSpawnPosition(scene);
        super(scene, x, y, "enemy");

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.PPM = PPM;

        const houses = housesGroup.getChildren();
        if (houses.length === 0) {
            this.destroy();
            return;
        }

        this.targetHouse = Phaser.Utils.Array.GetRandom(houses);
    }

    launch() {
        const target = this.targetHouse;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const g = this.scene.physics.world.gravity.y;

        // Pick a flight time so every enemy has slight path variation but still reaches target.
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        const flightTime = Phaser.Math.Clamp(distance / Phaser.Math.Between(180, 260), 1.2, 3);

        const vx = dx / flightTime;
        const vy = (dy - 0.5 * g * flightTime * flightTime) / flightTime;

        this.body.setVelocity(vx, vy);
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
