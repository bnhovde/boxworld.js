import {
  CreateGameProps,
  EngineState,
  Entity,
  RuntimeLevel,
  Location,
  Player,
  Item,
  GlobalState,
  DialogueState,
} from "../types";

import { createSound } from "./audio";
import { assembleLayers } from "../utilities/map";
import gameLoop from "./loop";
import gameInput from "./input";
import gameDialogue from "./dialogue";
import gameUpdate from "./update";
import gameRender from "./render";

let warnedNoSamples = false;
const warnNoSamples = () => {
  if (warnedNoSamples) return;
  warnedNoSamples = true;
  console.warn(
    "[boxworld] No sound effects loaded. Host walk.mp3, success.mp3 and " +
      "blip.mp3 under your assetPath (e.g. /assets/audio/), or pass them via " +
      "the `sounds` option. Sample files are in the boxworld example game " +
      "(example/assets/audio)."
  );
};

function Engine(props: CreateGameProps) {
  let game;

  // Instantiate an empty state object
  const state: EngineState = {
    initialised: false,
    keyDown: "",
    arrowDown: "",
    direction: "",
    zoom: "",
    globalState: {} as GlobalState,
    inventory: [] as Item[],
    directionProgress: 0,
    needRender: true,
    dialogue: {} as DialogueState,
    shiftDown: false,
    showActionTip: false,
    outsideBounds: "",
    movementBlocked: false,
    forceMapRender: false,
    currentLevel: undefined,
    debug: props.debug,
    levels: [] as RuntimeLevel[],
    walkSound: undefined,
    blipSound: undefined,
    successSound: undefined,
    themeSound: undefined,
    currentClasses: [] as string[],
    activeClasses: [] as string[],
    player: undefined as Player,
    activeEntity: undefined as Entity,
    mapOffset: [0, 0],
    nextMapOffset: [0, 0],
    containerEl: props.selector || "app",
    assetPath: props.assetPath ?? "/assets",
  };

  // Setup the DOM
  const containerEl = document.getElementById(state.containerEl);
  const markup = `
    <main class="screen" id="screen">
      <div class="scene">
        <div class="plane" id="plane">
          <div class="plane__inner" id="inner"></div>
          <div class="plane__elements" id="elements"></div>
          <div class="ground">
            <div class="ground__base"></div>
            <div class="ground__foreground"></div>
          </div>
        </div>
      </div>
      <div class="debug" id="debug"></div>
      <div id="controls"></div>
      <div id="inventory"></div>
      <div class="overlay game-over-overlay" id="game-over-overlay">
        <h2>You did it!</h2>
        <p>GAME OVER</p>
      </div>
      <div class="overlay game-start-overlay" id="game-start-overlay">
        <h1>${props.title}</h1>
        <p>${props.byline}</p>
        <button id="start" type="button">START</button>
        <small class="controls-guide">
          <p>Controls: Arrow keys + [ENTER]</p>
          <p>(Sound enabled)</p>
        </small>
      </div>
    </main>
  `;
  containerEl.innerHTML = markup;
  const debugEl = document.getElementById("debug");
  const innerEl = document.getElementById("inner");
  const elementsEl = document.getElementById("elements");
  const startButton = document.getElementById("start");
  const startOverlay = document.getElementById("game-start-overlay");

  startButton.onclick = () => {
    if (!state.initialised) {
      setLevel(props.startLevel);
      startOverlay.classList.add("-hide");
    }
  };

  // Keyboard Input
  gameInput(state);

  // Dialogue logic
  const dialogue = gameDialogue();
  dialogue.initialize();

  // Sounds — hosted by the game like every other asset. By convention they live
  // at `${assetPath}/audio/{walk,success,blip}.mp3`; the `sounds` option can
  // point any of them elsewhere. Nothing audio ships in the engine itself.
  const sounds = props.sounds ?? {};
  const audioBase = `${state.assetPath}/audio`;

  let settled = 0;
  let loadedAny = false;
  const trackLoad = (loaded: boolean) => {
    if (loaded) loadedAny = true;
    if (++settled === 3 && !loadedAny) {
      warnNoSamples();
    }
  };

  state.walkSound = createSound(sounds.walk ?? `${audioBase}/walk.mp3`, {
    loop: true,
    volume: 0.6,
    onResolved: trackLoad,
  });
  state.successSound = createSound(sounds.success ?? `${audioBase}/success.mp3`, {
    volume: 0.6,
    onResolved: trackLoad,
  });
  state.blipSound = createSound(sounds.blip ?? `${audioBase}/blip.mp3`, {
    loop: true, // looped while a line types in, stopped when it finishes
    volume: 0.3,
    onResolved: trackLoad,
  });

  // Setup levels — assemble each level's layers into its tile grid up front.
  state.levels = props.levels.map((level) => ({
    ...level,
    map: assembleLayers(level.ground, level.foreground, level.top),
    entities: level.entities.map((entity) => ({
      ...entity,
      isActive: false,
      isNear: false,
      activeClasses: [] as string[],
      currentClasses: [] as string[],
    })),
  }));

  // Add entity func
  const addEntity = (entity: Entity, levelId: string) => {
    const level = state.levels.find((l) => l.id === levelId);

    if (level) {
      level.entities.push({
        ...entity,
        isActive: false,
        isNear: false,
        activeClasses: [] as string[],
        currentClasses: [] as string[],
      });
    }
  };

  // Add entity func
  const addPlayer = (player: Player) => {
    const markup = `
      <div class="player" id="player">
        <div class="player-inner">
          <img src="${state.assetPath}/img/${player.asset}.svg" />
        </div>
      </div>
    `;
    elementsEl.insertAdjacentHTML("beforeend", markup);
    const playerEl = document.getElementById("player");

    state.player = {
      ...player,
      element: playerEl,
    };
  };

  // Set level func
  const setLevel = (levelId: string, offset?: Location) => {
    const match = state.levels.find((l) => l.id === levelId);

    if (!match) {
      return;
    }

    // Determine offset (center of the map by default)
    const mapSize = match.map.length;
    const offsetX = offset ? offset[0] : (mapSize - 1) / 2;
    const offsetY = offset ? offset[1] : (mapSize - 1) / 2;

    // Stop previous theme if playing
    state.themeSound?.stop();

    // Set new level
    state.currentLevel = match;
    state.nextMapOffset = [offsetX, offsetY];
    state.outsideBounds = "";
    state.needRender = true;

    // Set ground theme
    if (match.groundTheme) {
      state.currentClasses = state.currentClasses.filter(
        (c) => !c.includes("-theme-")
      );
      state.currentClasses.push(`-theme-${match.groundTheme}`);
    }

    // Start background music if the level defines one
    if (match.theme) {
      state.themeSound = createSound(
        `${state.assetPath}/audio/${match.theme}.mp3`,
        { loop: true }
      );
      state.themeSound.play();
    } else {
      state.themeSound = undefined;
    }
  };

  const gameOver = () => {
    const overlay = document.getElementById("game-over-overlay");
    overlay.classList.add("-visible");
  };

  // Game object return
  game = {
    state,
    update: props.update,
    render: props.render,
    setLevel: setLevel,
    addPlayer: addPlayer,
    addEntity: addEntity,
    gameOver: gameOver,
  };

  // Internal update
  const update = (now: number) => {
    gameUpdate(state, now);
    dialogue.update(state);
    props.update(state);
  };

  // Internal render
  const render = () => {
    gameRender(state, innerEl, debugEl);
    props.render();
  };

  // Attach core functionality
  gameLoop(update, render, 60);

  // Debug
  if (state.debug) {
    setLevel(props.startLevel);
    startOverlay.classList.add("-hide");
  }

  return game;
}

export default Engine;
