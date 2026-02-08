export type Player = {
    id: string; // Hier scheint der Server manchmal "id" und manchmal "playerId" zu nutzen, wir mappen das im Store
    name: string;
    symbol: 'X' | 'O';
  };
  
export type GameMode = 'PVP' | 'PVC';

export type GameStatus = 'WAITING_FOR_PLAYER' | 'IN_PROGRESS' | 'FINISHED';
  
export interface GameState {
  gameId: string;
  mode: GameMode;
  board: string[][];
  currentTurn: string;
  status: GameStatus;
  winner: string;
  // NEU: Damit wir den Ersteller-Namen anzeigen können
  createdBy?: {
      playerId: string;
      name: string;
  };
}

// Für Erweiterung 9 (Lokale Historie) 
export interface LocalGameRecord {
  gameId: string;
  opponent: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  timestamp: number;
}