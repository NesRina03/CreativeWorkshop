import { GAME_WIDTH, GAME_HEIGHT} from "./constants.js";
import { RenderSystem } from "../systems/RenderSystem.js";
import { Player } from "../entities/Player.js";
import { ImageManager } from "../managers/ImageManager.js";

export class Game {
    constructor(){
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.imageManager = new ImageManager();
        this.imageManager.loadAll();

        this.renderSystem = new RenderSystem(this.canvas, this.imageManager);
        this.player = new Player();
        this.keys = {};
        this.lastTime;
 
        this.init();
    }
    init(){
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupInput();

        // start game loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    gameLoop(timestamp){
        const dt = Math.min((timestamp - this.lastTime)/1000, 0.1);
        //console.log(dt);
        this.lastTime = timestamp;
        this.update(dt);
        this.renderSystem.render(this.player);
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    update(dt){
        this.player.update(dt, this.keys);
    }
    setupInput(){
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        // Clear all keys when context menu opens
        window.addEventListener('contextmenu', () => {
            this.keys = {};
        });
        // Clear all keys when window loses focus
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }
    resizeCanvas(){
        const ratio = 16/9;
        let w, h;
        const margin = 15;

        const availableWidth = window.innerWidth - margin * 2;
        const availableHeight = window.innerHeight - margin * 2;

        if (availableWidth/availableHeight > ratio){
            h = availableHeight;
            w = h * ratio;
        } else {
            w = availableWidth;
            h = w / ratio;
        }

        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;

        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.canvas.style.margin = `${margin}px`;
    }
}