function freezeBody(targetSprite) {
    if (!targetSprite || !targetSprite.body || targetSprite.body.moves === false) return;

    targetSprite._savedVelocityX = targetSprite.body.velocity.x;
    targetSprite._savedVelocityY = targetSprite.body.velocity.y;
    targetSprite._savedAngularVelocity = targetSprite.body.angularVelocity;
    targetSprite._savedAccelerationX = targetSprite.body.acceleration.x;
    targetSprite._savedAccelerationY = targetSprite.body.acceleration.y;
    targetSprite._savedAngularAcceleration = targetSprite.body.angularAcceleration;
    targetSprite.body.setVelocity(0, 0);
    targetSprite.body.setAngularVelocity(0);
    targetSprite.body.setAcceleration(0, 0);
    targetSprite.body.setAngularAcceleration(0);
    targetSprite.body.moves = false;
}

export function freezeEnemiesAndMissiles(scene) {
    scene.enemies.children.iterate(freezeBody);
    scene.missiles.children.iterate(freezeBody);
}

function resumeBody(targetSprite) {
    if (!targetSprite || !targetSprite.body || targetSprite.body.moves === true) return;

    targetSprite.body.moves = true;
    targetSprite.body.setVelocity(targetSprite._savedVelocityX ?? 0, targetSprite._savedVelocityY ?? 0);
    targetSprite.body.setAngularVelocity(targetSprite._savedAngularVelocity ?? 0);
    targetSprite.body.setAcceleration(targetSprite._savedAccelerationX ?? 0, targetSprite._savedAccelerationY ?? 0);
    targetSprite.body.setAngularAcceleration(targetSprite._savedAngularAcceleration ?? 0);
    delete targetSprite._savedVelocityX;
    delete targetSprite._savedVelocityY;
    delete targetSprite._savedAngularVelocity;
    delete targetSprite._savedAccelerationX;
    delete targetSprite._savedAccelerationY;
    delete targetSprite._savedAngularAcceleration;
}

// Resumes motion, wave spawning, and clears trajectory trails after a dome threat.

export function dismissDomeThreatState(scene) {
    if (scene.isEnemyDetected) {
        scene.isEnemyDetected = false;
        scene.enemies.children.iterate(resumeBody);
        scene.missiles.children.iterate(resumeBody);
        scene.resumeSpawning();

        if (scene.trails) {
            scene.trails.clear(true, true);
        }
    }
}
