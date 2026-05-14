export function getEnemyCount(wave) {
    if (wave <= 5) {
        return [3, 4, 6, 8, 10][wave - 1];
    }

    return Math.floor(10 + wave * 1.3) + Phaser.Math.Between(-1, 1);
}

export function getSpawnTime(base, variance) {
    return base + Phaser.Math.Between(-variance, variance);
}
