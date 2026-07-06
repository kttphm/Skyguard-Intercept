import * as GameMath from '../utils/gameMath.js';

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

export function pickInterceptPoint(scene, enemy, trails) {
    if (!enemy || !enemy.body) return null;

    const possibleInterceptPoint = scene.add.group();
    const h = scene.scale.height;
    const shiftY = scene.shiftOriginY;

    trails.children.iterate((trail) => {
        const ty = GameMath.toShiftedY(trail.y, h, shiftY);
        const ey = GameMath.toShiftedY(enemy.y, h, shiftY);
        if (200 <= ty && ty <= 0.75 * ey) {
            possibleInterceptPoint.add(trail);
        }
    });

    const interceptPoint = Phaser.Utils.Array.GetRandom(possibleInterceptPoint.getChildren());

    if (!interceptPoint) return null;

    return interceptPoint;
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
