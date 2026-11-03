import { FIELD_OF_VIEW, FORMULAS, GAME_HEIGHT, GAME_WIDTH } from '../core/constants.js';

export class RenderSystem {
    constructor(canvas, convolution){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.convolution = convolution;
        this.depthBuffer = new Float32Array(GAME_WIDTH);
        this.focalLength = GAME_WIDTH / (2 * Math.tan(FIELD_OF_VIEW / 2));
        this.formulaSprites = new Map(FORMULAS.map((formula) => [formula.id, this.createFormulaSprite(formula.color)]));
        this.floorTexture = null;
        this.wallTexture = null;
        this.loadTextures();
    }

    render(player, world, scan, lensActive){
        this.renderRoom(player);
        this.renderWalls(player, world);
        const sprites = world.formulas
            .filter((formula) => !formula.collected)
            .map((formula) => ({
                x: formula.x, y: formula.y, height: 0.38, width: 0.38,
                kind: 'formula', entity: formula,
                distance: Math.hypot(formula.x - player.x, formula.y - player.y)
            }));

        if (lensActive){
            for (const ghost of world.ghosts){
                if (!ghost.caught){
                    sprites.push({
                        x: ghost.x, y: ghost.y, height: 0.94, width: 0.72,
                        kind: 'ghost', entity: ghost,
                        distance: Math.hypot(ghost.x - player.x, ghost.y - player.y)
                    });
                }
            }
        }

        sprites.sort((a, b) => b.distance - a.distance);
        for (const sprite of sprites) this.renderBillboard(sprite, player, world, scan);
    }

    loadTextures(){
        const load = (path, onLoad) => {
            const image = new Image();
            image.addEventListener('load', () => onLoad(image), { once: true });
            image.addEventListener('error', () => console.error(`Unable to load texture: ${path}`), { once: true });
            image.src = path;
        };
        load('images/floor.png', (image) => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            context.drawImage(image, 0, 0);
            this.floorTexture = {
                width: canvas.width,
                height: canvas.height,
                data: context.getImageData(0, 0, canvas.width, canvas.height).data
            };
        });
        load('images/wall.png', (image) => { this.wallTexture = image; });
    }

    renderRoom(player){
        const ctx = this.ctx;
        ctx.fillStyle = '#141a2a';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT / 2);
        if (!this.floorTexture){
            ctx.fillStyle = '#302b32';
            ctx.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);
            return;
        }

        const directionX = Math.cos(player.angle);
        const directionY = Math.sin(player.angle);
        const planeX = -directionY * Math.tan(FIELD_OF_VIEW / 2);
        const planeY = directionX * Math.tan(FIELD_OF_VIEW / 2);
        const leftRayX = directionX - planeX;
        const leftRayY = directionY - planeY;
        const rightRayX = directionX + planeX;
        const rightRayY = directionY + planeY;
        const pixels = ctx.createImageData(GAME_WIDTH, GAME_HEIGHT - GAME_HEIGHT / 2);
        const texture = this.floorTexture;

        for (let screenY = GAME_HEIGHT / 2; screenY < GAME_HEIGHT; screenY++){
            const rowDistance = GAME_HEIGHT / (2 * (screenY - GAME_HEIGHT / 2 + 1));
            const stepX = rowDistance * (rightRayX - leftRayX) / GAME_WIDTH;
            const stepY = rowDistance * (rightRayY - leftRayY) / GAME_WIDTH;
            let worldX = player.x + rowDistance * leftRayX;
            let worldY = player.y + rowDistance * leftRayY;
            const outputRow = (screenY - GAME_HEIGHT / 2) * GAME_WIDTH * 4;

            for (let screenX = 0; screenX < GAME_WIDTH; screenX++){
                const textureX = Math.floor((worldX - Math.floor(worldX)) * texture.width);
                const textureY = Math.floor((worldY - Math.floor(worldY)) * texture.height);
                const source = (textureY * texture.width + textureX) * 4;
                const target = outputRow + screenX * 4;
                const shade = Math.max(0.28, 1 - rowDistance / 14);
                for (let channel = 0; channel < 3; channel++){
                    pixels.data[target + channel] = Math.round(texture.data[source + channel] * shade);
                }
                pixels.data[target + 3] = 255;
                worldX += stepX;
                worldY += stepY;
            }
        }
        ctx.putImageData(pixels, 0, GAME_HEIGHT / 2);
    }

    renderWalls(player, world){
        const directionX = Math.cos(player.angle);
        const directionY = Math.sin(player.angle);
        const planeX = -directionY * Math.tan(FIELD_OF_VIEW / 2);
        const planeY = directionX * Math.tan(FIELD_OF_VIEW / 2);

        for (let screenX = 0; screenX < GAME_WIDTH; screenX++){
            const cameraX = 2 * screenX / GAME_WIDTH - 1;
            const rayX = directionX + planeX * cameraX;
            const rayY = directionY + planeY * cameraX;
            let mapX = Math.floor(player.x);
            let mapY = Math.floor(player.y);
            const deltaX = Math.abs(1 / rayX);
            const deltaY = Math.abs(1 / rayY);
            const stepX = rayX < 0 ? -1 : 1;
            const stepY = rayY < 0 ? -1 : 1;
            let sideX = rayX < 0 ? (player.x - mapX) * deltaX : (mapX + 1 - player.x) * deltaX;
            let sideY = rayY < 0 ? (player.y - mapY) * deltaY : (mapY + 1 - player.y) * deltaY;
            let side = 0;
            let hit = false;

            for (let depth = 0; depth < 24 && !hit; depth++){
                if (sideX < sideY){
                    sideX += deltaX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideY += deltaY;
                    mapY += stepY;
                    side = 1;
                }
                hit = world.isWall(mapX + 0.5, mapY + 0.5);
            }

            const distance = Math.max(0.1, side === 0 ? sideX - deltaX : sideY - deltaY);
            this.depthBuffer[screenX] = distance;
            const wallHeight = Math.min(GAME_HEIGHT * 3, Math.floor(GAME_HEIGHT / distance));
            const startY = Math.floor((GAME_HEIGHT - wallHeight) / 2);
            const wallPosition = side === 0 ? player.y + distance * rayY : player.x + distance * rayX;
            const shade = Math.max(0.2, 1 - distance / 9) * (side ? 0.75 : 1);
            if (this.wallTexture){
                let textureX = Math.floor((wallPosition - Math.floor(wallPosition)) * this.wallTexture.naturalWidth);
                if ((side === 0 && rayX > 0) || (side === 1 && rayY < 0)){
                    textureX = this.wallTexture.naturalWidth - textureX - 1;
                }
                this.ctx.drawImage(
                    this.wallTexture,
                    textureX, 0, 1, this.wallTexture.naturalHeight,
                    screenX, startY, 1, wallHeight
                );
                this.ctx.fillStyle = `rgba(0,0,0,${1 - shade})`;
                this.ctx.fillRect(screenX, startY, 1, wallHeight);
            } else {
                this.ctx.fillStyle = `rgb(${[70, 77, 91].map((channel) => Math.floor(channel * shade)).join(',')})`;
                this.ctx.fillRect(screenX, startY, 1, wallHeight);
            }
        }
    }

    renderBillboard(sprite, player, world, scan){
        const directionX = Math.cos(player.angle);
        const directionY = Math.sin(player.angle);
        const planeX = -directionY * Math.tan(FIELD_OF_VIEW / 2);
        const planeY = directionX * Math.tan(FIELD_OF_VIEW / 2);
        const deltaX = sprite.x - player.x;
        const deltaY = sprite.y - player.y;
        const inverseDeterminant = 1 / (planeX * directionY - directionX * planeY);
        const transformX = inverseDeterminant * (directionY * deltaX - directionX * deltaY);
        const transformY = inverseDeterminant * (-planeY * deltaX + planeX * deltaY);
        if (transformY <= 0.1) return;

        const screenCenter = Math.floor(GAME_WIDTH / 2 * (1 + transformX / transformY));
        const height = Math.abs(Math.floor(this.focalLength * sprite.height / transformY));
        const width = Math.abs(Math.floor(this.focalLength * sprite.width / transformY));
        const top = Math.floor(GAME_HEIGHT / 2 - this.focalLength * (sprite.height - 0.5) / transformY);
        const ghost = sprite.kind === 'ghost';
        const ghostImages = ghost ? this.convolution.ghosts.get(sprite.entity.typeId) : null;
        const sourceCanvas = ghost
            ? (sprite.entity.revealed ? ghostImages.revealedCanvas : ghostImages.clueCanvas)
            : this.formulaSprites.get(sprite.entity.id);
        const left = screenCenter - Math.floor(width / 2);
        const activeScan = ghost && scan?.ghostId === sprite.entity.id ? scan : null;

        for (let screenX = Math.max(0, left); screenX < Math.min(GAME_WIDTH, left + width); screenX++){
            if (transformY >= this.depthBuffer[screenX]) continue;
            const sourceX = Math.floor((screenX - left) / width * sourceCanvas.width);
            const revealed = activeScan && sourceX < activeScan.progress * sourceCanvas.width;
            const scanCanvas = revealed ? ghostImages.revealedCanvas : sourceCanvas;
            this.ctx.drawImage(scanCanvas, sourceX, 0, 1, scanCanvas.height, screenX, top, 1, height);
            if (activeScan && Math.abs(sourceX - activeScan.progress * sourceCanvas.width) < 1.5){
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(screenX, top, 1, height);
            }
        }

        if (activeScan){
            const scanX = left + Math.floor(width * activeScan.progress);
            if (scanX >= 0 && scanX < GAME_WIDTH && transformY < this.depthBuffer[scanX]){
                const cellSize = Math.max(3, Math.floor(width * 3 / sourceCanvas.width));
                const gridX = scanX - cellSize / 2;
                const gridY = top + Math.floor(height * 0.45);
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.strokeRect(gridX, gridY, cellSize, cellSize);
                this.ctx.beginPath();
                this.ctx.moveTo(gridX + cellSize / 3, gridY);
                this.ctx.lineTo(gridX + cellSize / 3, gridY + cellSize);
                this.ctx.moveTo(gridX + cellSize * 2 / 3, gridY);
                this.ctx.lineTo(gridX + cellSize * 2 / 3, gridY + cellSize);
                this.ctx.moveTo(gridX, gridY + cellSize / 3);
                this.ctx.lineTo(gridX + cellSize, gridY + cellSize / 3);
                this.ctx.stroke();
            }
        }
    }

    createFormulaSprite(color){
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(5, 5, 22, 22);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(5.5, 5.5, 21, 21);
        ctx.fillStyle = 'rgba(18, 26, 43, 0.8)';
        ctx.fillRect(10, 10, 3, 3);
        ctx.fillRect(19, 10, 3, 3);
        ctx.fillRect(10, 19, 3, 3);
        ctx.fillRect(19, 19, 3, 3);
        return canvas;
    }
}
