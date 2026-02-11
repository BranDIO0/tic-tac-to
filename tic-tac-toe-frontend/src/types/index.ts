export type Player = {
    id: string; 
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
  createdBy?: {
      playerId: string;
      name: string;
  };
}

export interface LocalGameRecord {
  gameId: string;
  opponent: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  timestamp: number;
}