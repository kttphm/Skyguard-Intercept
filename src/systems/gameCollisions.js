import * as GameMath from '../utils/gameMath.js';
import * as Ballistics from './ballistics.js';
import { freezeEnemiesAndMissiles, resumeAllMotion } from './domeThreatFreeze.js';
import {
    beginMultiIntercept,
    clearMultiIntercept
} from './multiIntercept.js';
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
        handleEnemyDestroyed(scene, enemy);
        enemy.destroy();
    }
}

function handleEnemyDestroyed(scene, enemy) {
    if (!enemy || scene.multiIntercept?.enemy !== enemy) return;

    clearMultiIntercept(scene);
    scene.missileLaunchInput?.hide();
    scene.interceptCalculator?.hide();
    scene.gameHud?.dismissInterceptionPanel();

    if (scene.isEnemyDetected) {
        scene.isEnemyDetected = false;
        resumeAllMotion(scene);
        if (scene.trails) scene.trails.clear(true, true);
    }

    scene.resumeSpawning();
}

function onEnemyHitMissile(scene, obj1, obj2) {
    const enemy = scene.missiles.contains(obj1) ? obj2 : obj1;
    const missile = scene.missiles.contains(obj1) ? obj1 : obj2;

    if (missile?.active) missile.destroy();
    if (!enemy?.active) return;

    const hp = enemy.hitPoints ?? 1;
    if (hp > 1) {
        enemy.hitPoints = hp - 1;
        enemy.setTint(0xf97316);
        return;
    }

    handleEnemyDestroyed(scene, enemy);
    enemy.destroy();
}

function onEnemyHitHouse(scene, obj1, obj2) {
    const enemy = scene.enemies.contains(obj1) ? obj1 : obj2;
    const house = scene.houses.contains(obj1) ? obj1 : obj2;
    if (enemy.active) {
        handleEnemyDestroyed(scene, enemy);
        enemy.destroy();
    }
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
    if (enemy.active) {
        handleEnemyDestroyed(scene, enemy);
        enemy.destroy();
    }
    if (ruin.active) ruin.destroy();
}

function onEnemyEnteredDome(scene, obj1, obj2) {
    if (scene.isGameOver) return;

    const enemy = scene.enemies.contains(obj1) ? obj1 : obj2;
    if (!enemy || enemy._hasTriggeredStop) return;

    // Target house already gone — let it fly through with no intercept pause.
    if (!enemy.targetHouse || !enemy.targetHouse.active) {
        enemy._hasTriggeredStop = true;
        return;
    }

    enemy._hasTriggeredStop = true;

    if (!scene.isEnemyDetected) {
        scene.isEnemyDetected = true;
        freezeEnemiesAndMissiles(scene);
        scene.pauseSpawning();
    }

    if (enemy.isBig && beginMultiIntercept(scene, enemy)) {
        return;
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
