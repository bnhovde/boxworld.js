const GRID_SIZE = 11;

import {
  RawMap,
  RawMapSmall,
  GameMap,
  SlicedMap,
  Entity,
  MapData,
} from "../types";

// Chunked maps nest one level deeper than flat ones: a flat cell is a string,
// a chunked one is a grid.
const isChunked = (data: MapData): data is RawMap =>
  Array.isArray((data as RawMap)[0]?.[0]);

// Mirror a layer's shape, replacing every asset name with "" (no tile).
const emptyLike = (data: any): any =>
  data.map((x: any) => (Array.isArray(x) ? emptyLike(x) : ""));

/** Assemble the three authoring layers into the engine's tile grid. The
 *  foreground/top layers are optional; missing ones become empty. Flat and
 *  chunked ground formats are handled transparently. */
const assembleLayers = (
  ground: MapData,
  foreground?: MapData,
  top?: MapData
): GameMap => {
  const fg = foreground ?? emptyLike(ground);
  const tp = top ?? emptyLike(ground);

  return isChunked(ground)
    ? assembleMap(ground, fg as RawMap, tp as RawMap)
    : assembleMapSmall(ground as RawMapSmall, fg as RawMapSmall, tp as RawMapSmall);
};

const assembleMap = (g: RawMap, fg: RawMap, top: RawMap): GameMap => {
  let output = [];

  const columns = g.length;
  const rows = g[0].length;

  for (let i = 0; i < GRID_SIZE * columns; i++) {
    const columnIndex = Math.floor(i / GRID_SIZE);
    const columnGround = g[columnIndex];
    const columnFg = fg[columnIndex];
    const columnTop = top[columnIndex];
    output[i] = [];

    for (let j = 0; j < rows; j++) {
      const iteration = Math.floor(i / GRID_SIZE);
      const row = columnGround[j][i - GRID_SIZE * iteration];
      const rowFg = columnFg[j][i - GRID_SIZE * iteration];
      const rowTop = columnTop[j][i - GRID_SIZE * iteration];
      const y = GRID_SIZE * rows - Math.ceil(i + GRID_SIZE);

      output[i] = [
        ...output[i],
        ...row.map((t, k) => ({
          id: `${j * GRID_SIZE + k},${i}`,
          g: t,
          fg: rowFg[k],
          top: rowTop[k],
        })),
      ];
    }
  }

  return output;
};

// Flat maps of any rectangular size: each cell is one asset name per layer,
// indexed `[y][x]`.
const assembleMapSmall = (
  g: RawMapSmall,
  fg: RawMapSmall,
  top: RawMapSmall
): GameMap => {
  const output: GameMap = [];

  for (let i = 0; i < g.length; i++) {
    output[i] = [];

    for (let j = 0; j < g[i].length; j++) {
      output[i].push({
        id: `${j},${i}`,
        g: g[i][j],
        fg: fg[i][j],
        top: top[i][j],
      });
    }
  }

  return output;
};

const getCurrentMapSlice = (
  offsetX: number,
  offsetY: number,
  map: GameMap,
  entities: Entity[]
): SlicedMap => {
  const height = map.length;
  const width = map[0].length;

  const rowStart = Math.ceil(offsetY - GRID_SIZE / 2);
  const rowEnd = rowStart + GRID_SIZE - 1;
  const colStart = Math.ceil(offsetX - GRID_SIZE / 2);
  const colEnd = colStart + GRID_SIZE - 1;

  let section = [];

  for (let i = rowStart; i < rowEnd + 1; i++) {
    const row = map[i] || [...Array(width)].map(() => ({ id: "blank" }));
    let col = [];

    for (let j = colStart; j < colEnd + 1; j++) {
      const cell = row[j];
      if (cell) {
        col.push(cell);
      } else {
        col.push({ id: "blank" });
      }
    }
    section.push(col);
  }

  const sectionWithEntities = section.map((s, i) =>
    s.map((c, j) => ({
      ...c,
      entity: entities.find((e) => e.location.toString() === c.id),
    }))
  );

  return sectionWithEntities.flat();
};

const getIncrement = (direction: string) => {
  const xIncrement =
    direction === "ArrowRight" ? 1 : direction === "ArrowLeft" ? -1 : 0;

  const yIncrement =
    direction === "ArrowDown" ? 1 : direction === "ArrowUp" ? -1 : 0;

  return {
    x: xIncrement,
    y: yIncrement,
  };
};

export {
  assembleLayers,
  assembleMap,
  assembleMapSmall,
  getCurrentMapSlice,
  getIncrement,
};
