import { Loop } from "../types";

function gameLoop(
  update: (now: number) => void,
  render: () => void,
  targetFps: number
) {
  const loop = {} as Loop;

  // Initialize timer variables so we can calculate FPS
  const fps = targetFps;
  const fpsInterval = 1000 / fps;

  let before = window.performance.now();
  let cycles = {
      new: {
        frameCount: 0,
        startTime: before,
        sinceStart: 0,
      },
      old: {
        frameCount: 0,
        startTime: before,
        sinceStart: 0,
      },
    },
    resetInterval = 5;

  let resetState = "new" as "new" | "old";

  loop.fps = 0;

  // Main game rendering loop
  loop.main = function mainLoop(tframe: number) {
    // Request a new Animation Frame
    // setting to `stopLoop` so animation can be stopped via
    // `window.cancelAnimationFrame( loop.stopLoop )`
    loop.stopLoop = window.requestAnimationFrame(loop.main);

    // How long ago since last loop?
    var now = tframe,
      elapsed = now - before,
      activeCycle,
      targetResetInterval;

    // If it's been at least our desired interval, render
    if (elapsed > fpsInterval) {
      // Set before = now for next frame, also adjust for
      // specified fpsInterval not being a multiple of rAF's interval (16.7ms)
      // ( http://stackoverflow.com/a/19772220 )
      before = now - (elapsed % fpsInterval);

      // Increment the vals for both the active and the alternate FPS calculations
      cycles.old.frameCount++;
      cycles.new.frameCount++;
      cycles.old.sinceStart = now - cycles.old.startTime;
      cycles.new.sinceStart = now - cycles.new.startTime;

      // Choose the correct FPS calculation, then update the exposed fps value
      activeCycle = cycles[resetState];
      loop.fps =
        Math.round(
          (1000 / (activeCycle.sinceStart / activeCycle.frameCount)) * 100
        ) / 100;

      // If our frame counts are equal....
      targetResetInterval =
        cycles.new.frameCount === cycles.old.frameCount
          ? resetInterval * fps // Wait our interval
          : resetInterval * 2 * fps; // Wait double our interval

      // If the active calculation goes over our specified interval,
      // reset it to 0 and flag our alternate calculation to be active
      // for the next series of animations.
      if (activeCycle.frameCount > targetResetInterval) {
        cycles[resetState].frameCount = 0;
        cycles[resetState].startTime = now;
        cycles[resetState].sinceStart = 0;

        resetState = resetState === "new" ? "old" : "new";
      }

      // Update the game state
      update(now);

      // Render the next frame
      render();
    }
  };

  // Start off main loop
  loop.main(0);

  return loop;
}

export default gameLoop;
