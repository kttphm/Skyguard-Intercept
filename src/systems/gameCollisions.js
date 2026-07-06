import * as GameMath from '../utils/gameMath.js';
import * as Ballistics from './ballistics.js';
import { freezeEnemiesAndMissiles } from './domeThreatFreeze.js';
import { HOUSE2_SCALING } from '../world/buildGameWorld.js';

function onPlayerHitGround(scene, obj1, obj2) {
    const missile = obj1 === scene.ground ? obj2 : obj1;
    if (!missile.visible) return;
    if (missile.active) missile.destroy();
}

function onEnemyHitGround(scene, obj1, obj2) {
    const enemy = obj1 === scene.ground ? obj2 : obj1;
    if (enemy.active) enemy.destroy();
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

const INTERCEPT_INFO_MODES = [1, 2, 3];
const INTERCEPT_INFO_MODE_WEIGHTS = [0.25, 0.25, 0.5];

function pickInterceptInfoMode() {
    const roll = Math.random();
    let cumulative = 0;

    for (let i = 0; i < INTERCEPT_INFO_MODES.length; i++) {
        cumulative += INTERCEPT_INFO_MODE_WEIGHTS[i];
        if (roll < cumulative) {
            return INTERCEPT_INFO_MODES[i];
        }
    }

    return 3;
}

function onEnemyEnteredDome(scene, obj1, obj2) {
    const enemy = scene.enemies.contains(obj1) ? obj1 : obj2;
    if (!enemy || enemy._hasTriggeredStop) return;
    enemy._hasTriggeredStop = true;

    if (!scene.isEnemyDetected) {
        scene.isEnemyDetected = true;
        freezeEnemiesAndMissiles(scene);
        scene.pauseSpawning();
    }

    Ballistics.renderMissileTrajectory(scene, enemy, 0.15);
    scene.interceptInfoMode = pickInterceptInfoMode();
    scene.interceptPoint = Ballistics.pickInterceptPoint(scene, enemy, scene.trails);
    const showInterceptMarker = scene.interceptInfoMode === 1 || scene.interceptInfoMode === 3;
    Ballistics.setInterceptMarkerStyle(scene.interceptPoint, showInterceptMarker);
    scene.gameHud.showInterceptionPanel(enemy, scene.interceptPoint, scene.interceptInfoMode);
    scene.missileLaunchInput.begin();
}

export function setupGameCollisions(scene) {
    scene.physics.add.overlap(scene.missiles, scene.ground, (a, b) => onPlayerHitGround(scene, a, b));
    scene.physics.add.overlap(scene.enemies, scene.ground, (a, b) => onEnemyHitGround(scene, a, b));
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
