import { Entity, Level } from "../src";

/**
 * A tiny hand-built level for the in-repo example.
 *
 * Levels are authored as three layers of asset names (`ground`, `foreground`,
 * `top`), each a grid indexed `[y][x]`. The engine assembles them into its tile
 * grid on load — no helpers to import. We generate a 21x21 grass field enclosed
 * by a wall border, with a few trees and inner fences to bump into.
 */
const SIZE = 21;

const trees = new Set(["4,4", "6,5", "15,6", "8,13", "16,15", "13,16"]);
const fences = new Set(["9,9", "10,9", "11,9", "11,10", "11,11"]);

const ground: string[][] = [];
const foreground: string[][] = [];
const top: string[][] = [];

for (let y = 0; y < SIZE; y++) {
  ground[y] = [];
  foreground[y] = [];
  top[y] = [];
  for (let x = 0; x < SIZE; x++) {
    const isBorder = x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1;
    const key = `${x},${y}`;
    ground[y][x] = "grass";
    foreground[y][x] = isBorder ? "wall" : fences.has(key) ? "fence" : "";
    top[y][x] = trees.has(key) ? "tree" : "";
  }
}

const box: Entity = {
  name: "Box",
  location: [10, 13],
  interactive: true,
  markup: `<img class="gb" src="/assets/img/box-small.svg" />`,
  state: {},
  dialogue: [
    { text: "Hi there!" },
    { text: "Welcome to the tiny Boxworld example." },
    { text: "Use the arrow keys to explore. Bye!" },
  ],
};

const level: Level = {
  id: "garden",
  name: "Garden",
  entities: [box],
  ground,
  foreground,
  top,
};

export default level;
