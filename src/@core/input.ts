import { EngineState } from "../types";

/** Game Update Module
 * Called by the game loop, this module will
 * perform any state calculations / updates
 * to properly render the next frame.
 */

const allowedKeys = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Enter",
];

function gameInput(state: EngineState) {
  function downHandler({ key }: KeyboardEvent): void {
    // Check for action key
    if (key === "Enter" || key === "Spacebar") {
      state.keyDown = key;
      return;
    }

    // Check for run key
    if (key === "Shift") {
      state.shiftDown = true;
      return;
    }

    // Check for directional input
    if (!allowedKeys.includes(key)) {
      return;
    }
    state.arrowDown = key;
  }

  const upHandler = (): void => {
    state.keyDown = "";
    state.arrowDown = "";
    state.shiftDown = false;
    state.movementBlocked = false;
  };

  // Keyboard controls
  window.addEventListener("keydown", downHandler);
  window.addEventListener("keyup", upHandler);
}

export default gameInput;
