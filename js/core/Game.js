import { FORMULAS, GAME_HEIGHT, GAME_WIDTH, ROUND_TIME } from './constants.js';
import { PLAYER_START, World } from './World.js';
import { GHOSTS } from '../entities/ghosts.js';
import { Player } from '../entities/Player.js';
import { AudioManager } from '../managers/AudioManager.js';
import { Localization } from '../managers/Localization.js';
import { ConvolutionSystem } from '../systems/ConvolutionSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';

const PICKUP_RANGE = 1.15;
const GHOST_RANGE = 4.8;
const SCAN_DURATION = 2.2;
const MENU_SCREENS = new Set([
    'menu', 'options', 'language', 'intro', 'pause', 'pause-options',
    'pause-language', 'help', 'result', 'exit'
]);

export class Game {
    constructor(){
        this.canvas = document.getElementById('gameCanvas');
        this.audioManager = new AudioManager();
        this.localization = new Localization();
        this.convolution = new ConvolutionSystem();
        this.renderSystem = new RenderSystem(this.canvas, this.convolution);
        this.keys = {};
        this.state = 'menu';
        this.previousScreen = 'menu';
        this.returnAfterPanel = 'play';
        this.remainingTime = ROUND_TIME;
        this.world = new World();
        this.player = new Player(PLAYER_START);
        this.lensActive = false;
        this.collectedFormulaIds = new Set();
        this.selectedFormulaId = null;
        this.selectedDetailFormulaId = null;
        this.scan = null;
        this.pickupFormula = null;
        this.message = '';
        this.messageTimer = 0;
        this.movementSoundTimer = 0;
        this.pointerLook = null;
        this.lastTime = performance.now();

        this.setupInput();
        this.setupInterface();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.localization.setLanguage(this.localization.language);
        this.refreshText();
        this.showScreen('menu');
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameLoop(timestamp){
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        if (this.state === 'play') this.update(dt);
        this.renderSystem.render(this.player, this.world, this.scan, this.lensActive);
        this.renderHud();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(dt){
        this.remainingTime = Math.max(0, this.remainingTime - dt);
        if (this.remainingTime === 0){
            this.finishRound('lost', 'loseTitle', 'loseText');
            return;
        }

        const moved = this.player.update(dt, this.keys, this.world);
        this.movementSoundTimer = Math.max(0, this.movementSoundTimer - dt);
        if (moved && this.movementSoundTimer === 0){
            this.audioManager.playMovementSound();
            this.movementSoundTimer = 0.32;
        }

        if (this.scan){
            this.scan.progress = Math.min(1, this.scan.progress + dt / SCAN_DURATION);
            if (this.scan.progress === 1){
                this.scan.ghost.revealed = true;
                this.scan = null;
                this.showMessage(this.localization.text.aimPrompt);
            }
        }
        this.messageTimer = Math.max(0, this.messageTimer - dt);
        if (this.messageTimer === 0) this.message = '';
    }

    setupInput(){
        window.addEventListener('keydown', (event) => {
            const key = this.eventKey(event);
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)){
                event.preventDefault();
            }
            if (event.repeat) return;
            if (key === 'enter' && this.state === 'intro'){
                this.startRoundPlay();
                return;
            }
            if (key === 'enter' && this.state === 'help'){
                this.closeHelp();
                return;
            }
            if (key === 'escape'){
                this.handleEscape();
                return;
            }
            if (this.state !== 'play') return;

            if (key === 'f') this.interact();
            else if (key === 'b') this.openBackpack();
            else if (key === 'h') this.openHelp();
            else if (key === 'l') this.toggleLens();
            else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)){
                this.keys[key] = true;
            }
        });

        window.addEventListener('keyup', (event) => {
            this.keys[this.eventKey(event)] = false;
        });
        window.addEventListener('blur', () => {
            this.keys = {};
            this.pointerLook = null;
        });
        this.canvas.addEventListener('pointerdown', (event) => {
            if (event.button !== 0 || this.state !== 'play') return;
            this.pointerLook = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                moved: 0
            };
        });
        window.addEventListener('pointermove', (event) => {
            if (!this.pointerLook || event.pointerId !== this.pointerLook.id || this.state !== 'play') return;
            const deltaX = event.clientX - this.pointerLook.x;
            const deltaY = event.clientY - this.pointerLook.y;
            this.pointerLook.x = event.clientX;
            this.pointerLook.y = event.clientY;
            this.pointerLook.moved += Math.hypot(deltaX, deltaY);
            this.player.angle += deltaX * 0.006;
        });
        window.addEventListener('pointerup', (event) => {
            if (!this.pointerLook || event.pointerId !== this.pointerLook.id) return;
            if (this.pointerLook.moved < 6 && this.state === 'play') this.catchGhost();
            this.pointerLook = null;
        });
        window.addEventListener('pointercancel', () => {
            this.pointerLook = null;
        });
    }

    eventKey(event){
        if (event.code.startsWith('Key')) return event.code.slice(3).toLowerCase();
        return event.key.toLowerCase();
    }

    setupInterface(){
        this.onClick('playButton', () => this.beginGame());
        this.onClick('openOptionsButton', () => this.showScreen('options'));
        this.onClick('openLanguageButton', () => {
            this.previousScreen = 'menu';
            this.showScreen('language');
        });
        this.onClick('exitButton', () => this.showScreen('exit'));
        this.onClick('optionsBackButton', () => this.showScreen('menu'));
        this.onClick('languageBackButton', () => this.showScreen(this.previousScreen));
        this.onClick('englishButton', () => this.changeLanguage('en'));
        this.onClick('arabicButton', () => this.changeLanguage('ar-DZ'));
        this.onClick('continueIntroButton', () => this.startRoundPlay());
        this.onClick('resumeButton', () => this.resumeGame());
        this.onClick('restartButton', () => this.beginGame());
        this.onClick('pauseOptionsButton', () => this.showScreen('pause-options'));
        this.onClick('pauseLanguageButton', () => {
            this.previousScreen = 'pause';
            this.showScreen('pause-language');
        });
        this.onClick('pauseExitButton', () => this.showScreen('exit'));
        this.onClick('pauseOptionsBackButton', () => this.showScreen('pause'));
        this.onClick('pauseLanguageBackButton', () => this.showScreen(this.previousScreen));
        this.onClick('pauseEnglishButton', () => this.changeLanguage('en'));
        this.onClick('pauseArabicButton', () => this.changeLanguage('ar-DZ'));
        this.onClick('closeHelpButton', () => this.closeHelp());
        this.onClick('replayButton', () => this.beginGame());
        this.onClick('resultMenuButton', () => this.showScreen('menu'));
        this.onClick('returnMenuButton', () => this.showScreen('menu'));
        this.onClick('lensButton', () => this.toggleLens());
        this.onClick('backpackButton', () => this.openBackpack());
        this.onClick('helpButton', () => this.openHelp());
        this.onClick('pauseButton', () => this.pauseGame());
        this.onClick('closeBackpackButton', () => this.closeBackpack());
        this.onClick('equipFormulaButton', () => this.equipSelectedFormula());
        this.onClick('pickupContinueButton', () => this.closePickupPanel());
        this.onClick('soundButton', () => this.toggleAudio('sound'));
        this.onClick('musicButton', () => this.toggleAudio('music'));
        this.onClick('pauseSoundButton', () => this.toggleAudio('sound'));
        this.onClick('pauseMusicButton', () => this.toggleAudio('music'));
        document.getElementById('formulaList').addEventListener('click', (event) => {
            const button = event.target.closest('[data-formula-id]');
            if (button) this.selectFormulaDetail(button.dataset.formulaId);
        });
    }

    onClick(id, handler){
        document.getElementById(id).addEventListener('click', handler);
    }

    async toggleAudio(kind){
        const status = document.getElementById('audioStatus');
        status.textContent = '';
        try {
            if (kind === 'sound') await this.audioManager.toggleSound();
            else await this.audioManager.toggleMusic();
            this.refreshText();
        } catch (error){
            status.textContent = this.localization.text.audioError;
            console.error(`Unable to toggle ${kind}:`, error);
        }
    }

    changeLanguage(language){
        this.localization.setLanguage(language);
        this.refreshText();
        this.renderBackpack();
    }

    toggleLens(){
        this.lensActive = !this.lensActive;
        this.audioManager.playMovementSound();
        this.refreshText();
    }

    beginGame(){
        this.world = new World();
        this.player = new Player(PLAYER_START);
        this.remainingTime = ROUND_TIME;
        this.lensActive = false;
        this.collectedFormulaIds.clear();
        this.selectedFormulaId = null;
        this.selectedDetailFormulaId = null;
        this.scan = null;
        this.pickupFormula = null;
        this.keys = {};
        this.message = '';
        this.messageTimer = 0;
        this.showScreen('intro');
        this.refreshText();
    }

    startRoundPlay(){
        if (this.state !== 'intro') return;
        this.showScreen('play');
    }

    handleEscape(){
        if (this.state === 'play'){
            this.pauseGame();
        } else if (this.state === 'intro'){
            this.startRoundPlay();
        } else if (this.state === 'help'){
            this.closeHelp();
        } else if (this.state === 'inventory'){
            this.closeBackpack();
        } else if (this.state === 'pickup'){
            this.closePickupPanel();
        } else if (this.state === 'pause'){
            this.resumeGame();
        } else if (this.state === 'options' || this.state === 'language'){
            this.showScreen('menu');
        } else if (this.state === 'pause-options' || this.state === 'pause-language'){
            this.showScreen('pause');
        }
    }

    pauseGame(){
        if (this.state !== 'play') return;
        this.keys = {};
        this.showScreen('pause');
    }

    resumeGame(){
        if (this.state !== 'pause') return;
        this.showScreen('play');
    }

    openHelp(){
        if (this.state !== 'play') return;
        this.showScreen('help');
    }

    closeHelp(){
        if (this.state !== 'help') return;
        this.showScreen('play');
    }

    openBackpack(){
        if (this.state !== 'play') return;
        this.keys = {};
        this.returnAfterPanel = 'play';
        this.showScreen('inventory');
        this.renderBackpack();
    }

    closeBackpack(){
        if (this.state !== 'inventory') return;
        this.showScreen(this.returnAfterPanel);
    }

    selectFormulaDetail(formulaId){
        if (!this.collectedFormulaIds.has(formulaId)) return;
        this.selectedDetailFormulaId = formulaId;
        this.renderBackpack();
    }

    equipSelectedFormula(){
        if (!this.selectedDetailFormulaId) return;
        this.selectedFormulaId = this.selectedDetailFormulaId;
        this.closeBackpack();
    }

    interact(){
        const formula = this.findTargetFormula();
        if (formula){
            this.collectFormula(formula);
            return;
        }
        const ghost = this.findTargetGhost();
        if (!this.lensActive){
            this.showMessage(this.localization.text.activateLens);
        } else if (ghost){
            this.tryFormulaOnGhost(ghost);
        } else {
            this.showMessage(this.localization.text.noTarget);
        }
    }

    findTargetFormula(){
        return this.world.formulas.find((formula) =>
            !formula.collected && this.isFacing(formula.x, formula.y, PICKUP_RANGE, 0.7)
        );
    }

    collectFormula(formula){
        formula.collected = true;
        this.collectedFormulaIds.add(formula.id);
        this.selectedDetailFormulaId = formula.id;
        this.pickupFormula = formula;
        this.audioManager.playMovementSound();
        this.showScreen('pickup');
        this.refreshText();
        this.renderFormulaGrid('pickupGrid', formula);
    }

    closePickupPanel(){
        if (this.state !== 'pickup') return;
        this.pickupFormula = null;
        this.showScreen('play');
        this.renderBackpack();
    }

    findTargetGhost(){
        if (!this.lensActive) return null;
        return this.world.ghosts
            .filter((ghost) => !ghost.caught && this.isFacing(ghost.x, ghost.y, GHOST_RANGE, 0.34))
            .sort((a, b) => this.distanceTo(a) - this.distanceTo(b))[0] ?? null;
    }

    tryFormulaOnGhost(ghost){
        if (!this.selectedFormulaId || !this.collectedFormulaIds.has(this.selectedFormulaId)){
            this.showMessage(this.localization.text.noFormula);
            return;
        }
        if (this.scan) return;
        const formula = FORMULAS.find((item) => item.id === this.selectedFormulaId);
        if (formula.ghostId !== ghost.typeId){
            ghost.chances--;
            if (ghost.chances === 0){
                this.audioManager.playMovementSound();
                this.finishRound('lost', 'outOfTriesTitle', 'outOfTriesText');
                return;
            }
            this.showMessage(this.localization.text.wrongFormula.replace('{chances}', String(ghost.chances)));
            return;
        }
        this.scan = { ghostId: ghost.id, ghost, progress: 0 };
        this.showMessage(this.localization.text.scanning, SCAN_DURATION + 0.3);
    }

    catchGhost(){
        if (!this.lensActive) return;
        const ghost = this.world.ghosts
            .filter((item) => item.revealed && !item.caught && this.isFacing(item.x, item.y, GHOST_RANGE, 0.085))
            .sort((a, b) => this.distanceTo(a) - this.distanceTo(b))[0];
        if (!ghost){
            this.showMessage(this.localization.text.aimPrompt);
            return;
        }
        ghost.caught = true;
        this.audioManager.playMovementSound();
        if (this.world.ghosts.every((item) => item.caught)){
            this.finishRound('won', 'winTitle', 'winText');
        }
    }

    isFacing(targetX, targetY, maxDistance, maxAngle){
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        if (Math.hypot(dx, dy) > maxDistance || !this.world.hasLineOfSight(this.player.x, this.player.y, targetX, targetY)){
            return false;
        }
        const targetAngle = Math.atan2(dy, dx);
        const difference = Math.atan2(
            Math.sin(targetAngle - this.player.angle),
            Math.cos(targetAngle - this.player.angle)
        );
        return Math.abs(difference) <= maxAngle;
    }

    distanceTo(entity){
        return Math.hypot(entity.x - this.player.x, entity.y - this.player.y);
    }

    finishRound(state, titleKey, textKey){
        this.keys = {};
        this.resultTitleKey = titleKey;
        this.resultTextKey = textKey;
        this.showScreen('result');
        this.refreshText();
    }

    showScreen(screen){
        this.state = screen;
        this.keys = {};
        const overlay = document.getElementById('screenOverlay');
        overlay.hidden = !MENU_SCREENS.has(screen);
        overlay.querySelectorAll('[data-screen]').forEach((panel) => {
            panel.hidden = panel.dataset.screen !== screen;
        });
        document.getElementById('gameHud').hidden = !['play', 'inventory', 'pickup', 'help', 'pause', 'pause-options', 'pause-language'].includes(screen);
        document.getElementById('backpackPanel').hidden = screen !== 'inventory';
        document.getElementById('pickupPanel').hidden = screen !== 'pickup';
        document.getElementById('crosshair').hidden = screen !== 'play';
        if (screen === 'play' || screen === 'inventory' || screen === 'pickup'){
            document.getElementById('screenOverlay').hidden = true;
        }
        this.refreshText();
    }

    showMessage(message, duration = 3){
        this.message = message;
        this.messageTimer = duration;
    }

    refreshText(){
        const text = this.localization.text;
        const labels = {
            gameTitle: text.title,
            playButton: text.play,
            openOptionsButton: text.options,
            openLanguageButton: text.language,
            exitButton: text.exit,
            optionsTitle: text.options,
            pauseOptionsTitle: text.options,
            optionsBackButton: text.back,
            languageTitle: text.language,
            pauseLanguageTitle: text.language,
            languageBackButton: text.back,
            pauseLanguageBackButton: text.back,
            introTitle: text.missionTitle,
            introText: text.mission,
            introControls: text.controls,
            continueIntroButton: text.continue,
            skipHint: text.skipHint,
            pauseTitle: text.paused,
            resumeButton: text.resume,
            restartButton: text.restart,
            pauseOptionsButton: text.options,
            pauseLanguageButton: text.language,
            pauseExitButton: text.exit,
            helpTitle: text.missionTitle,
            helpText: text.mission,
            helpControls: text.controls,
            closeHelpButton: text.returnToGame,
            resultMenuButton: text.mainMenu,
            returnMenuButton: text.mainMenu,
            exitTitle: text.exitTitle,
            exitText: text.exitText,
            timeLabel: text.time,
            formulaCountLabel: text.formulas,
            backpackTitle: text.backpack,
            pickupTitle: text.pickedUpTitle,
            pickupContinueButton: text.closePickup,
            kernelCaption: text.kernel
        };
        for (const [id, value] of Object.entries(labels)){
            document.getElementById(id).textContent = value ?? '';
        }

        document.title = text.title;
        for (const [id, type] of [['soundButton', 'sound'], ['pauseSoundButton', 'sound'], ['musicButton', 'music'], ['pauseMusicButton', 'music']]){
            const enabled = type === 'sound' ? this.audioManager.soundEnabled : this.audioManager.musicEnabled;
            const button = document.getElementById(id);
            button.textContent = type === 'sound'
                ? (enabled ? text.soundOn : text.soundOff)
                : (enabled ? text.musicOn : text.musicOff);
            button.setAttribute('aria-pressed', String(enabled));
        }
        for (const id of ['lensButton']){
            const button = document.getElementById(id);
            button.textContent = this.lensActive ? text.lensOn : text.lensOff;
            button.setAttribute('aria-pressed', String(this.lensActive));
        }
        document.getElementById('backpackButton').textContent = text.backpack;
        document.getElementById('formulaCountLabel').textContent = text.formulas;
        document.getElementById('pauseButton').setAttribute('aria-label', text.paused);
        document.getElementById('helpButton').setAttribute('aria-label', text.missionTitle);
        const resultTitle = document.getElementById('resultTitle');
        const resultText = document.getElementById('resultText');
        resultTitle.textContent = this.resultTitleKey ? text[this.resultTitleKey] : text.winTitle;
        resultText.textContent = this.resultTextKey ? text[this.resultTextKey] : text.winText;
        document.getElementById('replayButton').textContent = text.play;
        this.renderGhostCounts();
        this.renderHud();
        if (this.state === 'inventory') this.renderBackpack();
        if (this.state === 'pickup' && this.pickupFormula){
            const formula = this.pickupFormula;
            const index = FORMULAS.findIndex((item) => item.id === formula.id);
            document.getElementById('pickupTitle').textContent = `${text.pickedUpTitle}: ${text.formulaNames[index]}`;
            document.getElementById('pickupDescription').textContent = text.formulaDescriptions[index];
            this.renderFormulaGrid('pickupGrid', formula);
        }
    }

    renderHud(){
        const hudVisible = !document.getElementById('gameHud').hidden;
        if (!hudVisible) return;
        this.renderGhostCounts();
        document.getElementById('timeValue').textContent = this.formatTime(this.remainingTime);
        document.getElementById('formulaValue').textContent = `${this.collectedFormulaIds.size} / ${FORMULAS.length}`;
        document.getElementById('gamePrompt').textContent = this.state === 'play' ? this.getPrompt() : this.message;
        const visibleTarget = this.lensActive && this.world.ghosts.some((ghost) =>
            !ghost.caught && this.isFacing(ghost.x, ghost.y, GHOST_RANGE, 0.34)
        );
        document.getElementById('crosshair').hidden = this.state !== 'play' || !visibleTarget;
    }

    renderGhostCounts(){
        for (const [index, type] of GHOSTS.entries()){
            const group = this.world.ghosts.filter((ghost) => ghost.typeId === type.id);
            const caught = group.filter((ghost) => ghost.caught).length;
            const count = document.getElementById(`${type.id}Count`);
            count.textContent = `${caught} / ${group.length - caught}`;
            count.parentElement.setAttribute('aria-label', `${this.localization.text.ghostNames[index]}: ${caught} ${this.localization.text.caught}, ${group.length - caught} ${this.localization.text.remaining}`);
        }
    }

    renderBackpack(){
        const list = document.getElementById('formulaList');
        list.replaceChildren();
        const text = this.localization.text;
        document.getElementById('backpackCount').textContent = `${this.collectedFormulaIds.size} / ${FORMULAS.length}`;

        for (const [index, formula] of FORMULAS.entries()){
            if (!this.collectedFormulaIds.has(formula.id)) continue;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'formula-item';
            button.dataset.formulaId = formula.id;
            button.setAttribute('aria-pressed', String(this.selectedDetailFormulaId === formula.id));
            const swatch = document.createElement('span');
            swatch.className = 'formula-swatch';
            swatch.style.backgroundColor = formula.color;
            const name = document.createElement('span');
            name.textContent = text.formulaNames[index];
            button.append(swatch, name);
            list.append(button);
        }

        const formula = FORMULAS.find((item) => item.id === this.selectedDetailFormulaId);
        const details = document.getElementById('formulaDetails');
        details.hidden = !formula;
        document.getElementById('formulaDetailHint')?.remove();
        if (!formula){
            const hint = document.createElement('p');
            hint.id = 'formulaDetailHint';
            hint.textContent = text.formulaDetailHint;
            list.after(hint);
            return;
        }
        const index = FORMULAS.indexOf(formula);
        document.getElementById('formulaName').textContent = text.formulaNames[index];
        document.getElementById('formulaDescription').textContent = text.formulaDescriptions[index];
        const equip = document.getElementById('equipFormulaButton');
        equip.textContent = this.selectedFormulaId === formula.id ? text.formulaEquipped : text.applyFormula;
        equip.disabled = this.selectedFormulaId === formula.id;
        this.renderFormulaGrid('formulaGrid', formula);
    }

    renderFormulaGrid(id, formula){
        const grid = document.getElementById(id);
        grid.replaceChildren();
        for (const value of formula.cells){
            const cell = document.createElement('span');
            cell.textContent = value;
            grid.append(cell);
        }
    }

    getPrompt(){
        if (this.messageTimer > 0) return this.message;
        const formula = this.findTargetFormula();
        if (formula){
            const index = FORMULAS.findIndex((item) => item.id === formula.id);
            return this.localization.text.collectPrompt.replace('{formula}', this.localization.text.formulaNames[index]);
        }
        if (!this.lensActive) return this.localization.text.activateLens;
        const ghost = this.findTargetGhost();
        if (!ghost) return '';
        return ghost.revealed ? this.localization.text.aimPrompt : this.localization.text.usePrompt;
    }

    formatTime(seconds){
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
    }

    resizeCanvas(){
        const ratio = GAME_WIDTH / GAME_HEIGHT;
        const margin = 20;
        const availableWidth = Math.max(1, window.innerWidth - margin * 2);
        const availableHeight = Math.max(1, window.innerHeight - margin * 2);
        const width = availableWidth / availableHeight > ratio ? availableHeight * ratio : availableWidth;
        const height = width / ratio;
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }
}
