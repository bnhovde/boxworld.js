import { EngineState } from "../types";
import { between } from "../utilities/math";
import { getIncrement } from "../utilities/map";

/** Game Update Module
 * Called by the game loop, this module will
 * perform any state calculations / updates
 * to properly render the next frame.
 */
function gameUpdate(state: EngineState, now: number) {
  if (!state.currentLevel) {
    return;
  }

  if (
    state.arrowDown &&
    !state.direction &&
    !state.movementBlocked &&
    !state.activeEntity
  ) {
    state.direction = state.arrowDown;
    state.walkSound.play();
  }

  // Check if direction
  if (state.direction) {
    // Check if direction blocked
    if (state.directionProgress === 0) {
      const increment = getIncrement(state.direction);
      const nextTile = [
        state.mapOffset[0] + increment.x,
        state.mapOffset[1] + increment.y,
      ];
      const nextTileObj = state.currentLevel.map?.[nextTile[1]]?.[nextTile[0]];
      const tileBlock =
        nextTileObj?.fg?.includes("wall") ||
        nextTileObj?.fg?.includes("stem") ||
        nextTileObj?.fg?.includes("fence");

      if (
        state.currentLevel.entities.find(
          (e) => e.location.toString() === nextTile.toString()
        ) ||
        tileBlock
      ) {
        state.movementBlocked = true;
        state.keyDown = "";
        state.direction = "";
        state.walkSound.stop();
        state.player.element.classList.remove("-moving");
      }
    }

    if (!state.movementBlocked) {
      const increment = state.shiftDown ? 10 : state.debug ? 20 : 6;
      state.needRender = true;
      state.directionProgress = state.directionProgress + increment;

      if (state.directionProgress > 100) {
        // Progress map
        const increment = getIncrement(state.direction);

        state.nextMapOffset = [
          state.mapOffset[0] + increment.x,
          state.mapOffset[1] + increment.y,
        ];

        // Reset progress
        state.directionProgress = 0;

        // Check if we're outside level
        const or = state.mapOffset[0] >= state.currentLevel.map.length - 1;
        const ol = state.mapOffset[0] <= 0;
        const ot = state.mapOffset[1] <= 0;
        const ob = state.mapOffset[1] >= state.currentLevel.map.length;

        if (or || ol || ot || ob) {
          state.outsideBounds = ol ? "l" : or ? "r" : ot ? "u" : "d";
        }

        // Reset direction if key not pressed
        if (state.direction !== state.arrowDown) {
          state.direction = "";
          state.directionProgress = 0;
          state.walkSound.stop();
        }
      }
    }
  }

  // Update all entities
  for (const entity of state.currentLevel.entities) {
    const isCloseX = between(
      state.nextMapOffset[0],
      entity.location[0] - 1,
      entity.location[0] + 1
    );
    const isCloseY = between(
      state.nextMapOffset[1],
      entity.location[1] - 1,
      entity.location[1] + 1
    );

    const isNear = isCloseX && isCloseY;
    const isActive = entity.name === state.activeEntity?.name;

    if (isActive !== entity.isActive) {
      state.needRender = true;
      entity.currentClasses = entity.currentClasses.filter(
        (c) => !c.includes("-active")
      );

      entity.isActive = isActive;
      if (isActive) {
        entity.currentClasses.push("-active");
      }
    }

    // Near has changed
    if (isNear !== entity.isNear) {
      state.needRender = true;
      entity.currentClasses = entity.currentClasses.filter(
        (c) => !c.includes("-near")
      );

      entity.isNear = isNear;
      if (isNear) {
        entity.currentClasses.push("-near");
      }

      if (!state.showActionTip && entity.isNear) {
        state.showActionTip = true;
      }
    }

    entity.update && entity.update(entity, state);
  }
}

export default gameUpdate;
