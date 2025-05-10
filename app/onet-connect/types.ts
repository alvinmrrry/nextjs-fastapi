export interface TileData {
  id: number; // Unique identifier for the tile
  value: number; // The type or "value" of the tile, used for matching
  image?: string; // Path to the image for this tile
  isMatched: boolean; // True if the tile has been successfully matched
  isSelected: boolean; // True if the tile is currently selected by the player
  row: number; // Row position on the board
  col: number; // Column position on the board
}

export interface Position {
  row: number;
  col: number;
}

// You can add more types here as the game develops, for example:
// export type GameMode = 'animals' | 'candies' | 'fruits';
// export interface GameState {
//   board: TileData[][];
//   score: number;
//   timeRemaining: number;
//   hintsRemaining: number;
//   shufflesRemaining: number;
//   currentMode: GameMode;
//   selectedTile: TileData | null;
//   isPaused: boolean;
//   isGameOver: boolean;
// }
