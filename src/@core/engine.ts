import { Howl, Howler } from "howler";
import {
  CreateGameProps,
  EngineState,
  Entity,
  Level,
  Location,
  Player,
  Item,
  GlobalState,
  DialogueState,
} from "../types";

import gameLoop from "./loop";
import gameInput from "./input";
import gameDialogue from "./dialogue";
import gameUpdate from "./update";
import gameRender from "./render";

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
    levels: [] as Level[],
    walkSound: undefined as Howl,
    blipSound: undefined as Howl,
    successSound: undefined as Howl,
    currentClasses: [] as string[],
    activeClasses: [] as string[],
    player: undefined as Player,
    activeEntity: undefined as Entity,
    mapOffset: [0, 0],
    nextMapOffset: [0, 0],
    containerEl: props.selector || "app",
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

  // Sounds
  state.walkSound = new Howl({
    loop: true,
    volume: 0.6,
    src: ["/assets/audio/walk.mp3"],
  });

  state.successSound = new Howl({
    volume: 0.6,
    src: ["/assets/audio/success.mp3"],
  });

  state.blipSound = new Howl({
    src: ["/assets/audio/text.mp3"],
    sprite: {
      short: [0, 400],
      regular: [400, 900],
      long: [2200, 2500],
    },
    volume: 0.3,
  });

  // Setup levels
  state.levels = props.levels.map((level) => ({
    ...level,
    entities: level.entities.map((entity) => ({
      ...entity,
      isActive: false,
      isNear: false,
      activeClasses: [],
      currentClasses: [],
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
        activeClasses: [],
        currentClasses: [],
      });
    }
  };

  // Add entity func
  const addPlayer = (player: Player) => {
    const markup = `
      <div class="player" id="player">
        <div class="player-inner">
          <img src="/assets/img/${player.asset}.svg" />
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

    // Determine offset
    const offsetX = offset ? offset[0] : (match.map.length - 1) / 2;
    const offsetY = offset ? offset[1] : (match.map.length - 1) / 2;

    if (match) {
      // Stop previous theme if exists
      if (state.currentLevel && state.currentLevel.theme) {
        state.currentLevel.theme.stop();
      }

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

      // Start theme if exists
      if (match.theme) {
        match.theme.play();
      }
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
