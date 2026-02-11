import { defineStore } from 'pinia';
import axios from 'axios';
import type { Player } from '../types';

export const usePlayerStore = defineStore('player', {
  state: () => ({
    player: null as Player | null,
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    // Initialisierung beim App-Start
    initialize() {
      const storedId = localStorage.getItem('playerId');
      const storedName = localStorage.getItem('playerName');
      
      if (storedId && storedName) {
        this.player = {
          id: storedId,
          name: storedName,
          symbol: 'X' 
        };
        this.isAuthenticated = true;
      }
    },

    // Registrierung am Server
    async registerPlayer(name: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.post('http://localhost:8080/players', { name });
        const data = response.data;

        // Zeigt die Server-Antwort in der Browser-Konsole
        console.log("Server Antwort Rohdaten:", data);

        // Der Server schickt "playerId", aber unser Frontend erwartet "id".
        // prüfe alle Schreibweisen zur Sicherheit.
        const safePlayer = {
            id: data.playerId || data.id || data.ID, 
            name: data.name || data.Name,
            symbol: data.symbol || data.Symbol || 'X'
        };

        if (!safePlayer.id) {
            throw new Error("Server hat keine gültige ID zurückgegeben.");
        }

        // State aktualisieren
        this.player = safePlayer; 
        this.isAuthenticated = true;

        // LocalStorage aktualisieren (damit wir eingeloggt bleiben)
        localStorage.setItem('playerId', safePlayer.id);
        localStorage.setItem('playerName', safePlayer.name);
        
      } catch (e: any) {
        console.error("Registrierung fehlgeschlagen:", e);
        this.error = 'Registrierung fehlgeschlagen. Ist der Server an?';
      } finally {
        this.isLoading = false;
      }
    },
    
    // Logout / Reset
    logout() {
        this.player = null;
        this.isAuthenticated = false;
        localStorage.removeItem('playerId');
        localStorage.removeItem('playerName');
        window.location.reload(); 
    }
  }
});