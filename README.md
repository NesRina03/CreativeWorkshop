# Ghostbusters: The Lost Formulas

> Pick the right formula. Watch it scan. Catch the ghost.

A first-person, pixel-art browser game set in a **haunted mansion** that teaches **convolution** by
letting kids *see* it work. You are a rookie ghost hunter whose detector only works with **formulas**
(small filter grids) hidden around the house. Each of the five ghosts hides in a different way.
Choose the formula that fixes what is wrong with the picture, watch a small grid slide across the
ghost to reveal it, then shoot.

Made for the **Creative Workshop, Subject 1: Convolution**.
Audience: ages 10-14, artisan community, primary-school level. No maths notation is needed to play.
**Game language: Algerian Darija** (Arabic script, right-to-left).

> Original characters and art. This is a school project and is not affiliated with the Ghostbusters franchise.

---

## Play it

- **Live demo:** `<add link, e.g. GitHub Pages or itch.io>`
- **Platform:** desktop web browser (keyboard and mouse). Not designed for phones or tablets.
- **Length:** 10-15 minutes, one player.

### Controls

| Action | Key |
| --- | --- |
| Walk forward / back | `W` / `S` (or `Up` / `Down`) |
| Step left / right | `A` / `D` |
| Look around | Mouse (or `Left` / `Right` arrows) |
| Pick up a formula | `E` |
| Open the backpack | `B` |
| Scan the ghost in front of you | `F` |
| Shoot | Left mouse button |
| Pause | `Esc` |

The screen always shows the time left, ghosts caught (for example 2 of 5), formulas collected,
and the formula currently selected.

> The browser captures the mouse (Pointer Lock) when you click to start. `Esc` releases it, and the
> game treats that as Pause.

---

## How a round works

1. **Find a formula.** Formulas glow in the rooms and corridors of the mansion. Walk up and press `E`.
2. **Read its card.** It shows the formula's name, what it does (for example "removes blur"),
   and a small grid of coloured numbers. Players do not need to understand the grid.
3. **Spot the clue.** Every ghost leaves a trace: enough to see it, not enough to lock on.
4. **Choose a formula.** Open the backpack and pick the one you think fits.
5. **Scan, then shoot.** Face the ghost and press `F`.
   - Right choice: a small grid window races across the ghost and reveals it. Aim at it and shoot.
   - Wrong choice: the scan shows nothing useful, a short message explains why, and you try
     another formula. It costs a little time.

**Win:** every ghost is caught before the timer hits zero.
**Lose:** time runs out and the ghosts catch you. Press Replay to try again.

---

## The five ghosts

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
> cross-origin, which blocks `getImageData` on loaded images and breaks the scan. Pointer Lock
> also needs a normal page, not `file://`, in some browsers.

### Deploying

Push to GitHub and enable **GitHub Pages**, or upload the folder as an HTML project on itch.io.
Keep an offline copy on the presentation laptop, test it there, and check that the mouse look works
on that machine before the demo.

---

## Tech stack

- HTML5 Canvas and vanilla JavaScript (ES modules), no framework and no build tools
- **First-person view with a raycaster** (Wolfenstein-style): the mansion is a grid map, walls are
  64x64 textures, and ghosts, formulas and furniture are billboard sprites
- Internal resolution 480x272 (lower it to 320x180 if the demo laptop is slow), scaled up with CSS
  `image-rendering: pixelated`
- Mouse look with the Pointer Lock API
- Filters applied to ghost sprites with `ImageData`
- **UI as HTML on top of the canvas** (formula card, backpack, messages, HUD), so Arabic text is
  shaped and laid out right-to-left by the browser

## Project structure

*(Planned layout. Adjust to match the repo.)*

```
index.html
src/
  main.js          game loop and state machine (menu, play, scan, win, lose)
  raycaster.js     wall casting, textures, sprite billboards, depth buffer
  player.js        movement, mouse look, collision against the grid map
  map.js           mansion layout (grid), doors, pickup and ghost positions
  ghosts.js        ghost data, movement and clue generation
  convolution.js   convolve() and the kernel list
  scan.js          sliding-window scan animation
  ui.js            HTML overlays: HUD, formula card, backpack, messages
  i18n/ar-DZ.js    every piece of player-facing text
assets/
  textures/  sprites/ghosts/  sprites/props/  sprites/items/  ui/  fx/  audio/  fonts/
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

## Language: Algerian Darija

- All player-facing text lives in `src/i18n/ar-DZ.js`. Code, comments and this README stay in English.
- The UI overlay uses `lang="ar-DZ"` and `dir="rtl"`. Text is HTML, not drawn on the canvas, which avoids
  broken letter joining and wrapping problems.
- Use an Arabic-capable font. Most pixel fonts (such as Press Start 2P) have **no Arabic letters**.
  Host the font files yourselves so the demo works offline.
- Short sentences, simple words, and the same word for the same thing everywhere.
- Have a native speaker from the target age group read every line before the demo.

Names to settle with the team:

| English | Darija (Arabic script) |
| --- | --- |
| Game title | `<...>` |
| The Blur / The Static / The Veil / The Relief / The Split | `<...>` |
| Spectral Clarity / Static Eater / Boundary Seeker / Phantom Engraver / Rift Finder | `<...>` |
| Formula, backpack, scan, shoot, time left, ghosts caught | `<...>` |
| You win / Time is up / Replay | `<...>` |

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
| Sound effects and ambience | `<author or jsfxr>` | `<link>` | `<licence>` |
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