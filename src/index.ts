import Engine from "./@core/engine";

export default Engine;

// Author-facing types. Internal types (Tile, RawMap, GameMap, Loop, …) and
// helpers (map assembly, slicing) stay private to the engine.
export type {
  CreateGameProps,
  SoundConfig,
  Level,
  MapData,
  Entity,
  Player,
  Item,
  Dialogue,
  Choice,
  EngineState,
  EntityState,
  GlobalState,
  Location,
} from "./types";
