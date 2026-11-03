import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../Constants.js';
export class RenderSystem
{
    constructor(canvas)
    {
        this.canvas=canvas;
        this.ctx=this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled=false;
    }

    render()
    {
        this.ctx.fillStyle='pink';
        this.ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
        this.renderGrid();
    }

    renderGrid()
    {
        this.ctx.strokeStyle='rgba(0,0,0,0.2)';
        this.ctx.lineWidth=1;


        for(let i=0; i<=GAME_WIDTH; i+=TILE_SIZE)
        {
            this.ctx.beginPath();
            this.ctx.moveTo(i,0);
            this.ctx.lineTo(i,GAME_HEIGHT);
            this.ctx.stroke();
        }

        for(let i=0; i<=GAME_HEIGHT; i+=TILE_SIZE)
        {
            this.ctx.beginPath();
            this.ctx.moveTo(0,i);
            this.ctx.lineTo(GAME_WIDTH,i);
            this.ctx.stroke();
        }
    }
}