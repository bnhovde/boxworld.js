import { Howl } from "howler";

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
  levels: Level[];
  currentLevel?: Level;
  blipSound?: Howl;
  walkSound?: Howl;
  successSound?: Howl;
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
};

export type DialogueState = {
  currentDialogue: string;
  activeDialogue: string;
  currentChoices: Choice[];
  currentChoiceIndex: number;
  activeChoiceIndex: number;
  isShowingChoiceResponse: boolean;
  updateInventory: boolean;
};

export type Level = {
  id: string;
  name: string;
  theme?: Howl;
  entities: Entity[];
  map: GameMap;
  groundTheme?: string;
};

export type CreateGameProps = {
  title: string;
  byline: string;
  startLevel: string;
  render: () => void;
  update: (state: EntityState) => void;
  selector?: string;
  levels: Level[];
  debug?: boolean;
};

export type Engine = {
  create: (config: CreateGameProps) => void;
  start: () => void;
};

export type Loop = {
  fps: number;
  main: (frame: number) => void;
  stopLoop: number;
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
