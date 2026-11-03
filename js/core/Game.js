import { GAME_WIDTH, GAME_HEIGHT} from "./constants.js";
import { RenderSystem } from "../systems/RenderSystem.js";
import { Player } from "../entities/Player.js";
import { ImageManager } from "../managers/ImageManager.js";
import { AudioManager } from "../managers/AudioManager.js";
import { Localization } from "../managers/Localization.js";

export class Game {
    constructor(){
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.imageManager = new ImageManager();
        this.imageManager.loadAll();

        this.renderSystem = new RenderSystem(this.canvas, this.imageManager);
        this.player = new Player();
        this.audioManager = new AudioManager();
        this.localization = new Localization(this.audioManager);
        this.keys = {};
        this.lastTime;
        this.movementSoundTimer = 0;
 
        this.init();
    }
    init(){
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupInput();
        this.setupInterface();

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
        const previousX = this.player.x;
        const previousY = this.player.y;
        this.player.update(dt, this.keys);
        this.movementSoundTimer = Math.max(0, this.movementSoundTimer - dt);

        if ((this.player.x !== previousX || this.player.y !== previousY) && this.movementSoundTimer === 0){
            this.audioManager.playMovementSound();
            this.movementSoundTimer = 0.32;
        }
    }
    setupInput(){
        window.addEventListener('keydown', (e) => {
            const key = e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)){
                e.preventDefault();
                this.keys[key] = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            const key = e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.key.toLowerCase();
            this.keys[key] = false;
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
    setupInterface(){
        const languageButton = document.getElementById('languageButton');
        const soundButton = document.getElementById('soundButton');
        const musicButton = document.getElementById('musicButton');
        const audioStatus = document.getElementById('audioStatus');

        this.localization.setLanguage(this.localization.language);
        languageButton.addEventListener('click', () => {
            const language = this.localization.language === 'en' ? 'ar' : 'en';
            this.localization.setLanguage(language);
        });

        soundButton.addEventListener('click', async () => {
            soundButton.disabled = true;
            audioStatus.textContent = '';
            try {
                await this.audioManager.toggleSound();
                this.localization.updateControls();
            } catch (error){
                audioStatus.textContent = this.localization.text.audioError;
                console.error('Unable to enable sound effects:', error);
            } finally {
                soundButton.disabled = false;
            }
        });

        musicButton.addEventListener('click', async () => {
            musicButton.disabled = true;
            audioStatus.textContent = '';
            try {
                await this.audioManager.toggleMusic();
                this.localization.updateControls();
            } catch (error){
                audioStatus.textContent = this.localization.text.audioError;
                console.error('Unable to toggle music:', error);
            } finally {
                musicButton.disabled = false;
            }
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