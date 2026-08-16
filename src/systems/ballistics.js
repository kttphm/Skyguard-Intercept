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

        if (t > 0 && sy >= houseTop - missileLength/2) break;

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

/**
 * Pick an intercept marker from the enemy trail.
 * Candidates must lie outside the min-intercept dome and within a mid-range
 * band from the turret (not too close, not too far).
 */
export function pickInterceptPoint(scene, enemy, trails) {
    if (!enemy || !enemy.body || !trails) return null;

    const { minR, maxR } = getInterceptRadiusBand(scene);
    const idealR = (minR + maxR) * 0.5;
    const candidates = [];

    trails.children.iterate((trail) => {
        if (!trail || !trail.active) return;

        const dist = distanceFromTurret(scene, trail.x, trail.y);
        // Nothing inside the shortest-intercept dome, and nothing too far out.
        if (dist < minR || dist > maxR) return;

        candidates.push({
            trail,
            dist,
            score: Math.abs(dist - idealR)
        });
    });

    if (candidates.length === 0) {
        // Soft fallback: outside min dome, closest to the mid-band (still prefer nearer max).
        const fallback = [];
        trails.children.iterate((trail) => {
            if (!trail || !trail.active) return;
            const dist = distanceFromTurret(scene, trail.x, trail.y);
            if (dist < minR) return;
            fallback.push({ trail, dist, score: Math.abs(dist - idealR) });
        });
        if (fallback.length === 0) return null;
        fallback.sort((a, b) => a.score - b.score);
        return fallback[0].trail;
    }

    // Prefer points near the middle of the allowed band; random among the best third.
    candidates.sort((a, b) => a.score - b.score);
    const poolSize = Math.max(1, Math.ceil(candidates.length / 3));
    const pool = candidates.slice(0, poolSize);
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
