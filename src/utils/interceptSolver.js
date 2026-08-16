/** Gravity in m/s² (matches game physics with up-positive meter coords). */
export const G_MS2 = 9.81;

const EPS = 1e-6;

function fmt(n, digits = 2) {
    if (!Number.isFinite(n)) return '?';
    const f = 10 ** digits;
    return (Math.round(n * f) / f).toFixed(digits);
}

/**
 * Solve player launch angle + speed to hit an intercept point.
 * All values use the HUD meter frame: turret at (0,0), +y up, +x right.
 *
 * @param {{ x: number, y: number }} missilePos enemy position at freeze
 * @param {{ x: number, y: number }} interceptPos desired meeting point
 * @param {{ x: number, y: number }} missileVel enemy velocity (vy up-positive)
 * @returns {{ ok: true, time: number, angleDeg: number, speedMs: number, steps: string[] }
 *         | { ok: false, message: string }}
 */
export function solveInterceptLaunch(missilePos, interceptPos, missileVel) {
    const mx = missilePos.x;
    const my = missilePos.y;
    const ix = interceptPos.x;
    const iy = interceptPos.y;
    const vx = missileVel.x;
    const vy = missileVel.y;

    if (![mx, my, ix, iy, vx, vy].every(Number.isFinite)) {
        return { ok: false, message: 'Enter all values' };
    }

    const steps = [];

    const time = resolveFlightTime(mx, my, ix, iy, vx, vy, steps);
    if (!time.ok) return time;

    const T = time.T;
    if (T <= EPS) {
        return { ok: false, message: 'Time must be > 0' };
    }

    // Interceptor from turret (0,0) under same gravity.
    const vxp = ix / T;
    const vyp = iy / T + 0.5 * G_MS2 * T;
    const speedMs = Math.sqrt(vxp * vxp + vyp * vyp);
    const angleRad = Math.atan2(vyp, vxp);
    const angleDeg = angleRad < 0 ? (angleRad + 2 * Math.PI) * (180 / Math.PI) : angleRad * (180 / Math.PI);

    if (!Number.isFinite(speedMs) || !Number.isFinite(angleDeg)) {
        return { ok: false, message: 'Could not solve' };
    }

    steps.push(
        `2) Find vx, vy of your launch:`,
        `   vx = ix / T = ${fmt(vxp)}`,
        `   vy = iy / T + ½gT = ${fmt(vyp)}`
    );

    steps.push(
        `3) Find velocity and angle:`,
        `   v = √(vx² + vy²) = ${fmt(speedMs)}`,
        `   θ = atan2(vy, vx) = ${fmt(angleDeg)}°`
    );

    return {
        ok: true,
        time: T,
        angleDeg,
        speedMs,
        steps
    };
}

function resolveFlightTime(mx, my, ix, iy, vx, vy, steps = []) {
    const dx = ix - mx;
    const dy = iy - my;

    // Prefer horizontal motion when enemy has meaningful vx.
    if (Math.abs(vx) > EPS) {
        const T = Math.abs(dx / vx);
        if (T <= EPS) {
            return { ok: false, message: 'Intercept time invalid (too small)' };
        }

        steps.push(
            `1) Find time until intercept:`,
            `   T = |Δx / vx| = ${fmt(T)} s`
        );

        return { ok: true, T };
    }

    // Nearly vertical enemy path: solve iy = my + vy*T - 0.5*g*T^2
    // => 0.5*g*T^2 - vy*T + (iy - my) = 0
    const a = 0.5 * G_MS2;
    const b = -vy;
    const c = dy;
    const disc = b * b - 4 * a * c;

    if (disc < 0) {
        return { ok: false, message: 'No real time for this path' };
    }

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    const candidates = [t1, t2].filter((t) => t > EPS);

    if (candidates.length === 0) {
        return { ok: false, message: 'No positive flight time' };
    }

    const T = Math.min(...candidates);

    steps.push(
        `1) Find time until intercept:`,
        `   T = ${fmt(T)} s`
    );

    return { ok: true, T };
}

/**
 * Snap a continuous speed to the nearest discrete launch option.
 */
export function nearestVelocityOption(speedMs, options = [20, 30, 40, 50]) {
    let best = options[0];
    let bestDist = Math.abs(speedMs - best);
    for (let i = 1; i < options.length; i++) {
        const dist = Math.abs(speedMs - options[i]);
        if (dist < bestDist) {
            best = options[i];
            bestDist = dist;
        }
    }
    return { speedMs: best, delta: bestDist };
}
