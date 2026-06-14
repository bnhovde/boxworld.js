// Tiny isolated example, built straight from engine source in ../src.
import "../src/@core/styles.css";

import Engine, { EngineState } from "../src";

import gardenLevel from "./level";

window.addEventListener("load", () => {
  const update = (_state: EngineState) => {
    // Single-level demo: nothing extra to coordinate here.
  };

  const render = () => {};

  const game = Engine({
    title: "Boxworld",
    byline: "Tiny example",
    render,
    update,
    startLevel: "garden",
    levels: [gardenLevel],
    selector: "app",
  });

  game.addPlayer({
    asset: "player",
    state: {},
  });
});
