import Turret from '../gameObjects/Turret.js';

export const HOUSE_SCALING = 0.35;
export const HOUSE2_SCALING = 0.35;

// Spawns background, ground, dome, houses, and turret.
// Mutates `scene` with `ground`, `dome`, `turret` and fills `houses` group.

export function buildGameWorld(scene, { houses, missiles, ppm }) {
    const canvas_W = scene.scale.width;
    const canvas_H = scene.scale.height;
    const centerX = canvas_W / 2;
    const centerY = canvas_H / 2;

    const ground_H = 87;
    const ground_lv = canvas_H - 87;

    const dome_R = scene.textures.get('dome').getSourceImage().height;

    scene.add.image(centerX, centerY, 'background');


    scene.dome = scene.physics.add.sprite(centerX, ground_lv - dome_R / 2, 'dome');
    const DomeEdge_L = scene.dome.getBounds().left;
    const DomeEdge_R = scene.dome.getBounds().right;

    const spacing_dome = 150;
    const spacing_house = 30;
    const house_count = 4;
    const house_scaling = HOUSE_SCALING;

    const house_H = scene.textures.get('house1').getSourceImage().height * house_scaling;
    const house_W = scene.textures.get('house1').getSourceImage().width * house_scaling;

    const houseX1 = DomeEdge_L + spacing_dome + house_W / 2;
    const houseX2 = DomeEdge_R - spacing_dome - (house_count - 1) * house_W - (house_count - 1) * spacing_house - house_W / 2;
    const houseY = canvas_H - ground_H - house_H / 2;

    houses.createMultiple({
        key: 'house1',
        repeat: house_count - 1,
        setXY: { x: houseX1, y: houseY, stepX: spacing_house + house_W }
    });
    houses.createMultiple({
        key: 'house1',
        repeat: house_count - 1,
        setXY: { x: houseX2, y: houseY, stepX: spacing_house + house_W }
    });
    houses.children.iterate((house) => {
        house.setScale(house_scaling);
    });

    const turretbase_H = scene.textures.get('turretbase').getSourceImage().height;

    scene.add.image(centerX, ground_lv - turretbase_H / 2, 'turretbase');
    scene.turret = new Turret(scene, centerX, ground_lv, ppm, missiles);

    scene.dome.body.setAllowGravity(false);
    houses.children.iterate((house) => {
        if (!house) return;
        house.body.setAllowGravity(false);
    });
}
