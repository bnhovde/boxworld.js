import { Sound } from "./@core/audio";

export type Location = number[];

export type EngineState = {
  initialised: boolean;
  keyDown: string;
  arrowDown: string;
  shiftDown: boolean;
  direction: string;
  zoom: string;
  debug: boolean;
  globalState: GlobalState;
  inventory: Item[];
  dialogue?: DialogueState;
  currentClasses: string[];
  activeClasses: string[];
  directionProgress: number;
  player: Player | undefined;
  levels: RuntimeLevel[];
  currentLevel?: RuntimeLevel;
  blipSound?: Sound;
  walkSound?: Sound;
  successSound?: Sound;
  themeSound?: Sound;
  activeEntity?: Entity;
  activeEntityDialogue?: number;
  needRender: boolean;
  movementBlocked: boolean;
  forceMapRender: boolean;
  showActionTip: boolean;
  outsideBounds: string;
  mapOffset: Location;
  nextMapOffset: Location;
  containerEl: string;
  assetPath: string;
};

export type DialogueState = {
  currentDialogue: string;
  activeDialogue: string;
  currentChoices: Choice[];
  currentChoiceIndex: number;
  activeChoiceIndex: number;
  isShowingChoiceResponse: boolean;
  updateInventory: boolean;
  /** How long the current line takes to type in, in ms (scales with length). */
  revealMs?: number;
};

/** A grid of asset names. Either a single 11x11 screen (`string[][]`) or a
 *  grid-of-screens for larger maps (`string[][][][]`). */
export type MapData = RawMapSmall | RawMap;

export type Level = {
  id: string;
  name: string;
  entities: Entity[];
  /** Ground layer (laid flat). */
  ground: MapData;
  /** Raised layer — `wall`/`fence`/`stem` tiles block movement. */
  foreground?: MapData;
  /** Top layer, rendered above the foreground. */
  top?: MapData;
  /** Background music asset name, resolved under `${assetPath}/audio/`. Loops. */
  theme?: string;
  groundTheme?: string;
};

/** @internal A level after the engine has assembled its tile grid. */
export type RuntimeLevel = Level & { map: GameMap };

export type CreateGameProps = {
  title: string;
  byline: string;
  startLevel: string;
  render: () => void;
  update: (state: EngineState) => void;
  selector?: string;
  levels: Level[];
  debug?: boolean;
  /** Base URL where game img/ and audio/ assets are hosted. Defaults to "/assets". */
  assetPath?: string;
  /** Override the built-in synthesized sound effects with your own audio files. */
  sounds?: SoundConfig;
};

export type SoundConfig = {
  /** Looping footstep while moving. */
  walk?: string;
  /** Played on rewards / item pickups. */
  success?: string;
  /** Played once per dialogue line. */
  blip?: string;
};

export type GlobalState = {
  [key: string]: any;
};

export type EntityState = {
  [key: string]: any;
};

export type Item = {
  id: string;
  name: string;
  asset: string;
};

export type Choice = {
  text: string;
  class?: string;
  reward?: Item;
  response?: Dialogue;
};

export type Dialogue = {
  text: string;
  class?: string;
  choices?: Choice[];
  reward?: Item;
  condition?: (state: EntityState) => boolean;
  onSelect?: (state: EntityState, gameState: EngineState) => void;
};

export type Entity = {
  name: string;
  location: Location;
  markup: string;
  isNear?: boolean;
  isActive?: boolean;
  isHidden?: boolean;
  hasInteracted?: boolean;
  currentClasses?: string[];
  activeClasses?: string[];
  state: EntityState;
  dialogue?: Dialogue[];
  interactive?: boolean;
  element?: HTMLElement;
  update?: (entity: Entity, gameState: EngineState) => void;
  render?: (entity: Entity, gameState: EngineState) => void;
};

export type Player = {
  asset: string;
  element?: HTMLElement;
  state?: EntityState;
};

// --- Internal types (not part of the public API) ---

export type Tile = {
  id: string;
  id2?: string;
  g?: string;
  fg?: string;
  top?: string;
  entity?: Entity;
};
export type RawMap = string[][][][];
export type RawMapSmall = string[][];
export type GameMap = Tile[][];
export type SlicedMap = Tile[];
