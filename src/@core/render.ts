import { EngineState, Tile, Entity } from "../types";
import { equals } from "../utilities/array";
import { getCurrentMapSlice } from "../utilities/map";
import { ATTENTION_ICON } from "./icons";

// Reveal dialogue text one character at a time over `durationMs`, then call
// `onDone`. Driving the reveal in JS (rather than a CSS width animation) means
// the text genuinely finishes when the last character lands — so the blip can
// stop exactly then, on lines of any length.
let typeTimer: ReturnType<typeof setInterval> | undefined;
const typeText = (
  container: HTMLElement,
  text: string,
  durationMs: number,
  onDone: () => void
) => {
  clearInterval(typeTimer);
  container.innerHTML = "<p></p>";
  const p = container.firstElementChild as HTMLElement;

  const chars = [...text];
  if (chars.length === 0) {
    onDone();
    return;
  }

  let i = 0;
  const step = () => {
    i += 1;
    p.textContent = chars.slice(0, i).join("");
    if (i >= chars.length) {
      clearInterval(typeTimer);
      typeTimer = undefined;
      onDone();
    }
  };

  step(); // first character immediately
  typeTimer = setInterval(step, durationMs / chars.length);
};

/** A persistent tile node plus references to its swappable children.
 *  Reused across frames so we never recreate the grid from scratch. */
type TileSlot = {
  li: HTMLLIElement;
  gImg: HTMLImageElement;
  fgImg: HTMLImageElement;
  topImg: HTMLImageElement;
  entityName: string | null;
  entityEl: HTMLElement | null;
};

type TilePool = {
  listEl: HTMLUListElement;
  slots: TileSlot[];
};

// One pool per inner element, so multiple engine instances stay isolated.
const poolRegistry = new WeakMap<HTMLElement, TilePool>();

const getTileClass = (tile: Tile): string => {
  if (tile?.fg?.includes("90deg-l")) {
    return "-vert-l";
  }
  if (tile?.fg?.includes("90deg-r")) {
    return "-vert-r";
  }
  return "";
};

const assetUrl = (base: string, name: string) => `${base}/img/${name}.svg`;

// Update a persistent tile image in place instead of recreating it.
const syncTileImage = (
  img: HTMLImageElement,
  asset: string | undefined,
  className: string,
  base: string
) => {
  if (asset) {
    const url = assetUrl(base, asset);
    if (img.getAttribute("src") !== url) {
      img.setAttribute("src", url);
    }
    if (img.className !== className) {
      img.className = className;
    }
    if (img.hidden) {
      img.hidden = false;
    }
  } else if (!img.hidden) {
    img.hidden = true;
  }
};

const createEntityEl = (entity: Entity, base: string): HTMLElement => {
  const el = document.createElement("div");
  el.className = `tile__entity ${entity.activeClasses.join(" ")}`;
  el.id = `entity-${entity.name}`;
  el.innerHTML = entity.markup;

  if (entity.interactive) {
    const img = document.createElement("img");
    img.className = "tile__bubble";
    img.src = ATTENTION_ICON;
    el.appendChild(img);
  }

  return el;
};

// Build the fixed grid of tile nodes once. Children are pre-created and
// hidden; later frames only flip `hidden` and swap `src`/classes.
const createTilePool = (innerEl: HTMLElement, size: number): TilePool => {
  const listEl = document.createElement("ul");
  listEl.className = "map";

  const slots: TileSlot[] = [];

  for (let i = 0; i < size; i++) {
    const li = document.createElement("li");
    li.className = "tile";

    const gImg = document.createElement("img");
    gImg.className = "tile__g";
    gImg.hidden = true;

    const fgImg = document.createElement("img");
    fgImg.className = "tile__fg";
    fgImg.hidden = true;

    const topImg = document.createElement("img");
    topImg.className = "tile__top";
    topImg.hidden = true;

    li.appendChild(gImg);
    li.appendChild(fgImg);
    li.appendChild(topImg);
    listEl.appendChild(li);

    slots.push({ li, gImg, fgImg, topImg, entityName: null, entityEl: null });
  }

  innerEl.appendChild(listEl);

  return { listEl, slots };
};

// Reconcile a single slot against the latest slice cell, touching the DOM
// only where the contents actually changed.
const syncTileSlot = (slot: TileSlot, tile: Tile, base: string) => {
  const className = !tile.g && !tile.fg && !tile.top ? "tile -empty" : "tile";
  if (slot.li.className !== className) {
    slot.li.className = className;
  }

  syncTileImage(slot.gImg, tile.g, "tile__g", base);
  syncTileImage(
    slot.fgImg,
    tile.fg,
    `tile__fg ${getTileClass(tile)}`.trim(),
    base
  );
  syncTileImage(slot.topImg, tile.top, "tile__top", base);

  const entity = tile.entity && !tile.entity.isHidden ? tile.entity : null;
  const entityName = entity ? entity.name : null;

  if (entityName !== slot.entityName) {
    if (slot.entityEl) {
      slot.li.removeChild(slot.entityEl);
      slot.entityEl = null;
    }
    if (entity) {
      slot.entityEl = createEntityEl(entity, base);
      slot.li.appendChild(slot.entityEl);
    }
    slot.entityName = entityName;
  }
};

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

    // Reuse a persistent grid of nodes and only mutate what changed, instead
    // of tearing down and rebuilding all 121 tiles on every tile-step.
    let pool = poolRegistry.get(innerEl);
    if (!pool) {
      pool = createTilePool(innerEl, mapSlice.length);
      poolRegistry.set(innerEl, pool);
    }

    for (let i = 0; i < mapSlice.length; i++) {
      syncTileSlot(pool.slots[i], mapSlice[i], state.assetPath);
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

    // Type the line in; stop the looping blip the moment the last char lands.
    typeText(
      dialogEl,
      state.dialogue.activeDialogue,
      state.dialogue.revealMs ?? 300,
      () => state.blipSound?.stop()
    );

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
        <img class="tile__g" src="${state.assetPath}/img/${item.asset}.svg" />
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
