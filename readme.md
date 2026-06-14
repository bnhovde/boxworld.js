# Boxworld

A really small 2.5D game engine that renders to the **DOM** (not canvas) using
CSS 3D transforms. Tiles are laid out as a flat CSS grid and tilted into an
isometric plane, so the whole world is inspectable, stylable, and animatable
with plain CSS.

➡️ [Example game](https://boxworld1.netlify.app/)

## Install

```bash
npm install boxworld
```

## Usage

```ts
import Engine from "boxworld";
import "boxworld/boxworld.css";

import gardenLevel from "./levels/garden";

const game = Engine({
  title: "Boxworld",
  byline: "Tiny example",
  startLevel: "garden",
  levels: [gardenLevel],
  selector: "app", // id of the mount element
  assetPath: "/assets", // where your img/ and audio/ live (default: "/assets")
  update: (state) => {
    /* per-frame game logic */
  },
  render: () => {},
});

game.addPlayer({ asset: "player", state: {} });
```

Mount point:

```html
<div id="app"></div>
```

### Assets

You only host your own **game** sprites — tiles, the player, entity images, and
inventory items — resolved from `${assetPath}/img/<name>.svg`.

The engine's UI chrome needs no files:

- **Icons** (the dialogue "continue" glyph and the proximity bubble) are inlined.
- **Sound effects** (footsteps, pickups, dialogue blips) are synthesized at
  runtime. Override any of them with your own audio:

  ```ts
  Engine({
    /* ... */
    sounds: {
      walk: "/audio/walk.mp3",
      success: "/audio/success.mp3",
      blip: "/audio/blip.mp3",
    },
  });
  ```

Background music is per-level and optional: set `theme` on a level to an asset
name resolved from `${assetPath}/audio/<theme>.mp3`.

## A level

A `Level` is authored as three layers of asset names — `ground`, `foreground`,
and `top` — each a grid indexed `[y][x]`. The engine assembles them into its
tile grid on load (no helpers to import):

```ts
import { Level } from "boxworld";

const level: Level = {
  id: "garden",
  name: "Garden",
  entities: [],
  ground: [
    ["grass", "grass", "grass"],
    ["grass", "grass", "grass"],
  ],
  foreground: [
    ["wall", "wall", "wall"],
    ["", "fence", ""],
  ],
  // top is optional
};
export default level;
```

- **`ground`** — laid flat.
- **`foreground`** — stood up; `wall`/`fence`/`stem` tiles block movement.
- **`top`** — stood up and raised (trees, etc.).

Each cell is an asset name (resolved to `${assetPath}/img/<name>.svg`) or `""`
for nothing. For larger worlds, a layer can be a grid-of-screens (a 2D array of
11×11 chunks) and the engine stitches them together.

See [`example/`](./example) for a complete, runnable level.

## Controls

Arrow keys to move, **Enter** to interact, hold **Shift** to run.

## Develop

```bash
npm install
npm run example     # live example at http://localhost:2500
npm run build       # bundle to dist/ (ESM + CJS + types + css) via tsup
npm run typecheck
```

## License

ISC © Bård N. Hovde
