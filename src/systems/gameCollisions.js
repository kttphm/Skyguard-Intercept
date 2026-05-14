import * as GameMath from '../utils/gameMath.js';
import * as Ballistics from './ballistics.js';
import { freezeEnemiesAndMissiles } from './domeThreatFreeze.js';

function onPlayerHitGround(scene, obj1, obj2) {
    const missile = obj1 === scene.ground ? obj2 : obj1;
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
    if (house.active) house.destroy();
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

    scene.domeThreatPanel.show(enemy);
    Ballistics.renderMissileTrajectory(scene, enemy, 0.067);
    scene.interceptPoint = Ballistics.pickInterceptPoint(scene, enemy, scene.trails);
    scene.gameHud.showInterceptionPanel(enemy, scene.interceptPoint);
}

export function setupGameCollisions(scene) {
    scene.physics.add.overlap(scene.missiles, scene.ground, (a, b) => onPlayerHitGround(scene, a, b));
    scene.physics.add.overlap(scene.enemies, scene.ground, (a, b) => onEnemyHitGround(scene, a, b));
    scene.physics.add.overlap(scene.enemies, scene.missiles, (a, b) => onEnemyHitMissile(scene, a, b));
    scene.physics.add.overlap(scene.enemies, scene.houses, (a, b) => onEnemyHitHouse(scene, a, b));
    scene.physics.add.overlap(
        scene.enemies,
        scene.dome,
        (a, b) => onEnemyEnteredDome(scene, a, b),
        (a, b) => GameMath.isInsideDomeArc(scene.enemies, a, b),
        scene
    );
}
