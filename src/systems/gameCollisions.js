import * as GameMath from '../utils/gameMath.js';
import * as Ballistics from './ballistics.js';
import { freezeEnemiesAndMissiles } from './domeThreatFreeze.js';
import { HOUSE2_SCALING } from '../world/buildGameWorld.js';

function getHouseLowerBoundY(scene) {
    const houses = scene.houses ? scene.houses.getChildren() : [];
    const activeHouses = houses.filter((house) => house && house.active);

    if (activeHouses.length === 0) {
        return scene.scale.height;
    }

    return activeHouses.reduce((lowestY, house) => {
        const bounds = house.getBounds();
        return Math.max(lowestY, bounds.bottom);
    }, -Infinity);
}

export function onPlayerHitGround(scene, obj1, obj2) {
    const missile = scene.missiles.contains(obj1)
        ? obj1
        : scene.missiles.contains(obj2)
            ? obj2
            : obj1;

    if (!missile || !missile.active || !missile.visible) return;

    const lowerBoundY = getHouseLowerBoundY(scene);
    if (missile.y >= lowerBoundY) {
        missile.destroy();
    }
}

export function onEnemyHitGround(scene, obj1, obj2) {
    const enemy = scene.enemies.contains(obj1)
        ? obj1
        : scene.enemies.contains(obj2)
            ? obj2
            : obj1;

    if (!enemy || !enemy.active) return;

    const lowerBoundY = getHouseLowerBoundY(scene);
    if (enemy.y >= lowerBoundY) {
        enemy.destroy();
    }
}

function onEnemyHitMissile(scene, obj1, obj2) {
    const enemy = scene.missiles.contains(obj1) ? obj2 : obj1;
    const missile = scene.missiles.contains(obj1) ? obj1 : obj2;
    if (enemy.active) enemy.destroy();
    if (missile.active) missile.destroy();
}

function onEnemyHitHouse(scene, obj1, obj2) {
    const enemy = scene.enemies.contains(obj1) ? obj1 : obj2;
    const house = scene.houses.contains(obj1) ? obj1 : obj2;
    if (enemy.active) enemy.destroy();
    if (house.active) {
        const { x, y } = house;
        house.destroy();
        const ruin = scene.ruinedHouses.create(x, y + 4, 'house2');
        ruin.setScale(HOUSE2_SCALING);
        ruin.body.setAllowGravity(false);
    }
}

function onEnemyHitRuinedHouse(scene, obj1, obj2) {
    const enemy = scene.enemies.contains(obj1) ? obj1 : obj2;
    const ruin = scene.ruinedHouses.contains(obj1) ? obj1 : obj2;
    if (enemy.active) enemy.destroy();
    if (ruin.active) ruin.destroy();
}

function onEnemyEnteredDome(scene, obj1, obj2) {
    if (scene.isGameOver) return;

    const enemy = scene.enemies.contains(obj1) ? obj1 : obj2;
    if (!enemy || enemy._hasTriggeredStop) return;
    enemy._hasTriggeredStop = true;

    if (!scene.isEnemyDetected) {
        scene.isEnemyDetected = true;
        freezeEnemiesAndMissiles(scene);
        scene.pauseSpawning();
    }

    Ballistics.renderMissileTrajectory(scene, enemy, 0.15);
    scene.interceptInfoMode = 1;
    scene.interceptPoint = Ballistics.pickInterceptPoint(scene, enemy, scene.trails);
    Ballistics.setInterceptMarkerStyle(scene.interceptPoint, true);
    scene.gameHud.showInterceptionPanel(enemy, scene.interceptPoint);
    scene.missileLaunchInput.begin();
}

export function setupGameCollisions(scene) {
    scene.physics.add.overlap(scene.enemies, scene.missiles, (a, b) => onEnemyHitMissile(scene, a, b));
    scene.physics.add.overlap(scene.enemies, scene.houses, (a, b) => onEnemyHitHouse(scene, a, b));
    scene.physics.add.overlap(scene.enemies, scene.ruinedHouses, (a, b) => onEnemyHitRuinedHouse(scene, a, b));
    scene.physics.add.overlap(
        scene.enemies,
        scene.dome,
        (a, b) => onEnemyEnteredDome(scene, a, b),
        (a, b) => GameMath.isInsideDomeArc(scene.enemies, a, b),
        scene
    );
}
