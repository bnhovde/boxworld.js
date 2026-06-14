/** Fixed-timestep game loop.
 *
 * The simulation advances in constant `1000 / targetFps` steps, decoupled from
 * the display's refresh rate, so movement runs at the same speed whether the
 * monitor is 30, 60 or 144 Hz. Rendering happens once per animation frame.
 *
 * (The previous loop gated `update` and `render` together behind
 * `elapsed > fpsInterval`, which dropped frames at 60 Hz and made the game
 * simulate at half speed — fixed here.) */
function gameLoop(
  update: (now: number) => void,
  render: () => void,
  targetFps: number
) {
  const step = 1000 / targetFps;
  const maxSteps = 5; // cap catch-up so we never spiral after a stall

  let last = performance.now();
  let accumulator = 0;
  let frame = 0;

  function main(now: number) {
    frame = window.requestAnimationFrame(main);

    accumulator += now - last;
    last = now;

    let steps = 0;
    while (accumulator >= step && steps < maxSteps) {
      update(now);
      accumulator -= step;
      steps++;
    }

    // If we fell far behind (e.g. the tab was backgrounded), drop the backlog
    // instead of replaying hundreds of steps at once.
    if (accumulator > step * maxSteps) {
      accumulator = 0;
    }

    render();
  }

  frame = window.requestAnimationFrame(main);

  return {
    stop: () => window.cancelAnimationFrame(frame),
  };
}

export default gameLoop;
