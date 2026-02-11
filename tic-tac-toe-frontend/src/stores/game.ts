import { defineStore } from 'pinia';
import httpClient from '../api/httpClient';
import { GameSocket } from '../api/socketService'; 
import type { GameState, GameMode } from '../types';

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null as GameState | null,
    availableGames: [] as GameState[],
    isLoading: false,
    error: null as string | null,
    socket: null as GameSocket | null, // Referenz auf den Socket
    stats: { wins: 0, losses: 0, draws: 0 },
  }),

  actions: {
    async fetchAvailableGames() {
      this.isLoading = true;

      try {
        const response = await httpClient.get('/games', {
          params: { mode: 'PVP', status: 'WAITING_FOR_PLAYER' }
        });
        
        // Der Server wickelt die Liste in ein "games" Objekt ein!
        // Wir prüfen sicherheitshalber, ob .games existiert.
        if (response.data.games) {
            this.availableGames = response.data.games;
        } else if (Array.isArray(response.data)) {
            // Falls der Server es doch mal direkt schickt (Fallback)
            this.availableGames = response.data;
        } else {
            this.availableGames = [];
        }
        
      } catch (e) {
        console.error("Fehler beim Laden:", e);
      } finally {
        this.isLoading = false;
      }
    },

    loadStats() {
      const s = localStorage.getItem('tictacgo_stats');
      if (s) {
        try {
          this.stats = JSON.parse(s);
        } catch (e) { console.error("Stats parse error", e); }
      }
    },

    updateLocalStats(game: GameState) {
      if (!game.winner) return;
      
      const playerId = localStorage.getItem('playerId');
      let mySymbol = 'X'; // Standard für PVC oder Ersteller
      if (game.mode === 'PVP' && game.createdBy && game.createdBy.playerId !== playerId) {
        mySymbol = 'O';
      }
      
      if (game.winner === 'DRAW') {
        this.stats.draws++;
      } else if (game.winner === mySymbol) {
        this.stats.wins++;
      } else {
        this.stats.losses++;
      }
      localStorage.setItem('tictacgo_stats', JSON.stringify(this.stats));
    },

    async createGame(mode: GameMode) {
      this.isLoading = true;
      try {
        const response = await httpClient.post('/games', { mode });
        const data = response.data;
        this.currentGame = data;
        // FIX: Wir merken uns lokal, dass wir der Ersteller (X) sind
        localStorage.setItem(`role_${data.gameId}`, 'X');
        return data.gameId;
      } catch (e) {
        this.error = "Konnte Spiel nicht erstellen.";
        throw e;
      } finally {
        this.isLoading = false;
      }
    },

    async joinGame(gameId: string) {
      this.isLoading = true;
      try {
        const response = await httpClient.post(`/games/${gameId}/join`);
        const data = response.data;
        this.currentGame = data;
        // FIX: Wir merken uns lokal, dass wir der Beitretende (O) sind
        localStorage.setItem(`role_${data.gameId}`, 'O');
        return data.gameId;
      } catch (e) {
        this.error = "Konnte Spiel nicht beitreten.";
        throw e;
      } finally {
        this.isLoading = false;
      }
    },

    async makeMove(row: number, col: number) {
      if (!this.currentGame) return;

      try {
        const payload = {
            row: parseInt(row.toString()), 
            col: parseInt(col.toString())
        };

        const playerId = localStorage.getItem('playerId');
        console.log(`Sende Zug als Spieler ${playerId}:`, payload);

        // Wir senden den Header hier MANUELL mit, um sicherzugehen.
        // Wir nutzen exakt die Schreibweise aus dem Bash-Script: "X-Player-Id"
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'X-Player-Id': playerId 
            }
        };

        // Post Request mit expliziter Config
        await httpClient.post(
            `/games/${this.currentGame.gameId}/moves`, 
            payload, 
            config
        );
        
        // Kein manuelles Update nötig, WebSocket übernimmt
        
      } catch (e: any) {
        console.error("Fehler beim Zug:", e);
        if (e.response) {
            // Fehler im State speichern statt alert()
            let msg = "Zug verweigert";
            if (e.response.data && e.response.data.message) {
                msg = e.response.data.message;
            }
            this.error = msg;
        }
      }
    },

    // Einzelnes Spiel laden (Initial)
    async fetchGame(gameId: string) {
      try {
        const response = await httpClient.get(`/games/${gameId}`);
        this.currentGame = response.data;
      } catch (e) {
        this.error = "Spiel nicht gefunden.";
      }
    },

    // WebSocket Verbindung starten
    connectToGame(gameId: string) {
      // Alten Socket schließen, falls vorhanden
      if (this.socket) {
        this.socket.disconnect();
      }

      // Neuen Socket erstellen
      this.socket = new GameSocket(gameId);
      
      // Verbinden und Callback definieren: Was passiert bei Updates?
      this.socket.connect((message: any) => {
        // Zeigt genau, was vom Server kommt
        console.log("WebSocket Update empfangen:", message);

        let updateData = message;

        const oldStatus = this.currentGame?.status;

        // 1. Unwrapping: Falls der Server { type: 'state', payload: ... } sendet
        if (message && message.type === 'state' && message.payload) {
            updateData = message.payload;
        }

        // 2. Merging: Wir aktualisieren nur die Felder, die im Update enthalten sind
        if (this.currentGame) {
            this.currentGame = { ...this.currentGame, ...updateData };
        } else {
            this.currentGame = updateData;
        }

        // Statistik aktualisieren bei Spielende
        if (oldStatus !== 'FINISHED' && this.currentGame?.status === 'FINISHED') {
            this.updateLocalStats(this.currentGame);
        }
      });
    },
  }
});