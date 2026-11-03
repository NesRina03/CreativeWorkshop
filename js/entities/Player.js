import { GAME_WIDTH, GAME_HEIGHT } from "../core/constants.js";

export class Player {
    constructor(){
        this.width = 128;
        this.height = 128;

        this.x = (GAME_WIDTH - this.width) / 2;
        this.y = (GAME_HEIGHT - this.height) / 2;

        this.speed = 300;

        // Multipliers (for upgrades)
        this.speedMultiplier = 1;
    }
    update(dt, keys){
        let dx = 0, dy = 0;

        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // Normalize diagonal movement
        if (dx || dy){
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            this.x += dx * this.speed * this.speedMultiplier * dt;
            this.y += dy * this.speed * this.speedMultiplier * dt;
        }
        // Keep player in bounds
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(GAME_HEIGHT - this.height, this.y));

    }
}