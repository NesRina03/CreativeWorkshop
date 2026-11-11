#  The Haunted Hills Game

> Find five ancient spells. Reveal the hidden ghosts. Free every spirit before the clock runs out.

A first-person, pixel-art browser game about **image convolution**. You explore a haunted mansion, collect five spells (each one is secretly a convolution kernel), and cast the right one on each ghost. The ghosts are hidden behind real image problems (noise, blur, camouflage, flat texture, missing pixels), and the spells fix them with real 3×3 convolutions computed live in JavaScript.

Pure vanilla JavaScript. No framework, no build step, no external assets besides two pixel fonts.

Available in **English** and **Arabic** (with right-to-left layout).

---

## Table of contents

- [The Haunted Hills Game](#the-haunted-hills-game)
  - [Table of contents](#table-of-contents)
  - [The story](#the-story)
  - [How to play](#how-to-play)
    - [Controls](#controls)
  - [The ghosts and their spells](#the-ghosts-and-their-spells)
  - [The idea behind the game (the maths)](#the-idea-behind-the-game-the-maths)
  - [Technologies used](#technologies-used)
  - [Project structure](#project-structure)
    - [Script load order](#script-load-order)
  - [Main functions](#main-functions)
    - [Core (`js/core/`)](#core-jscore)
    - [Entities (`js/entities/`)](#entities-jsentities)
    - [Rendering (`js/systems/`)](#rendering-jssystems)
    - [UI and flow (`js/managers/`, `js/main.js`)](#ui-and-flow-jsmanagers-jsmainjs)
  - [Run it locally](#run-it-locally)
  - [Host it on GitHub Pages](#host-it-on-github-pages)
  - [Languages](#languages)
  - [Credits](#credits)

---

## The story

Long ago, the old mansion on the hill was full of kind spirits. Then a dark spell trapped them. Now five kinds of ghosts drift through its dusty corridors, hidden from every eye.

You arrive with a **Magic Lens** that makes the invisible ghosts visible. But seeing a ghost is not enough to free it.

Every ghost has lost its **Freedom Gem**. Only a grey shadow of the gem is left on its chest. To bring it back you need the spell that carries the very same symbol.

Five ancient spells are hidden around the mansion. Find them all, and your **Spellbook** keeps every one you discover.

When you cast the right spell, it glides into the ghost, passes through its body, gathers the tiny **Freedom Sparks** hidden inside, and carries them to the gem's place. The gem lights up, and the ghost shows its true form. Catch it to set it free.

Be careful: **two wrong spells on the same ghost and the spirits win.** And hurry, the old clock is ticking. Free every ghost before time runs out.

---

## How to play

1. Press **Play** and read the short intro (skippable).
2. Explore the corridors. Press **F** near a glowing symbol to collect a spell.
3. Turn on the **Lens** (**L**). Ghosts are invisible without it.
4. Aim at a ghost, open the **Spellbook** (**B**), choose a spell, and press **Cast on Ghost**.
   - Correct spell: a cinematic cast scene plays and the ghost is revealed.
   - Wrong spell: the ghost stays hidden and you lose one of your two chances on that ghost.
5. Aim at a revealed ghost and **click / Space / Enter** to catch it.
6. Catch every assigned ghost before the timer ends.
7. After winning, a short **lesson** explains what each spell really did (kernel, weights, effect).

Each round assigns **1 to 3 ghosts of each of the 5 types** at random. The timer is `120 s + 50 s × number of ghosts`.

At the end you get **1 to 3 stars**:
- 1 star for winning
- +1 if at least 30% of the time was left
- +1 if you made at most 1 wrong cast

### Controls

| Action | Key / input |
| --- | --- |
| Move | `W` `A` `S` `D` or arrow keys (up/down) |
| Look | Mouse (pointer lock), drag on the scene, or `←` / `→` |
| Collect a spell | `F` |
| Toggle lens | `L` |
| Open / close Spellbook | `B` |
| Choose a spell in the book | Click, `1`–`5`, or `↑` / `↓` |
| Cast on ghost | `Enter` or the **Cast on Ghost** button |
| Catch a revealed ghost | Click, `Space`, or `Enter` |
| Map | `M` |
| Replay intro / help | `H` |
| Release the mouse | `Tab` |
| Pause | `Esc` |
| Skip / advance cutscenes | `Enter` / `Space` / click, `Esc` to skip |

**Mobile (landscape):** on-screen pad to move, drag the scene to look, **FIND** and **CATCH** buttons.

---

## The ghosts and their spells

Ghost type *i* is always freed by spell *i*. Each ghost hides behind a different image problem.

| # | Ghost | Hidden problem | Spell | Real operation | Kernel |
| - | --- | --- | --- | --- | --- |
| 1 | Foggy Ghost | Buried in TV static (noise) | The Fog-Clearing Charm | Gaussian blur | `[1 2 1; 2 4 2; 1 2 1] / 16` |
| 2 | Red-Hooded Ghost | Out of focus (blurred twice) | The Sharp-Eye Charm | Sharpening | `[0 -1 0; -1 5 -1; 0 -1 0]` |
| 3 | Fog Watcher | Dim silhouette camouflaged in fog | The Outline Finder | Laplacian edge detection | `[0 -1 0; -1 4 -1; 0 -1 0]` |
| 4 | Carved Ghost | Flat stone, carvings painted in nearly the same tone | The Carving Charm | Emboss | `[-2 -1 0; -1 1 1; 0 1 2]` |
| 5 | Speedy Ghost | Only every 3rd pixel column is visible | The Streak-Maker Charm | Motion blur | `[0 0 0; 1 1 1; 0 0 0] / 3` |

The game is told as a story for kids. The technical names (kernel, convolution, Laplacian...) only appear in the lesson after a win.

---

## The idea behind the game (the maths)

A **convolution** slides a small grid of numbers (the *kernel*) over every pixel of an image. At each pixel, the neighbours are multiplied by the kernel weights and summed. The sum becomes the new pixel.

In this game it is not faked:

- Each ghost sprite is drawn with the Canvas 2D API, then **degraded** by a function that creates its "problem" (`degWraith`, `degReaper`, `degWatcher`, `degEngraved`, `degDrifter`).
- The correct spell is applied with a **real 3×3 convolution** (`conv` / `filterRGBA` / `applySpell`), once or several times (`PASSES = [3, 2, 1, 1, 1]`).
- A **wrong spell is also real**: its kernel is applied to the ghost's hidden image, and you see the actual (useless) result before the ghost reverts.
- All frames are computed once and cached.

So the "reveal" you see on screen is the actual output of the filter.

---

## Technologies used

| Technology | Used for |
| --- | --- |
| **Vanilla JavaScript (ES6+)** | All game logic, no framework or bundler |
| **HTML5 Canvas 2D** | Rendering, sprite generation, UI animations, cutscenes |
| **Software raycasting** (DDA algorithm) | The first-person 3D view, written from scratch on a `320×200` pixel buffer (`Uint32Array` + `ImageData`) |
| **Typed arrays** (`Uint32Array`, `Float32Array`, `Uint8ClampedArray`) | Fast pixel buffers, z-buffer, textures, convolution planes |
| **Procedural generation** | Wall, floor, rug and ceiling textures, all sprites, props and runes are generated in code |
| **Seeded PRNG + hash functions** | Reproducible ghost "problems" and procedural details |
| **Web Audio API** | Music, ambience (wind) and all sound effects are synthesized live (oscillators, filtered noise), no audio files |
| **Pointer Lock API + Pointer Events** | Mouse look on desktop, touch look and virtual joystick on mobile |
| **CSS3** | HUD, menus, spellbook, responsive scaling, RTL layout, pixel-art look (`image-rendering: pixelated`) |
| **`localStorage`** | Saves language and volume settings |
| **Custom pixel fonts** (`PixelAE-Regular.ttf`, `PixelAE-Bold.ttf`) | Latin and Arabic pixel typography |
| **Page Visibility / blur events** | Auto-pause when the tab loses focus |

No external libraries. No build step. No network requests at runtime.

---

## Project structure

```text
.
├── index.html                  # Page shell: HUD, menus, spellbook, cast scene, ending lesson
├── README.md
├── css/
│   ├── style.css               # Main styles (HUD, menus, panels, book, responsive, RTL)
│   └── cast.css                # Styles for the cast scene
├── fonts/
│   ├── PixelAE-Regular.ttf
│   └── PixelAE-Bold.ttf
└── js/
    ├── main.js                 # Input binding, main loop (requestAnimationFrame), boot
    ├── core/
    │   ├── constants.js        # Screen size, FOV, ranges, helpers (hash, rng, clamp, fmtTime)
    │   ├── Game.js             # Global state G, world building, update loop, save/load
    │   └── World.js            # Map, procedural textures, lightmap, collision
    ├── entities/
    │   ├── Player.js           # Player position, movement and collision
    │   └── ghosts.js           # Spells, ghosts, sprites, REAL convolution pipeline, ghost AI
    ├── managers/
    │   ├── Localization.js     # English / Arabic strings
    │   ├── ImageManager.js     # Procedurally drawn pixel icons (lens, book, map, lock, skull...)
    │   ├── AudioManager.js     # Web Audio music + sound effects
    │   ├── GameUI.js           # HUD, screens, spellbook, cutscene, lesson/ending, flow
    │   ├── KidMode.js          # Child-friendly replacement of the maths screens (story only)
    │   └── Minimap.js          # Alternative fog-of-war minimap (not loaded by index.html)
    └── systems/
        ├── RenderSystem.js     # Raycaster, sprite renderer, targeting, particles
        ├── CastScene.js        # The close-up animation when a spell is cast
        └── Polish.js           # Final art pass, corrected texts, new intro slide, win screen + stars
```

### Script load order

The scripts are classic scripts sharing one global scope, so **the order in `index.html` matters**:

```text
constants → Localization → ImageManager → AudioManager → World → ghosts → Player
→ Game → RenderSystem → GameUI → KidMode → CastScene → Polish → main
```

`KidMode.js`, `CastScene.js` and `Polish.js` are *override layers*: they redefine functions and texts declared earlier (for example `fillSpellPanel`, `renderBook`, `fillEnding`, `scanSpr`, `render`, `showWin`), so they must load after `GameUI.js` and before `main.js`.

---

## Main functions

### Core (`js/core/`)

| Function | Role |
| --- | --- |
| `hash(x, y, s)` / `rng(seed)` | Deterministic noise and seeded random generator |
| `buildWorld()` | Starts a run: random ghost counts (1 to 3 per type), timer, spell and ghost placement |
| `update(dt)` | Per-frame game logic: player, ghosts, particles, timer, ambient sounds |
| `onCaptured(g)` | Updates counters and triggers the win sequence when all ghosts are caught |
| `nearSpell()` | Finds a collectible spell within reach |
| `makeTex(fn)` / `texWall(id)` | Generate 64×64 procedural textures |
| `buildLightmap()` | Pre-computes static and flickering lamp light with line of sight (`los`) |
| `canMove(x, y, r)` | Collision against walls and solid props |

### Entities (`js/entities/`)

| Function | Role |
| --- | --- |
| `updatePlayer(dt)` | Keyboard / touch movement with strafing and wall sliding |
| `GDRAW[]` (`dWraith`, `dReaper`, `dWatcher`, `dEngraved`, `dDrifter`) | Draw each ghost sprite pixel by pixel |
| `conv(p, w, h, k, div)` | True 2D 3×3 convolution of one float plane (edge replicate) |
| `filterRGBA(d, w, h, k, div)` | Applies a kernel to an RGBA sprite with premultiplied alpha |
| `applySpell(j, d)` | Applies spell *j*'s filter (Laplacian and emboss work on luminance) |
| `DEGRADE[]` | The five "problems" that hide the ghosts |
| `revFrames(type, f, eye)` | Builds and caches the frames `[hidden, step 1, ..., revealed]` |
| `wrongSpr(type, j, f, eye)` | Real output of a wrong spell on a ghost |
| `updateGhost(g, dt)` | Ghost state machine: `hidden`, `casting`, `revealed`, `capturing`, `captured` + movement AI |
| `drawRune(i)` / `buildRunes()` | Draw each spell symbol and its grey "missing gem" version |

### Rendering (`js/systems/`)

| Function | Role |
| --- | --- |
| `renderWorld()` | Floor/ceiling casting, wall raycasting (DDA), lighting, lens tint |
| `drawSprite()` | Billboard sprite renderer with z-buffer, alpha, lighting and dissolve |
| `renderFrame()` | Sorts and draws entities, handles ghost visibility and the crosshair targeting |
| `drawParticles()` | World-space particles |
| `startCast()` / `drawCast()` / `updateCast()` | The cast cinematic: zoom, grey gem, Freedom Sparks, spell orb, reveal or fizzle |
| `scanSpr()` | Sweep animation from the hidden image to the filtered result |

### UI and flow (`js/managers/`, `js/main.js`)

| Function | Role |
| --- | --- |
| `showScreen(id)` / `hideScreens()` | Screen switching |
| `playGame()`, `restartGame()`, `toMenu()`, `openPause()`, `resumeGame()` | Game flow |
| `collectSpell()` / `fillSpellPanel()` | Spell pickup and discovery panel |
| `openBook()` / `renderBook()` / `castSpell()` | Spellbook and casting |
| `shoot()` | Catches a revealed ghost |
| `toggleLens()` | Lens on/off |
| `startEnding()` / `fillEnding()` / `updateEnding()` | Post-win lesson with before/after canvases |
| `calcStars()` / `fillWin()` / `showWin()` | Star rating and win screen |
| `setLang()` / `applyI18n()` / `tr(key)` | Language switching and translation lookup |
| `AU` (`init`, `tone`, `noise`, `SFX`) | Web Audio engine and sound effects |
| `frame(now)` / `boot()` | Main loop and startup |

---

## Run it locally

The game loads local fonts and scripts, so serve it with a local web server (do not open `index.html` with `file://`):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a desktop browser (Chrome, Edge, Firefox).

## Host it on GitHub Pages

The site is fully static and all paths are relative.

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your branch and the `/ (root)` folder, then save.
5. After a minute, GitHub gives you the public URL.

---

## Languages

All text lives in `js/managers/Localization.js` (base strings) and is extended or corrected in `KidMode.js`, `CastScene.js` and `Polish.js`.

- **English (EN)** and **Arabic (AR)**
- The page switches `lang` and `dir` together, so Arabic gets a full right-to-left layout.
- Arabic text is a draft and should be reviewed by a fluent speaker.

---

## Credits

- Game design, code and art: *Deghbar Djouhara, Dekkiche Nesrine, Saadoune Sara*
- Fonts: Pixel AE (`PixelAE-Regular`, `PixelAE-Bold`)
- Context: Creative Workshop, Subject 1: Convolution
