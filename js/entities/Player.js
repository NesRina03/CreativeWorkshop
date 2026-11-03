const PLAYER_RADIUS = 0.18;

export class Player {
    constructor(start = { x: 1.5, y: 1.5 }){
        this.x = start.x;
        this.y = start.y;
        this.angle = 0;
        this.speed = 2.4;
        this.turnSpeed = 2.2;
    }

    update(dt, keys, world){
        if (keys.arrowleft) this.angle -= this.turnSpeed * dt;
        if (keys.arrowright) this.angle += this.turnSpeed * dt;

        const forward = Number(Boolean(keys.w || keys.arrowup)) - Number(Boolean(keys.s || keys.arrowdown));
        const strafe = Number(Boolean(keys.d)) - Number(Boolean(keys.a));
        const magnitude = Math.hypot(forward, strafe);
        if (!magnitude) return false;

        const forwardX = Math.cos(this.angle);
        const forwardY = Math.sin(this.angle);
        const rightX = -forwardY;
        const rightY = forwardX;
        const dx = (forwardX * forward + rightX * strafe) / magnitude * this.speed * dt;
        const dy = (forwardY * forward + rightY * strafe) / magnitude * this.speed * dt;
        let moved = false;

        if (dx !== 0 && world.canOccupy(this.x + dx, this.y, PLAYER_RADIUS)){
            this.x += dx;
            moved = true;
        }
        if (dy !== 0 && world.canOccupy(this.x, this.y + dy, PLAYER_RADIUS)){
            this.y += dy;
            moved = true;
        }
        return moved;
    }
}
