const GRID_SIZE = 11;

import { RawMap, RawMapSmall, GameMap, SlicedMap, Entity } from "../types";

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

const assembleMapSmall = (
  g: RawMapSmall,
  fg: RawMapSmall,
  top: RawMapSmall
): GameMap => {
  let output = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    const columnIndex = i;
    const columnGround = g[columnIndex];
    const columnFg = fg[columnIndex];
    const columnTop = top[columnIndex];
    output[i] = [];

    for (let j = 0; j < GRID_SIZE; j++) {
      const row = columnGround[j];
      const rowFg = columnFg[j];
      const rowTop = columnTop[j];

      output[i] = [
        ...output[i],
        {
          id: `${j},${i}`,
          g: row,
          fg: rowFg,
          top: rowTop,
        },
      ];
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

export { assembleMap, assembleMapSmall, getCurrentMapSlice, getIncrement };
