export function alignSpriteRotationToVelocity(sprite) {
    if (!sprite || !sprite.body) return;

    const vx = sprite.body.velocity.x;
    const vy = sprite.body.velocity.y;
    if (vx === 0 && vy === 0) return;

    sprite.rotation = Math.atan2(vy, vx);
}

export function toShiftedX(x, width, shiftOriginX) {
    const originX = shiftOriginX ?? (width / 2);
    return x - originX;
}

export function toShiftedY(y, height, shiftOriginY) {
    const originY = shiftOriginY ?? height;
    return originY - y;
}

export function isInsideDomeArc(enemiesGroup, obj1, obj2) {
    const enemy = enemiesGroup.contains(obj1) ? obj1 : obj2;
    const dome = enemy === obj1 ? obj2 : obj1;
    if (!enemy || !dome) return false;

    const DOME_TEX_LINE_THICKNESS = 0.5;
    const centerX = dome.x;
    const centerY = dome.y + dome.displayHeight / 2;
    const radius = dome.displayWidth / 2 - DOME_TEX_LINE_THICKNESS * dome.scaleX;
    const enemyRadius = Math.max(enemy.displayWidth, enemy.displayHeight) * 0.25;
    const dx = enemy.x - centerX;
    const dy = enemy.y - centerY;
    const collisionRadius = radius + enemyRadius;
    const distSq = dx * dx + dy * dy;

    return enemy.y <= centerY && distSq <= (collisionRadius * collisionRadius);
}
