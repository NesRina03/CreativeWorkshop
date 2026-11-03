import{ GAME_WIDTH, GAME_HEIGHT} from './Constants.js';
import { RenderSystem } from './systems/RenderSystem.js';

export class Game
{
    constructor()
        {
            this.canvas=document.getElementById('gameCanvas');
            this.ctx=this.canvas.getContext('2d');
            this.renderSystem=new RenderSystem(this.canvas);
            this.init();
        }

    init()
    {
        this.resizeCanvas();
        window.addEventListener('resize',()=>this.resizeCanvas());

        requestAnimationFrame((t)=>this.gameLoop(t));
    }

    resizeCanvas()
    {
        const ratio=16/9;
        let h,w;
        const margin=5;

        const availableWidth= window.innerWidth - margin*2;
        const availableHeight= window.innerHeight - margin*2;

        if(availableWidth/availableHeight>ratio)
        {
            h=availableHeight;
            w=h*ratio;
        }
        else
        {
            w=availableWidth;
            h=w/ratio;
        }

        this.canvas.width=GAME_WIDTH;
        this.canvas.height=GAME_HEIGHT;

        this.canvas.style.width=w+'px';
        this.canvas.style.height=h+'px';
        this.canvas.style.margin='${margin}px';
    }

    gameLoop(timestamp)
    {
        //console.log('timestamp/1000',timestamp/1000);
        this.renderSystem.render();
        requestAnimationFrame((t)=>this.gameLoop(t));
    }
}