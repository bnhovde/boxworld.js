import "./styles.css";

import Engine from "./@core/engine";

import startLevel from "./levels/start";
import eastLevel from "./levels/east";
import westLevel from "./levels/west";
import northLevel from "./levels/north";
import southLevel from "./levels/south";

import { EngineState } from "./types";

window.addEventListener("load", () => {
  const update = (state: EngineState) => {
    // Check if we need to change maps
    if (state.outsideBounds) {
      if (state.currentLevel.id === "start") {
        if (state.outsideBounds === "r") {
          game.setLevel("east", [1, 5]);
        }
        if (state.outsideBounds === "l") {
          game.setLevel("west", [9, 5]);
        }
        if (state.outsideBounds === "d") {
          game.setLevel("south", [5, 5]);
        }
        if (state.outsideBounds === "u") {
          game.setLevel("north", [5, 9]);
        }
      } else if (state.currentLevel.id === "east") {
        game.setLevel("start", [31, 15]);
      } else if (state.currentLevel.id === "west") {
        game.setLevel("start", [1, 17]);
      } else if (state.currentLevel.id === "north") {
        game.setLevel("start", [17, 1]);
      } else if (state.currentLevel.id === "south") {
        game.setLevel("start", [21, 31]);
      }
    }
    if (state.globalState.gameOver && !state.globalState.isEnded) {
      state.globalState.isEnded = true;
      game.gameOver();
    }
  };

  const render = () => {
    // console.log("tick!");
  };

  // Create game object
  const game = Engine({
    title: "Boxworld 1",
    byline: "Finlay In Trouble",
    render,
    update,
    startLevel: "start",
    levels: [startLevel, eastLevel, westLevel, southLevel, northLevel],
    selector: "app",
    // debug: true,
  });

  // Add player
  game.addPlayer({
    asset: "j",
    state: {
      isTalking: false,
    },
  });
});
