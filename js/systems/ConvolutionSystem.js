import { FORMULAS } from '../core/constants.js';
import { GHOSTS } from '../entities/ghosts.js';

const GHOST_COLORS = ['#d7f5ee', '#ffe4a8', '#d2c4ff', '#ffd0b5', '#c4f7bd'];

export class ConvolutionSystem {
    constructor(){
        this.ghosts = new Map();
        GHOSTS.forEach((ghost, index) => {
            const clean = this.createGhostCanvas(index);
            this.setGhostSprites(ghost, index, clean);
            if (ghost.id === 'blur') this.loadGhostSprite(ghost, index);
        });
    }

    setGhostSprites(ghost, index, clean){
        const clue = this.createClue(clean, ghost, index);
        const formula = FORMULAS.find((item) => item.id === ghost.formulaId);
        const revealed = this.applyKernel(
            clue.getContext('2d').getImageData(0, 0, 64, 64),
            formula.kernel,
            formula.bias
        );
        const revealedCanvas = this.createCanvas();
        revealedCanvas.getContext('2d').putImageData(revealed, 0, 0);
        this.ghosts.set(ghost.id, { cleanCanvas: clean, clueCanvas: clue, revealedCanvas });
    }

    loadGhostSprite(ghost, index){
        const image = new Image();
        image.addEventListener('load', () => {
            const clean = this.createCanvas();
            const context = clean.getContext('2d');
            context.imageSmoothingEnabled = false;
            context.drawImage(image, 0, 0, clean.width, clean.height);
            this.setGhostSprites(ghost, index, clean);
        }, { once: true });
        image.addEventListener('error', () => {
            console.error('Unable to load ghost sprite: images/ghost1.png');
        }, { once: true });
        image.src = 'images/ghost1.png';
    }

    createCanvas(){
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        return canvas;
    }

    createGhostCanvas(index){
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = GHOST_COLORS[index];
        ctx.globalAlpha = 0.96;
        ctx.fillRect(15, 8, 34, 39);
        ctx.fillRect(10, 43, 13, 12);
        ctx.fillRect(26, 43, 13, 15);
        ctx.fillRect(43, 43, 12, 12);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#202434';
        ctx.fillRect(22, 23, 5, 6);
        ctx.fillRect(38, 23, 5, 6);
        return canvas;
    }

    createClue(cleanCanvas, ghost, index){
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        const clean = cleanCanvas.getContext('2d').getImageData(0, 0, 64, 64);
        let clueData;

        if (ghost.id === 'blur'){
            clueData = clean;
            for (let pass = 0; pass < 3; pass++){
                clueData = this.applyKernel(clueData, Array(9).fill(1 / 9), 0);
            }
        } else if (ghost.id === 'static'){
            clueData = new ImageData(new Uint8ClampedArray(clean.data), 64, 64);
            let seed = 43;
            for (let y = 0; y < 64; y++){
                for (let x = 0; x < 64; x++){
                    seed = (seed * 1664525 + 1013904223) >>> 0;
                    if (seed % 7 === 0){
                        const pixel = (y * 64 + x) * 4;
                        const noise = seed % 2 ? 255 : 12;
                        clueData.data[pixel] = noise;
                        clueData.data[pixel + 1] = noise;
                        clueData.data[pixel + 2] = noise;
                    }
                }
            }
        } else if (ghost.id === 'veil'){
            clueData = new ImageData(new Uint8ClampedArray(clean.data), 64, 64);
            for (let pixel = 3; pixel < clueData.data.length; pixel += 4) clueData.data[pixel] = Math.floor(clueData.data[pixel] * 0.24);
        } else if (ghost.id === 'relief'){
            clueData = new ImageData(new Uint8ClampedArray(clean.data), 64, 64);
            for (let pixel = 0; pixel < clueData.data.length; pixel += 4){
                const gray = Math.round((clueData.data[pixel] + clueData.data[pixel + 1] + clueData.data[pixel + 2]) / 3);
                clueData.data[pixel] = gray;
                clueData.data[pixel + 1] = gray;
                clueData.data[pixel + 2] = gray;
            }
        } else {
            clueData = new ImageData(64, 64);
            for (let y = 0; y < 64; y++){
                for (let x = 0; x < 64; x++){
                    const sourceIndex = (y * 64 + x) * 4;
                    if (x % 8 < 3){
                        clueData.data[sourceIndex] = clean.data[sourceIndex];
                        clueData.data[sourceIndex + 1] = clean.data[sourceIndex + 1];
                        clueData.data[sourceIndex + 2] = clean.data[sourceIndex + 2];
                        clueData.data[sourceIndex + 3] = clean.data[sourceIndex + 3];
                    }
                }
            }
        }

        ctx.putImageData(clueData, 0, 0);
        ctx.strokeStyle = GHOST_COLORS[index];
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 62, 62);
        return canvas;
    }

    applyKernel(source, kernel, bias){
        const { width, height, data } = source;
        const output = new ImageData(width, height);
        for (let y = 0; y < height; y++){
            for (let x = 0; x < width; x++){
                const outputIndex = (y * width + x) * 4;
                for (let channel = 0; channel < 3; channel++){
                    let value = bias;
                    for (let kernelY = 0; kernelY < 3; kernelY++){
                        for (let kernelX = 0; kernelX < 3; kernelX++){
                            const sampleX = Math.max(0, Math.min(width - 1, x + kernelX - 1));
                            const sampleY = Math.max(0, Math.min(height - 1, y + kernelY - 1));
                            const sampleIndex = (sampleY * width + sampleX) * 4 + channel;
                            value += data[sampleIndex] * kernel[kernelY * 3 + kernelX];
                        }
                    }
                    output.data[outputIndex + channel] = Math.max(0, Math.min(255, Math.round(value)));
                }
                output.data[outputIndex + 3] = data[outputIndex + 3];
            }
        }
        return output;
    }
}
