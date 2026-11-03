# Ghostbusters: The Lost Formulas

> Pick the right formula. Watch it scan. Catch the ghost.

A first-person, pixel-art browser game set in a **haunted mansion** that teaches **convolution** by
letting kids *see* it work. You are a rookie ghost hunter whose detector only works with **formulas**
(small filter grids) hidden around the house. Find each formula, equip it in the lens, reveal the
matching ghost, then catch it. Every new round randomly assigns one to three ghosts of each of the
five kinds.

Made for the **Creative Workshop, Subject 1: Convolution**.
Audience: ages 10-14, artisan community, primary-school level. No maths notation is needed to play.
**Game languages: English and Algerian Darija** (Arabic script, right-to-left).

> Original characters and art. This is a school project and is not affiliated with the Ghostbusters franchise.

---

## Play it

- **Live demo:** `<add link, e.g. GitHub Pages or itch.io>`
- **Platform:** desktop web browser (keyboard and mouse). Not designed for phones or tablets.
- **Length:** seven minutes per round.

### Controls

| Action | Key |
| --- | --- |
| Walk forward / back | `W` / `S` (or `Up` / `Down`) |
| Step left / right | `A` / `D` |
| Look around | Drag on the scene (or `Left` / `Right` arrows) |
| Pick up a nearby formula / use selected formula on a ghost | `F` |
| Toggle the lens | `L` |
| Open the backpack | `B` |
| Reopen the mission briefing | `H` |
| Catch a revealed ghost | Aim and click |
| Pause | `Esc` |

The HUD shows caught and uncaught totals for each ghost kind, the time left, and formulas collected
out of five. Activate the lens to see distorted ghosts; turn it off to hide them.

> The cursor remains visible and available for HUD buttons throughout the round. Drag on the scene
> to look around; clicking without dragging attempts to catch a revealed ghost. `L`, `B`, and `H`
> also toggle the lens, open the backpack, and reopen the help briefing.

---

## Menus and how a round works

The main menu offers Play, Options (separate sound and music toggles), Language (English or Arabic),
and Exit. The pause menu provides the same options alongside Resume and Restart.

1. **Start from the menu.** Play opens a skippable mission briefing. Press `Enter` or Continue to
   begin. The help icon opens the briefing again during play.
2. **Find formulas.** Walk up to a glowing formula and press `F`. Its name, function, and kernel
   appear; collected formulas are stored in the backpack.
3. **Look through the lens.** Turn the lens on to reveal distorted ghosts. Ghosts are invisible
   while the lens is off.
4. **Choose a formula.** Open the backpack with `B`, select a collected formula, and equip it to the
   lens. Face a visible ghost and press `F` to try the formula.
5. **Catch the ghost.** A correct formula scans and reveals the ghost's true form. Aim and click to
   catch it. A wrong formula uses one of that ghost's two chances; the second wrong choice loses
   the round.

**Win:** catch every assigned ghost before the seven-minute timer expires.
**Lose:** time runs out or you use both formula chances on a ghost. Restart to try again.
Escape opens the same pause menu as the pause button, with Resume, Restart, Options, Language, and Exit.

---

## Ghost roster

| Ghost | The clue | Formula | What it does | Filter behind it |
| --- | --- | --- | --- | --- |
| The Blur | A blurry blob, floating | Spectral Clarity | Sharpens the picture | Sharpen |
| The Static | A shape covered in specks | Static Eater | Smooths the specks away | Smooth / box blur |
| The Veil | A faint, see-through outline | Boundary Seeker | Highlights the edges | Edge detection |
| The Relief | Flat, shapeless shading | Phantom Engraver | Makes it look carved | Emboss |
| The Split | Broken vertical lines | Rift Finder | Highlights vertical edges | Vertical edge (Sobel-x) |

---

## Why the scan matters

Every formula is a small grid. During the scan, the grid sits on one spot of the ghost, looks at
the squares under it, and works out one new square. Then it slides over and does it again, across
the whole ghost. Same grid, new spot, over and over. **That repeated sliding is convolution.**
The player watches it happen but never calculates it.

After one session a player should be able to say:

- A formula is a small pattern that changes a picture.
- It works on one small patch at a time, all over the picture.
- Different problems need different formulas.

The scan in the game is **real convolution** on the ghost's pixels (`ImageData`), not a fake animation.

---

## Quick start (under 5 minutes)

There is no build step and nothing to install except a way to serve files locally.

```bash
git clone <your-repo-url>
cd <your-repo-folder>

# pick one:
python -m http.server 8000      # then open http://localhost:8000
npx serve                       # alternative if you have Node.js
```

Or open the folder in VS Code and use the **Live Server** extension.

> **Do not open `index.html` by double-clicking it.** Browsers treat `file://` pages as
> cross-origin, which blocks `getImageData` on loaded images and breaks the scan.

### Deploying

Push to GitHub and enable **GitHub Pages**, or upload the folder as an HTML project on itch.io.
Keep an offline copy on the presentation laptop, test it there, and check that the mouse look works
on that machine before the demo.

---

## Tech stack

- HTML5 Canvas and vanilla JavaScript (ES modules), no framework and no build tools
- **First-person view with a raycaster** (Wolfenstein-style): the mansion is a grid map with the
  supplied floor and wall tiles, and ghost and formula billboards
- Internal resolution 480x272 (lower it to 320x180 if the demo laptop is slow), scaled up with CSS
  `image-rendering: pixelated`
- Visible-cursor mouse look by dragging on the scene; HUD controls remain clickable
- Filters applied to ghost sprites with `ImageData`
- Pixel AE font files in `fonts/` are used for the complete UI
- **Music and sound effects generated with the Web Audio API**, with independent menu toggles
- **UI as HTML on top of the canvas** (formula card, backpack, messages, HUD), so Arabic text is
  shaped and laid out right-to-left by the browser

Ghost type definitions and instance creation live in `js/entities/ghosts.js`. `images/ghost1.png` is
used for The Blur; the other ghost types remain generated placeholders.
Each round rolls one to three ghosts of each type (five to fifteen ghosts total) and distributes one
pickup for each of the five formulas. The scan applies the selected kernel to the ghost's `ImageData`
and progressively reveals the convolved result.

## Project structure

```
index.html
css/
  styles.css
js/
  main.js
  core/
    Game.js
    World.js
    constants.js
  entities/
    Player.js
    ghosts.js
  managers/
    AudioManager.js
    Localization.js
  systems/
    ConvolutionSystem.js
    RenderSystem.js
images/
  floor.png
  ghost1.png
  wall.png
fonts/
  PixelAE-Regular.ttf
  PixelAE-Bold.ttf
```

### Adding or changing a ghost

Ghosts are data-driven. Each one points to a clean sprite, a function that damages it to make the clue,
the formula that cures it, and the key of the message shown for a wrong pick:

```js
{
  id: "blur",
  sprite: "assets/sprites/ghosts/blur.png",   // 64x64, high contrast, hard pixel edges
  makeClue: (img) => boxBlur(img, 3),          // damage the clean sprite
  formula: "spectral-clarity",                 // the correct cure
  wrongMessageKey: "wrong.blur"                // text lives in i18n/ar-DZ.js
}
```

Kernels live in `convolution.js`:

| Formula | Kernel (3x3, row by row) | Bias |
| --- | --- | --- |
| Sharpen | `0 -1 0 / -1 5 -1 / 0 -1 0` | 0 |
| Smooth | `1 1 1 / 1 1 1 / 1 1 1` divided by 9 | 0 |
| Edge detection | `-1 -1 -1 / -1 8 -1 / -1 -1 -1` | 0 |
| Emboss | `-2 -1 0 / -1 1 1 / 0 1 2` | 128 |
| Vertical edges | `-1 0 1 / -2 0 2 / -1 0 1` | 0 |

---

## Languages: English and Algerian Darija

- Player-facing text lives in `js/managers/Localization.js`. Code, comments and this README stay in English.
- The UI overlay uses `lang="ar-DZ"` and `dir="rtl"`. Text is HTML, not drawn on the canvas, which avoids
  broken letter joining and wrapping problems.
- Use an Arabic-capable font. Most pixel fonts (such as Press Start 2P) have **no Arabic letters**.
  Host the font files yourselves so the demo works offline.
- Short sentences, simple words, and the same word for the same thing everywhere.
- Have a native speaker from the target age group read every line before the demo.

Game text is currently a draft and should be reviewed by a native speaker from the target age group.

---

## Art and sound credits

Fill this in once the assets are chosen. Always check the licence on each download page.

| Asset | Author | Source | Licence |
| --- | --- | --- | --- |
| Ghost sprites | `<team>` | Original | n/a |
| Formula pickups | `<team>` | Original | n/a |
| Wall, floor and ceiling textures | `<author>` | `<link>` | `<e.g. CC0>` |
| Furniture and decoration sprites | `<author>` | `<link>` | `<licence>` |
| Detector (held in first person) | `<team or author>` | `<link>` | `<licence>` |
| UI frames and icons | `<author>` | `<link>` | `<licence>` |
| Fonts (Arabic-capable) | `<name>` | `<link>` | `<e.g. OFL>` |
| Music and sound effects | Web Audio API | Generated in `js/managers/AudioManager.js` | Original code |
| Palette | `<name>` | Lospec | `<link>` |

---

## How we test it

We watch players aged 10-14. Can they pick up a formula and choose one without help?
Can they move and look around with the mouse comfortably? Afterwards we ask:
*What did the detector do? Why did one formula work better than another?*

Notes from the sessions: `<add results here>`

---

## Team

`<names and roles>` - Creative Workshop, Subject 1: Convolution, `<school / year>`.

## Licence

Code: `<e.g. MIT>`. Original art and sound: `<e.g. CC BY 4.0>`. Third-party assets keep their own
licences, listed above.