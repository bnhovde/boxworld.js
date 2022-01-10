import "./styles.css";

import { EngineState } from "../../types";

function controls(state: EngineState) {
  if (!state) {
    return;
  }

  function zoom(direction: "in" | "out") {
    if (state.zoom === direction) {
      state.currentClasses = state.currentClasses.filter(
        (c) => !c.includes("-zoom")
      );
      return;
    }

    state.zoom = direction;
    state.currentClasses.push(`-zoom-${direction}`);
  }

  const controlsMarkup = `
    <ul class="controls" id="controls">
      <button class="button" id="controls-zoom-in">Zoom In</button>
      <button class="button" id="controls-zoom-out">Zoom Out</button>
    </ul>`;

  const container = document.createElement("div");
  container.innerHTML = controlsMarkup;

  document.body.appendChild(container);

  // Attach functionality
  document.getElementById("controls-zoom-in").onclick = () => zoom("in");
  document.getElementById("controls-zoom-out").onclick = () => zoom("out");
}

export default controls;
