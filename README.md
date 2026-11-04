# Ghostbusters: The Lost Formulas

> Pick the right formula. Reveal the ghost. Catch it before time runs out.

A first-person, pixel-art browser game about convolution. Explore a haunted mansion, collect five
image-filter formulas, reveal ghosts with the lens, and catch every assigned ghost before the timer
expires. Each round assigns one to three ghosts of each of the five kinds.

Made for the Creative Workshop, Subject 1: Convolution. The game supports English and Arabic.

## Run the game

Serve the repository root with a local web server, then open its URL in a desktop browser:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. The game loads its local images and fonts, so it does not need
third-party services or a build step. Do not open `index.html` directly with `file://`; use a local
server.

## Host on GitHub Pages

The game is a static site and its CSS, JavaScript, and font URLs are relative to the repository root.
To publish it, push the repository to GitHub, then in **Settings → Pages** choose **Deploy from a
branch**, select the branch and `/(root)` folder, and save. GitHub Pages will provide the site URL
after deployment.

On phones, play in landscape orientation. Drag on the right side of the game to look, use the
on-screen pad to move, and tap **Find** or **Catch** for those actions. The lens, spellbook, map,
and pause controls remain available in the HUD.

## Menu and round

The main menu has Play, Options, Language, and Exit. Options have separate sound and music volume
controls. Language offers English and Arabic. The pause menu offers Resume, Restart, Options,
Language, and Exit; press `Esc` to pause or resume.

1. Play opens a skippable mission briefing. Press `Enter`, `Space`, or click to step through it;
   press `Esc` to skip. The HUD help button reopens the briefing during a round.
2. Explore the corridors and press `F` near a spell to collect it. Its child-friendly name,
   description, color, and kernel are shown, and it is added to the spellbook.
3. Turn on the lens with `L` or the HUD button to see hidden ghosts. Ghosts are invisible while
   the lens is off.
4. Aim at a distorted ghost and open the backpack with `B`. Select one of the formulas you have
   collected and choose **Cast on Ghost**. A correct formula reveals the ghost; a wrong formula
   uses one of its two chances. The second wrong choice ends the round.
5. Aim at a revealed ghost and click, press `Space`, or press `Enter` to catch it.

The timer is set from the random ghost total (two minutes plus 50 seconds per ghost). Catch every
ghost before it expires to win.

## Controls

| Action | Key or mouse |
| --- | --- |
| Move forward / back | `W` / `S` or `↑` / `↓` |
| Strafe | `A` / `D` |
| Turn | Drag on the scene or use `←` / `→` |
| Collect a nearby formula | `F` |
| Toggle the lens | `L` or click the lens HUD button |
| Open the backpack | `B` or click the backpack HUD button |
| Show or hide the map | `M` or click the map HUD button |
| Choose a backpack entry | Click it, press `1`–`5`, or use `↑` / `↓` |
| Cast a formula on the targeted ghost | Select it and click **Cast on Ghost** or press `Enter` |
| Catch a revealed ghost | Aim and click, press `Space`, or press `Enter` |
| Reopen the briefing | Click the `?` HUD button |
| Pause or resume | `Esc` or the pause HUD button |
| Phone: move / look | Drag the on-screen pad / drag the scene |
| Phone: collect / catch | Tap **Find** / **Catch** |

The cursor stays visible; dragging on the scene looks around, and clicking without dragging attempts
to catch a revealed ghost. HUD controls remain available while playing.

## Ghosts and formulas

Each ghost type is matched to the formula with the same index:

| Ghost | Formula | Image operation |
| --- | --- | --- |
| The Foggy Ghost | The Fog-Clearing Charm | Covered in fuzzy spots |
| The Red-Hooded Ghost | The Sharp-Eye Charm | Blurry red shape |
| The Fog Watcher | The Outline Finder | Faint shape blending into fog |
| The Carved Ghost | The Carving Charm | Flat stone with hidden carvings |
| The Speedy Ghost | The Streak-Maker Charm | Split into thin stripes |

The HUD tracks caught and remaining ghosts for every type, time remaining, and collected formulas
out of five. Spell descriptions are available in the spellbook. The technical filter names are
introduced in the lesson after a win.

## Project structure

The root `index.html` loads classic scripts in dependency order. They share the browser's global
script scope; keep this order when changing the script list:

1. `js/core/constants.js`
2. `js/managers/Localization.js`
3. `js/managers/ImageManager.js`
4. `js/managers/AudioManager.js`
5. `js/core/World.js`
6. `js/entities/ghosts.js`
7. `js/entities/Player.js`
8. `js/core/Game.js`
9. `js/systems/RenderSystem.js`
10. `js/managers/GameUI.js`
11. `js/main.js`

`main.js` binds input and starts the game after the modules load.

```text
index.html
css/
  styles.css
js/
  core/          constants.js, Game.js, World.js
  entities/      Player.js, ghosts.js
  managers/      AudioManager.js, GameUI.js, ImageManager.js, Localization.js
  systems/       RenderSystem.js
  main.js
images/
  floor.png
  ghost1.png
  wall.png
fonts/
  PixelAE-Regular.ttf
  PixelAE-Bold.ttf
test/
  game.js
  index.html
  style.css
```

The modules divide the game into shared constants and localization, game/world state, player and
ghost entities, rendering, audio/image managers, and interface/input setup. The first ghost uses
`images/ghost1.png`; the remaining ghost sprites are
generated in `js/entities/ghosts.js`. The floor and wall render from their supplied PNG tiles, while
the ceiling and other scene details are generated in code. Music and sound effects use the Web Audio
API, and all interface text uses the local Pixel AE font files.

## Languages

English and Arabic interface strings live in `js/managers/Localization.js`. The page changes its
language and text direction together, including right-to-left layout for Arabic. The current text is
a draft and should be reviewed by a fluent Arabic speaker.
