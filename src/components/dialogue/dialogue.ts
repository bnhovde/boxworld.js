import "./styles.css";

import { EngineState } from "../../types";

function dialogue(state: EngineState) {
  if (!state) {
    return;
  }

  function zoom(direction: "in" | "out") {
    if (state.zoom === direction) {
      state.zoom = "";
      document.body.setAttribute("data-zoom", "");
      return;
    }

    state.zoom = direction;
    document.body.setAttribute("data-zoom", direction);
  }

  const dialogueMarkup = `
    <ul class="dialogue">
      <div class="dialogue__inner" id="dialogue-inner"></div>
    </ul>`;

  const container = document.createElement("div");
  container.innerHTML = dialogueMarkup;

  document.body.appendChild(container);

  // Attach functionality
  document.getElementById("dialogue-zoom-in").onclick = () => zoom("in");
  document.getElementById("dialogue-zoom-out").onclick = () => zoom("out");
}

export default dialogue;
