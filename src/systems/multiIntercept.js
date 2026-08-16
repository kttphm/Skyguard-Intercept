import * as Ballistics from './ballistics.js';
import { freezeEnemiesAndMissiles, resumeAllMotion } from './domeThreatFreeze.js';

export const MULTI_INTERCEPT_COUNT = 3;
/** Pause once the big enemy is this close to the next marker (pixels). */
export const APPROACH_PAUSE_PX = 70;
/** Hard cap so a missed approach never runs too long. */
export const MAX_RESUME_MS = 400;
export const ORANGE_INTERCEPT = 0xf97316;
export const RED_INTERCEPT = 0xff0000;

/** Waves 3 and 5+ get one big multi-intercept enemy. */
export function isMultiInterceptWave(wave) {
    return wave === 3 || wave >= 5;
}

export function isMultiInterceptActive(scene) {
    return Boolean(scene.multiIntercept?.active);
}

export function clearMultiIntercept(scene) {
    if (!scene.multiIntercept) return;

    const { markers } = scene.multiIntercept;
    if (markers) {
        markers.forEach((marker) => {
            if (marker && marker.active) marker.destroy();
        });
    }

    if (scene.multiIntercept.resumeTimer) {
        scene.multiIntercept.resumeTimer.remove(false);
    }

    scene.multiIntercept = null;
    scene.interceptPoint = null;
}

/**
 * Start a 3-point intercept sequence for a big enemy.
 * @returns {boolean} true if multi-intercept UI was started
 */
export function beginMultiIntercept(scene, enemy) {
    Ballistics.renderMissileTrajectory(scene, enemy, 0.15);

    const trails = Ballistics.collectInterceptCandidates(scene, scene.trails);
    const picked = Ballistics.pickSpacedInterceptTrails(trails, MULTI_INTERCEPT_COUNT);

    if (picked.length === 0) {
        // Fall back to single-point flow
        return false;
    }

    while (picked.length < MULTI_INTERCEPT_COUNT) {
        picked.push(picked[picked.length - 1]);
    }

    const markers = picked.map((trail) => Ballistics.createInterceptMarker(scene, trail));

    // Markers are independent copies; hide the dense prediction trail.
    if (scene.trails) {
        scene.trails.clear(true, true);
    }

    scene.multiIntercept = {
        active: true,
        enemy,
        markers,
        currentIndex: 0,
        resumeTimer: null,
        watchingApproach: false,
        lastDistToMarker: null,
        resumeStartedAt: 0
    };

    scene.interceptPoint = markers[0];
    Ballistics.styleInterceptMarkers(markers, 0, ORANGE_INTERCEPT, RED_INTERCEPT);
    scene.gameHud.showInterceptionPanel(enemy, markers[0]);
    scene.missileLaunchInput.begin();
    return true;
}

function pauseAtNextIntercept(scene) {
    const state = scene.multiIntercept;
    if (!state?.active || scene.isGameOver) return;

    state.watchingApproach = false;
    state.lastDistToMarker = null;

    if (state.resumeTimer) {
        state.resumeTimer.remove(false);
        state.resumeTimer = null;
    }

    freezeEnemiesAndMissiles(scene);

    const marker = state.markers[state.currentIndex];
    scene.interceptPoint = marker;
    Ballistics.styleInterceptMarkers(
        state.markers,
        state.currentIndex,
        ORANGE_INTERCEPT,
        RED_INTERCEPT
    );

    if (state.enemy && state.enemy.active) {
        scene.gameHud.showInterceptionPanel(state.enemy, marker);
        scene.missileLaunchInput.begin();
    } else {
        clearMultiIntercept(scene);
        scene.isEnemyDetected = false;
        scene.resumeSpawning();
    }
}

/**
 * Called after the player fires an interceptor during multi-intercept.
 * @returns {boolean} true if sequence continues (do not fully dismiss threat)
 */
export function onMultiInterceptLaunch(scene) {
    if (!isMultiInterceptActive(scene)) return false;

    const state = scene.multiIntercept;
    const launchedIndex = state.currentIndex;
    const nextIndex = launchedIndex + 1;

    scene.missileLaunchInput.hide();
    scene.interceptCalculator?.hide();
    scene.gameHud.dismissInterceptionPanel();

    // Remove the intercept point the player just launched at.
    const launchedMarker = state.markers[launchedIndex];
    if (launchedMarker?.active) {
        launchedMarker.destroy();
    }
    state.markers[launchedIndex] = null;

    if (scene.interceptPoint === launchedMarker) {
        scene.interceptPoint = null;
    }

    if (nextIndex >= state.markers.length) {
        clearMultiIntercept(scene);
        return false;
    }

    // Live motion until the enemy nears the next intercept marker.
    state.currentIndex = nextIndex;
    scene.isEnemyDetected = true;
    scene.pauseSpawning();

    resumeAllMotion(scene);

    state.watchingApproach = true;
    state.lastDistToMarker = null;
    state.resumeStartedAt = scene.time.now;

    if (state.resumeTimer) {
        state.resumeTimer.remove(false);
    }

    // Safety: never let the live window run longer than MAX_RESUME_MS.
    state.resumeTimer = scene.time.delayedCall(MAX_RESUME_MS, () => {
        if (state.watchingApproach) pauseAtNextIntercept(scene);
    });

    return true;
}

/** Freeze as soon as the big enemy reaches / passes the next marker. */
export function updateMultiIntercept(scene) {
    const state = scene.multiIntercept;
    if (!state?.active || !state.watchingApproach) return;

    const enemy = state.enemy;
    const marker = state.markers[state.currentIndex];
    if (!enemy?.active || !marker?.active) {
        pauseAtNextIntercept(scene);
        return;
    }

    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, marker.x, marker.y);

    // Close enough to aim at this point.
    if (dist <= APPROACH_PAUSE_PX) {
        pauseAtNextIntercept(scene);
        return;
    }

    // Started moving away while nearby = already passed the marker; pause immediately.
    if (
        state.lastDistToMarker != null &&
        dist > state.lastDistToMarker + 2 &&
        dist < APPROACH_PAUSE_PX * 3
    ) {
        pauseAtNextIntercept(scene);
        return;
    }

    state.lastDistToMarker = dist;
}

export function setupBigEnemy(enemy) {
    enemy.isBig = true;
    enemy.hitPoints = MULTI_INTERCEPT_COUNT;
    enemy.setScale(1.15);
    enemy.setTint(0xfdba74);
}
