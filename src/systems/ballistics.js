/** Inner dome / shortest allowed intercept range (pixels from turret). */
export const MIN_INTERCEPT_RADIUS_PX = 380;

/** Prefer intercepts no farther than this from the turret (pixels). */
export const MAX_INTERCEPT_RADIUS_PX = 500;

export function renderMissileTrajectory(scene, enemy, dt) {
    if (!enemy || !enemy.body || !scene.ground) return;

    scene.trails.clear(true, true);

    const x0 = enemy.x;
    const y0 = enemy.y;
    const vx = enemy._savedVelocityX;
    const vy0 = enemy._savedVelocityY;
    const g = scene.physics.world.gravity.y;
    const house = enemy.targetHouse;
    const houseTop = house && house.active ? house.getBounds().top - 0.0 : scene.ground.getBounds().top;
    const missileLength = scene.textures.get('missile').getSourceImage().width;
    const maxT = 30;

    for (let t = dt; t < maxT; t += dt) {
        const sx = x0 + vx * t;
        const sy = y0 + vy0 * t + 0.5 * g * t * t;

        if (t > 0 && sy >= houseTop - missileLength / 2) break;

        const vyAtT = vy0 + g * t;
        const trail = scene.add.image(sx, sy, 'enemy').setScale(0.7);
        trail.alpha = 0.4;
        trail.setDepth(500);
        trail.setRotation(Math.atan2(vyAtT, vx));
        scene.trails.add(trail);

        if (sx < -200 || sx > scene.scale.width + 200) break;
    }
}

function distanceFromTurret(scene, x, y) {
    const tx = scene.turret?.x ?? scene.scale.width / 2;
    const ty = scene.turret?.y ?? scene.scale.height;
    const dx = x - tx;
    const dy = y - ty;
    return Math.hypot(dx, dy);
}

function getInterceptRadiusBand(scene) {
    const minR = scene.minInterceptRadiusPx ?? MIN_INTERCEPT_RADIUS_PX;
    const maxR = scene.maxInterceptRadiusPx ?? MAX_INTERCEPT_RADIUS_PX;
    return { minR, maxR };
}

/** Candidates in turret distance band, in trajectory time order. */
export function collectInterceptCandidates(scene, trails) {
    if (!trails) return [];

    const { minR, maxR } = getInterceptRadiusBand(scene);
    const inBand = [];
    const outsideMin = [];

    trails.children.iterate((trail) => {
        if (!trail || !trail.active) return;
        const dist = distanceFromTurret(scene, trail.x, trail.y);
        if (dist < minR) return;
        outsideMin.push(trail);
        if (dist <= maxR) inBand.push(trail);
    });

    return inBand.length > 0 ? inBand : outsideMin;
}

/**
 * Spread `count` trails evenly along a time-ordered candidate list.
 */
export function pickSpacedInterceptTrails(candidates, count) {
    if (!candidates || candidates.length === 0 || count <= 0) return [];

    if (candidates.length === 1) {
        return Array.from({ length: count }, () => candidates[0]);
    }

    const picked = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        let idx = Math.round(t * (candidates.length - 1));

        // Nudge away from duplicates when possible.
        if (used.has(idx)) {
            let found = -1;
            for (let d = 1; d < candidates.length; d++) {
                if (!used.has(idx + d) && idx + d < candidates.length) {
                    found = idx + d;
                    break;
                }
                if (!used.has(idx - d) && idx - d >= 0) {
                    found = idx - d;
                    break;
                }
            }
            if (found >= 0) idx = found;
        }

        used.add(idx);
        picked.push(candidates[idx]);
    }

    return picked;
}

export function createInterceptMarker(scene, trail) {
    const marker = scene.add.image(trail.x, trail.y, 'enemy').setScale(0.85);
    marker.setDepth(520);
    marker.setRotation(trail.rotation);
    marker.alpha = 1;
    return marker;
}

export function styleInterceptMarkers(markers, currentIndex, orangeTint, redTint) {
    if (!markers) return;

    markers.forEach((marker, index) => {
        if (!marker || !marker.active) return;
        marker.alpha = 1;
        marker.setTint(index === currentIndex ? redTint : orangeTint);
        marker.setScale(index === currentIndex ? 1.0 : 0.85);
    });
}

/**
 * Pick a single intercept marker from the enemy trail (normal enemies).
 */
export function pickInterceptPoint(scene, enemy, trails) {
    if (!enemy || !enemy.body || !trails) return null;

    const candidates = collectInterceptCandidates(scene, trails);
    if (candidates.length === 0) return null;

    const { minR, maxR } = getInterceptRadiusBand(scene);
    const idealR = (minR + maxR) * 0.5;

    const scored = candidates.map((trail) => ({
        trail,
        score: Math.abs(distanceFromTurret(scene, trail.x, trail.y) - idealR)
    }));

    scored.sort((a, b) => a.score - b.score);
    const poolSize = Math.max(1, Math.ceil(scored.length / 3));
    const pool = scored.slice(0, poolSize);
    return Phaser.Utils.Array.GetRandom(pool).trail;
}

export function setInterceptMarkerStyle(interceptPoint, show) {
    if (!interceptPoint) return;

    if (show) {
        interceptPoint.alpha = 1;
        interceptPoint.setTint(0xff0000);
    } else {
        interceptPoint.alpha = 0.4;
        interceptPoint.clearTint();
    }
}
