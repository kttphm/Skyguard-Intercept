import * as GameMath from '../utils/gameMath.js';

export class DomeThreatPanel {
    constructor(scene) {
        this.scene = scene;
        const margin = 16;
        const panelW = 300;
        const panelH = 168;
        const pad = 14;
        const lineH = 22;

        const yTop = margin;

        this.container = scene.add.container(scene.scale.width - margin - panelW, yTop);
        this.container.setScrollFactor(0);
        this.container.setDepth(2000);
        this.container.setVisible(false);

        const bg = scene.add.graphics();
        bg.fillStyle(0x0c1224, 0.92);
        bg.lineStyle(2, 0xf59e0b, 0.85);
        bg.fillRoundedRect(0, 0, panelW, panelH, 8);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 8);

        const titleStyle = {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#fde68a',
            fontStyle: 'bold'
        };
        const bodyStyle = {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '14px',
            color: '#e2e8f0'
        };

        const title = scene.add.text(pad, pad, 'MISSILE DETECTED', titleStyle);
        const sepY = pad + lineH + 4;
        const sep = scene.add.graphics();
        sep.lineStyle(1, 0x334155, 1);
        sep.lineBetween(pad, sepY, panelW - pad, sepY);

        let y = sepY + 10;
        this.lines = {
            id: scene.add.text(pad, y, '', bodyStyle),
            pos: scene.add.text(pad, y + lineH, '', bodyStyle),
            vel: scene.add.text(pad, y + lineH * 2, '', bodyStyle),
            speed: scene.add.text(pad, y + lineH * 3, '', bodyStyle),
            dir: scene.add.text(pad, y + lineH * 4, '', bodyStyle)
        };

        this.container.add([
            bg,
            title,
            sep,
            this.lines.id,
            this.lines.pos,
            this.lines.vel,
            this.lines.speed,
            this.lines.dir
        ]);
    }

    show(enemy) {
        const scene = this.scene;
        if (!this.container || !enemy || !enemy.body) return;

        const ppm = scene.PPM;
        const w = scene.scale.width;
        const h = scene.scale.height;

        const vx = enemy._savedVelocityX / ppm;
        const vy = enemy._savedVelocityY / ppm;
        const px = GameMath.toShiftedX(Math.round(enemy.x), w, scene.shiftOriginX) / ppm;
        const py = GameMath.toShiftedY(Math.round(enemy.y), h, scene.shiftOriginY) / ppm;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const idNum = enemy.enemyId != null ? enemy.enemyId : 0;
        const idStr = String(idNum).padStart(2, '0');
        const arrow = GameMath.velocityToDirArrow(vx, vy);

        this.lines.id.setText(`ID: #${idStr}`);
        this.lines.pos.setText(`Pos: (${px}, ${py})`);
        this.lines.vel.setText(`Vel: (${Math.round(vx)}, ${Math.round(vy)})`);
        this.lines.speed.setText(`Speed: ${Math.round(speed)} m/s`);
        this.lines.dir.setText(`Dir: ${arrow}`);

        this.container.setVisible(true);
    }

    hide() {
        if (this.container) {
            this.container.setVisible(false);
        }
    }
}
