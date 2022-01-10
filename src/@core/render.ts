import { EngineState, Tile } from "../types";
import { equals } from "../utilities/array";
import { getCurrentMapSlice } from "../utilities/map";

function gameRender(
  state: EngineState,
  innerEl: HTMLElement,
  debugEl: HTMLElement
) {
  if (state.debug) {
    debugEl.innerHTML = `Level: ${state.currentLevel?.name}, Offset: ${state.mapOffset}, Key: ${state.keyDown}, Direction: ${state.direction}, Progress: ${state.directionProgress}`;
  }

  if (!state.needRender || !state.currentLevel || !state.player) {
    return;
  }

  // Update global classes
  if (!equals(state.activeClasses, state.currentClasses)) {
    state.activeClasses = [...state.currentClasses];
    document.body.className = state.activeClasses.join(" ");
  }

  // Animate map
  const isHorizontal =
    state.direction === "ArrowUp" || state.direction === "ArrowDown";

  const key = isHorizontal ? "translateY" : "translateX";
  const dir =
    state.direction === "ArrowRight" || state.direction === "ArrowDown"
      ? "* -1"
      : "";
  const value = `calc(${state.directionProgress || 0}% / 11${dir})`;
  innerEl.style.transform = `${key}(${value})`;

  if (state.direction) {
    innerEl.setAttribute("data-moving", state.direction);
    state.player.element.classList.add("-moving");
  } else {
    innerEl.setAttribute("data-moving", "");
    state.player.element.classList.remove("-moving");
  }

  // Check if map needs updating
  if (
    !state.initialised ||
    state.forceMapRender ||
    state.mapOffset[0] !== state.nextMapOffset[0] ||
    state.mapOffset[1] !== state.nextMapOffset[1]
  ) {
    state.mapOffset = [...state.nextMapOffset];

    const mapSlice = getCurrentMapSlice(
      state.mapOffset[0],
      state.mapOffset[1],
      state.currentLevel.map,
      state.currentLevel.entities
    );

    const getTileClass = (tile: Tile) => {
      if (tile?.fg?.includes("90deg-l")) {
        return "-vert-l";
      }
      if (tile?.fg?.includes("90deg-r")) {
        return "-vert-r";
      }
      return "";
    };

    // Create map fragment
    const mapFragment = document.createDocumentFragment();
    const listEl = document.createElement("ul");
    listEl.classList.add("map");

    // Append tiles
    for (let x = 0; x < mapSlice.length; x++) {
      const tile = mapSlice[x];
      const tileEl = document.createElement("li");
      tileEl.className = `tile ${
        !tile.g && !tile.fg && !tile.top ? "-empty" : ""
      }`;

      if (tile.g) {
        const el = document.createElement("img");
        el.className = "tile__g";
        el.src = `/assets/img/${tile.g}.svg`;
        tileEl.appendChild(el);
      }

      if (tile.fg) {
        const el = document.createElement("img");
        el.className = `tile__fg ${getTileClass(tile)}`;
        el.src = `/assets/img/${tile.fg}.svg`;
        tileEl.appendChild(el);
      }

      if (tile.top) {
        const el = document.createElement("img");
        el.className = "tile__top";
        el.src = `/assets/img/${tile.top}.svg`;
        tileEl.appendChild(el);
      }

      if (tile.entity && !tile.entity.isHidden) {
        const el = document.createElement("div");
        el.className = `tile__entity ${tile.entity.activeClasses.join(" ")}`;
        el.id = `entity-${tile.entity.name}`;

        el.innerHTML = tile.entity.markup;

        if (tile.entity.interactive) {
          const img = document.createElement("img");
          img.className = "tile__bubble";
          img.src = "/assets/img/attention.svg";
          el.appendChild(img);
        }

        tileEl.appendChild(el);
      }

      if (state.debug) {
        const el = document.createElement("p");
        el.className = `tile__debug`;
        el.innerText = tile.id;
      }

      listEl.appendChild(tileEl);
    }

    mapFragment.appendChild(listEl);

    // Add to DOM
    if (state.initialised) {
      innerEl.replaceChild(mapFragment, innerEl.firstElementChild);
    } else {
      innerEl.appendChild(mapFragment);
    }

    state.forceMapRender = false;
  }

  // Update all entities
  for (const entity of state.currentLevel.entities) {
    // Update classes
    if (!equals(entity.activeClasses, entity.currentClasses)) {
      entity.activeClasses = [...entity.currentClasses];

      const entityEl = document.getElementById(`entity-${entity.name}`);
      entityEl.className = `tile__entity ${entity.activeClasses.join(" ")}`;
    }

    entity.render && entity.render(entity, state);
  }

  // Update dialogue
  if (state.dialogue.currentDialogue !== state.dialogue.activeDialogue) {
    state.dialogue.activeDialogue = state.dialogue.currentDialogue;

    const nameEl = document.getElementById("dialogue-name");
    const dialogEl = document.getElementById("dialogue-text");
    const choicesEl = document.getElementById("dialogue-choices");

    nameEl.innerText = state.activeEntity?.name;
    dialogEl.innerHTML = `<p>${state.dialogue.activeDialogue}</p>`;

    if (
      state.dialogue.currentChoices &&
      state.dialogue.currentChoices.length > 0
    ) {
      const choicesMarkup = `
        <ul class="choices">
        ${state.dialogue.currentChoices
          .map((choice, index) =>
            `
          <li class="choices__item ${
            state.dialogue.activeChoiceIndex === index ? "-active" : ""
          }">
            <p>${choice.text}</p>
          </li>
          `.trim()
          )
          .join("")}
          </ul>
        `;

      choicesEl.innerHTML = choicesMarkup;
    }
  }

  // Update choices
  if (state.dialogue.activeChoiceIndex !== state.dialogue.currentChoiceIndex) {
    state.dialogue.activeChoiceIndex = state.dialogue.currentChoiceIndex;

    const choicesEl = document.getElementById("dialogue-choices");

    if (
      state.dialogue.currentChoices &&
      state.dialogue.currentChoices.length > 0
    ) {
      const choicesMarkup = `
        <ul class="choices">
        ${state.dialogue.currentChoices
          .map((choice, index) =>
            `
          <li class="choices__item ${
            state.dialogue.activeChoiceIndex === index ? "-active" : ""
          }">
            <p>${choice.text}</p>
          </li>
          `.trim()
          )
          .join("")}
          </ul>
        `;

      choicesEl.innerHTML = choicesMarkup;
    } else {
      choicesEl.innerHTML = "";
    }
  }

  state.needRender = false;

  if (!state.initialised) {
    state.initialised = true;
  }

  // Update inventory
  if (state.dialogue.updateInventory) {
    const inventoryEl = document.getElementById("inventory");

    const inventoryMarkup = `
    <ul class="inventory">
    ${state.inventory
      .map((item) =>
        `
      <li class="inventory__item">
        <img class="tile__g" src="/assets/img/${item.asset}.svg" />
      </li>
      `.trim()
      )
      .join("")}
      </ul>
    `;
    inventoryEl.innerHTML = inventoryMarkup;
  }
}

export default gameRender;
