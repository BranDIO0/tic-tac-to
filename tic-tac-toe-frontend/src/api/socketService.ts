import type { GameState } from '../types';

type GameUpdateCallback = (game: GameState) => void;

export class GameSocket {
  private socket: WebSocket | null = null;
  private url: string;

  constructor(gameId: string) {
    // WebSocket URL gemäß Anforderung
    this.url = `ws://localhost:8080/ws/games/${gameId}`;
  }

  public connect(onUpdate: GameUpdateCallback) {
    if (this.socket) {
      this.socket.close();
    }

    console.log(`Verbinde zu WebSocket: ${this.url}`);
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("WebSocket verbunden ✅");
    };

    this.socket.onmessage = (event) => {
      try {
        // Der Server schickt das aktualisierte Game-Objekt als JSON
        const updatedGame: GameState = JSON.parse(event.data);
        onUpdate(updatedGame);
      } catch (e) {
        console.error("Fehler beim Verarbeiten der WebSocket-Nachricht:", e);
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket getrennt ❌");
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Fehler:", error);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}