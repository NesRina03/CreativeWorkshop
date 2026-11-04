# The Haunted House: The Five Convolutions

A first-person 3D game that runs in the browser. It is written in plain HTML, CSS and JavaScript, with no libraries and no image or sound files. The player explores a haunted mansion, finds five ancient spells, and uses them to reveal and capture ghosts. **Every spell is a real image-processing convolution filter**, so playing the game teaches how Gaussian blur, sharpening, Laplacian edge detection, emboss and motion blur work.

---

## 1. Goal of the project

| Game idea | Real concept it teaches |
|---|---|
| Spell | A 3×3 convolution kernel |
| Ghost hidden under the lens | An image with a problem (noise, blur, low contrast, ...) |
| Casting the right spell | Applying the filter that actually solves that problem |
| Casting the wrong spell | Seeing what the wrong filter really does to that image |
| Sliding window over the ghost | The kernel moving over every pixel |
| Final "lesson" screen | Before and after images, plus the matrix and an explanation |

---

## 2. How to run

The game needs a folder layout like this (it is what `index.html` expects):

```
index.html
css/style.css
fonts/PixelAE-Regular.ttf, PixelAE-Bold.ttf
js/core/       constants.js  World.js  Game.js
js/managers/   Localization.js  ImageManager.js  AudioManager.js  GameUI.js
js/entities/   ghosts.js  Player.js
js/systems/    RenderSystem.js
js/main.js
```

Start a small local server (pointer-lock and audio work best over `http://localhost`):

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

### Controls

| Key / mouse | Action |
|---|---|
| W A S D / arrows up-down | Move |
| Mouse (or left/right arrows) | Look around |
| **F** | Collect a spell when close to it |
| **L** | Magic lens on/off (needed to see and shoot ghosts) |
| **B** | Open the spellbook |
| **M** | Show/hide the minimap |
| **H** | Replay the intro story |
| Click / Space | Shoot (capture a revealed ghost) |
| Tab | Free the mouse cursor |
| Esc | Pause |

---

## 3. How a round plays out

1. **Intro cutscene**: six story slides explain the goal.
2. **Explore** the mansion. Five spells glow on the floor. Press **F** near one to collect it. A panel shows its name, a kid-friendly description and its 3×3 matrix.
3. Turn on the **lens (L)**. Ghosts are only visible through the lens, and each looks different, for example "buried in TV static" or "a dim shape in the fog".
4. Look straight at a ghost and open the **spellbook (B)**. Read the descriptions, choose the spell that fits the ghost's look, and press **CAST**.
5. **Right spell:** a coloured 3×3 window scans over the ghost and reveals its true form. Click to capture it.
6. **Wrong spell:** the real output of that wrong filter is shown for about a second. Two wrong casts on the same ghost lose the game.
7. Capture all ghosts before the **timer** ends. Time = 120 s + 50 s per ghost.
8. **Win:** a 6-slide "lesson" explains each filter with before and after images.

Each of the 5 ghost types spawns 1 to 3 times, randomly. The HUD counters always match what was spawned.

---

## 4. The key idea: convolution

A convolution slides a small grid of numbers (the **kernel**) over every pixel. For each pixel, the neighbouring pixels are multiplied by the kernel weights and added up. The sum (divided by a normalisation factor) becomes the new pixel:

```
out(x, y) = (1 / div) * Σ  kernel(i, j) * in(x - i, y - j)      for i, j in {-1, 0, 1}
```

### The five spells

| # | Spell | Filter | Kernel (row by row) | Divisor | Ghost it solves |
|---|---|---|---|---|---|
| 1 | Gaussian Veil (blue) | Gaussian blur | `1 2 1 / 2 4 2 / 1 2 1` | 16 | **Wraith**: covered in TV static (random noise). Averaging neighbours cancels it. Applied 3 times. |
| 2 | Sharpening Rune (red) | Sharpen | `0 -1 0 / -1 5 -1 / 0 -1 0` | 1 | **Reaper**: out-of-focus red smear. Sharpening boosts edges. Applied 2 times. |
| 3 | Edge Seeker (green) | Laplacian | `0 -1 0 / -1 4 -1 / 0 -1 0` | 1 | **Watcher**: dim, smooth shape hiding in the fog. Weights sum to 0, so flat areas become 0 and only edges glow. |
| 4 | Emboss Curse (purple) | Emboss | `-2 -1 0 / -1 1 1 / 0 1 2` | 1 | **Engraved Phantom**: flat blank slab with carvings in almost the same tone. Emboss turns tiny steps into relief. |
| 5 | Phantom Trail (yellow) | Motion blur | `0 0 0 / 1 1 1 / 0 0 0` | 3 | **Drifter**: strobe-lit, only every 3rd column visible. A 3-tap horizontal blur fills the gaps into one streak. |

Each ghost type is bound to the spell with the same number. This is the "right" match.

### Technical details worth mentioning
- **True convolution:** the kernel is flipped (`x - i`, `y - j`), and edge pixels are replicated at the borders.
- **Premultiplied alpha:** colours are multiplied by alpha before filtering, so transparent pixels do not bleed colour into the sprite.
- **Gains and bias:** the Laplacian result is multiplied by 4 so edges glow. Emboss is centred around mid-grey. Motion blur is multiplied by 3 because a 1/3 kernel makes the image 3 times darker.
- **Real wrong casts:** all 25 combinations (5 spells × 5 ghosts) can be computed with the same `applySpell` function, so a wrong cast shows exactly what that filter does to that image. For example, the Laplacian on static produces pure noise.

---

## 5. Architecture overview

### Load order (from `index.html`)
`constants` → `Localization` → `ImageManager` → `AudioManager` → `World` → `ghosts` → `Player` → `Game` → `RenderSystem` → `GameUI` → `main`

All files are plain scripts sharing one global scope. Each later file may use anything defined in an earlier file.

### Shared state
- `G` (Game.js) is the main game object. It holds the current `state`, the language, volumes, the timer, collected spells, ghost list, required and captured counts, and so on.
- `P` (Player.js) holds the player position and angle. `cam` is the camera used for rendering.
- `MAP`, `RUG`, `LAMPCELL` (World.js) are arrays describing the level.

### Game states (`G.state`)
`menu`, `cutscene`, `playing`, `pause`, `spellPanel`, `book`, `ending`, `win`, `lose`, `bye`.

### Ghost states (`ghost.state`)

```
hidden --(right spell)--> revealing --(1 s)--> revealed --(click)--> capturing --> captured
   |
   +--(wrong spell)--> wrongcast --(1 s)--> hidden   (second wrong cast => game over)
```

### The main loop (`main.js → frame`)
Each animation frame:
1. Compute `dt` (time since the last frame, capped at 0.05 s).
2. If in a cutscene, update the cutscene. Otherwise call `update(dt)`, update the ending animation if needed, then `render()`.
3. Draw the minimap if the HUD is visible.
4. Schedule the next frame with `requestAnimationFrame`.

---

## 6. File-by-file reference

### `index.html`
Contains the `<canvas id="view">` (the 3D view, 320×200 pixels) and all the overlay screens: HUD, menu, options, language, pause, cutscene, spell-found panel, spellbook, ending lesson, win, lose and bye. Elements marked `data-i="..."` are translated automatically.

### `style.css`
Pixel-art styling for the HUD and all screens, such as buttons, panels, the spellbook and the minimap. The whole `#stage` is 960×600 and is scaled to fit the window. Arabic uses `dir="rtl"` and a slightly larger font.

### `constants.js` (helpers and numbers)
| Item | Purpose |
|---|---|
| `W, H, HALF, SPR` | Render width 320, height 200, half height, sprite size 32 |
| `FOV, LENS_RANGE, USE_RANGE, SENS` | Field of view, how far the lens sees (9 cells), spell pickup range, mouse sensitivity |
| `MW, MH, LMR` | Map size 32×24, lightmap resolution (4 per cell) |
| `REVEAL_T, WRONG_SCAN, WRONG_T` | Reveal duration (1 s), wrong-cast scan time and display time |
| `hash(x,y,s)` | Deterministic pseudo-random number from coordinates (used for textures) |
| `rng(seed)` | Seeded random generator, so the static looks the same every run |
| `clamp`, `fmtTime`, `mkCanvas`, `$` | Small utilities |

### `World.js` (level, textures, lighting, collisions)
- `MAPSTR`: the ASCII map. `#` is a wall and `.` is open floor. `MAP` stores a wall texture id (1 to 9) per cell, picked by `pickWall`.
- `RUG`, `LAMPS`, `PROPS`: rug areas, lamp positions and props (candles, crates, tables, chairs, barrels).
- `makeTex(fn)`: builds a 64×64 texture from a function. `texWall(id)`, `wallBase`, `TEX_FLOOR`, `TEX_RUG`, `TEX_CEIL`, `TEX_LAMP` generate all textures in code.
- **Lightmap:** `LMS` (static light) and `LMF` (flickering light) store brightness per quarter-cell. They are built once at start. `los()` checks line of sight so walls block light. `flickerFactor(t)` makes lamps flicker and `lightAt(x,y,fk)` reads the light value.
- **Collision:** `solid`, `canMoveG` (walls only) and `canMove` (walls plus blocking props).

### `Player.js`
- `updatePlayer(dt)`: reads the keys, moves with sliding collisions on each axis separately, turns with the arrow keys, and plays footstep sounds.

### `ghosts.js` (game data, sprites and the convolution engine)
This is the most important file for the explanation.

**Data**
- `SPELLS`: name, colour, kernel, normalisation, and English and Arabic descriptions.
- `GHOSTS`: ghost names and colours. `GPAR`: per-ghost size, float height, speed, wander radius and hit-box.

**Sprite drawing (32×32 pixel art drawn with code)**
- `dWraith`, `dReaper`, `dWatcher`, `dEngraved`, `dDrifter` draw each ghost frame. `GDRAW` lists them.
- `drawRune(i)` and `buildRunes()` make the 16×16 spell icons. `buildProps()` makes the prop sprites.

**Convolution pipeline**
| Function | What it does |
|---|---|
| `conv(plane, w, h, kernel, div)` | The real 3×3 convolution of one number plane |
| `filterRGBA(data, ...)` | Runs `conv` on the 4 premultiplied channels of a sprite |
| `lumA(data)` | Luminance plane (used by Laplacian and emboss) |
| `applySpell(j, data)` | Applies spell `j` once, including its gain or bias |
| `degWraith`, `degReaper`, `degWatcher`, `degEngraved`, `degDrifter` | Create each ghost's "problem" (static, blur, fog, flat slab, strobe) |
| `revFrames(type, f, eye)` | Builds and caches the frame list `[hidden, after pass 1, after pass 2, ...]` |
| `wrongSpr(type, j, f, eye)` | The real result of a wrong spell on a ghost |
| `ghostCanvas`, `ghostSpr` | Return the clean (form 0), hidden (form 1) or revealed (form 2) image |

**Behaviour**
- `pickTarget(g)` and `updateGhost(g, dt)`: ghosts wander around their home point, with different speeds per type. Dart ghosts move in bursts and the Watcher stays still. `updateGhost` also runs the `revealing`, `wrongcast` and `capturing` states.
- `emitGhostParticles(g)`: a different particle effect per ghost type.

### `Game.js` (state and update)
- `G`: the main state object. `save()` / `load()` store language and volume in `localStorage`. `tr(key)` returns translated text.
- `buildWorld()`: randomises ghost counts (1 to 3 per type), sets the timer, places the 5 spells in random spots, places ghosts at random free cells that are away from the start, and resets the player.
- Particles: `addP`, `burst` and `stepParts`.
- `onCaptured(g)`: updates counters. When every requirement is met, it starts the win sequence.
- `nearSpell()`: finds the spell within pickup range.
- `update(dt)`: moves the player and ghosts, spawns spell sparkles, counts down the timer, and triggers random ambient sounds.

### `AudioManager.js`
All sound is **synthesised with the Web Audio API**, with no audio files. `AU` has `tone()` (oscillator beeps) and `noise()` (filtered noise). It also provides an ambient wind loop, a slow generated music loop (`musicTick`) and the effects table `SFX` (steps, collect, scan, correct, wrong, capture, win, lose, creaks, whispers, and so on). `sfx(name)` plays a sound.

### `ImageManager.js`
`mkIcon` and `P1` draw pixel icons into canvases. `buildIcons()` creates the lens, book, map, pause, lock and skull icons as data URLs for the HUD.

### `Localization.js`
The `L` object has all texts in English (`en`) and Arabic (`ar`). The language switch also flips the page direction to right-to-left.

### `RenderSystem.js` (the 3D engine)
The picture is drawn pixel by pixel into a 320×200 buffer, then enlarged with crisp pixels.

| Function | Role |
|---|---|
| `renderWorld` | **1. Floor and ceiling casting:** for each screen row it works out the floor point it sees, then samples texture and light. **2. Wall raycasting (DDA):** one ray per screen column steps through the grid until it hits a wall. The distance gives the wall height. The texture column and lighting are computed. **3. Lens tint:** a blue tint and scanlines when the lens is on. |
| `zbuf` | Stores the wall distance per column so sprites hide correctly behind walls |
| `drawSprite` | Draws billboard sprites (ghosts, props, spell runes) scaled by distance, with depth test, lighting, flash and fade |
| `propLight`, `drawParticles` | Prop lighting and particle drawing |
| `scanSpr` | Builds the sliding-window animation. Pixels already scanned show the next convolution frame and the rest show the previous one. A coloured 3×3 box marks the window. |
| `renderFrame` | Draws the world, sorts all sprites far to near, draws them, then finds which ghost is under the crosshair and draws brackets around it |
| `render` | Picks the camera. In menus, a slow fly-through camera is used. |

### `GameUI.js` (screens, HUD and game flow)
- **Screen helpers:** `showScreen`, `hideScreens`, `toast`, `flashFx`.
- **HUD:** `buildHUD`, `hudGhosts`, `hudTimer`, `hudSpells`, `hudLens`, `hudStatic`, `updatePrompt`.
- **Minimap:** `buildMinimap` draws the whole map once. `drawMinimap` adds the pulsing player arrow. `toggleMap` handles M.
- **Language:** `applyI18n`, `setLang`.
- **Pointer lock:** `lockPointer`, `releasePointer`, plus the mouse-look handler.
- **Game flow:** `playGame`, `beginPlaying`, `restartGame`, `toMenu`, `openPause`, `resumeGame`, `winGame`, `loseGame`.
- **Spells:** `collectSpell`, `fillSpellPanel`, `closeSpellPanel`.
- **Spellbook:** `openBook`, `renderBook`, `castSpell`, `closeBook`. `castSpell` starts `revealing` for a correct spell and `wrongcast` for a wrong one.
- **Shooting:** `shoot` captures a revealed ghost under the crosshair.
- **Cutscene:** six slide-drawing functions (`slide0` to `slide5`) with a typewriter text effect.
- **Ending lesson:** `LESSON` data, `lessonImgs`, `startEnding`, `fillEnding`, `enGo`, `updateEnding` (animated scan on before/after images).

### `main.js`
Binds all buttons, handles keyboard and mouse input per game state, auto-pauses when the window loses focus, scales the stage to the window (`fit`), runs the frame loop and `boot()`.

---

## 7. Features added during development

1. **Sliding-window reveal:** the correct spell reveals the ghost with a visible 3×3 scan.
2. **Kid-friendly spell descriptions:** every description uses an everyday comparison and ends with a hint of which ghost to use it on, so players choose by meaning and not only by colour.
3. **Minimap (M):** the whole map is visible from the start, with only the player marker moving.
4. **Fixed lesson order:** the end screens show hidden image before and real filter result after.
5. **Real convolution engine:** every ghost image is produced by an actual filter, including the wrong-cast previews. The Drifter kernel was corrected to a centred horizontal one.

---

## 8. Questions the teacher may ask, with short answers

**Is the filtering fake or real?**
It is real. `conv()` in `ghosts.js` performs a true 3×3 convolution. The hidden images are made by adding a problem to the sprite, and the revealed images are the real output of the spell's kernel.

**Why does the Laplacian kernel sum to 0?**
A kernel that sums to 0 gives 0 on flat areas, so only places where brightness changes (edges) stay.

**Why divide by 16 or 3?**
To keep the overall brightness unchanged. The Gaussian weights add up to 16 and the motion-blur weights add up to 3.

**Why does motion blur need a gain of 3 here?**
The ghost has only every third column visible, so after averaging three columns only one of them contributes. The result is 1/3 as bright and needs a ×3 correction.

**Why does sharpening leave halos?**
Sharpening is the identity plus the Laplacian. It overshoots next to strong edges, which is a known property of the filter.

**How is a 3D view made without a 3D library?**
By raycasting. One ray per screen column finds the nearest wall, and the distance sets the wall height. Floors, ceilings and sprites use the same camera maths.

**Where do the textures and sounds come from?**
Both are generated by code. Textures come from small functions and noise, and sounds come from Web Audio oscillators and noise.

**How does the game stay fair and repeatable?**
Ghost counts and positions are random each run. The visual static uses a fixed seed, so a given ghost always looks the same.

---

## 9. Possible future work

- Add Sobel (directional edges) or larger kernels such as 5×5.
- Let the player try any kernel and see the result live.
- Add more levels and more ghost types.
- Add touch controls for mobile.
