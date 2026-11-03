import { FORMULAS } from './constants.js';
import { createGhost, GHOSTS } from '../entities/ghosts.js';

const MAP = [
    '############',
    '#..........#',
    '#..#.......#',
    '#..#.......#',
    '#..........#',
    '#.....#....#',
    '#.....#....#',
    '#..........#',
    '#..........#',
    '############'
];

const START = { x: 1.5, y: 1.5 };

export class World {
    constructor(random = Math.random){
        this.map = MAP;
        this.formulas = [];
        this.ghosts = [];

        const available = [];
        for (let y = 1; y < MAP.length - 1; y++){
            for (let x = 1; x < MAP[y].length - 1; x++){
                if (MAP[y][x] === '.' && Math.hypot(x + 0.5 - START.x, y + 0.5 - START.y) > 1.8){
                    available.push({ x: x + 0.5, y: y + 0.5 });
                }
            }
        }

        const positions = [];
        while (available.length){
            const index = Math.floor(random() * available.length);
            positions.push(...available.splice(index, 1));
        }

        let nextPosition = 0;
        for (const formula of FORMULAS){
            this.formulas.push({
                ...formula,
                x: positions[nextPosition].x,
                y: positions[nextPosition].y,
                collected: false
            });
            nextPosition++;
        }

        for (const type of GHOSTS){
            const count = 1 + Math.floor(random() * 3);
            for (let index = 0; index < count; index++){
                const position = positions[nextPosition++];
                this.ghosts.push(createGhost(type, index, position));
            }
        }
    }

    isWall(x, y){
        const row = this.map[Math.floor(y)];
        return !row || row[Math.floor(x)] !== '.';
    }

    canOccupy(x, y, radius){
        return !this.isWall(x - radius, y - radius)
            && !this.isWall(x + radius, y - radius)
            && !this.isWall(x - radius, y + radius)
            && !this.isWall(x + radius, y + radius);
    }

    hasLineOfSight(fromX, fromY, toX, toY){
        const distance = Math.hypot(toX - fromX, toY - fromY);
        const steps = Math.ceil(distance / 0.04);
        for (let step = 1; step < steps; step++){
            const progress = step / steps;
            if (this.isWall(fromX + (toX - fromX) * progress, fromY + (toY - fromY) * progress)){
                return false;
            }
        }
        return true;
    }
}

export { START as PLAYER_START };
