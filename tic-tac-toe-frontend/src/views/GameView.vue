<script setup lang="ts">
import { onMounted, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/game';
import { usePlayerStore } from '../stores/player';
import GameBoard from '../components/game/GameBoard.vue';

const route = useRoute();
const gameStore = useGameStore();
const playerStore = usePlayerStore();

// Game-ID aus der URL
const gameId = route.params.id as string;
let pollingInterval: number | null = null;

// Prüfung: Bin ich am Zug?
const isMyTurn = computed(() => {
  const game = gameStore.currentGame;
  if (!game || !playerStore.player) return false;
  
  // Wenn das Spiel vorbei ist, darf keiner mehr klicken
  if (game.status === 'FINISHED') return false;

  // Im PVC Modus bist du immer 'X' (laut Server-Logik)
  // Im PVP Modus müssen wir prüfen, ob unsere ID/Symbol dran ist.
  // Einfache Logik: Wenn Status IN_PROGRESS ist, versuchen wir es.
  // Der Server blockt falsche Züge ohnehin ab.
  return game.status === 'IN_PROGRESS';
});

// Text für die Statusanzeige
const statusText = computed(() => {
  const game = gameStore.currentGame;
  if (!game) return "Lade Spiel...";
  
  if (game.status === 'WAITING_FOR_PLAYER') return "Warte auf Gegner...";
  
  if (game.status === 'FINISHED') {
    if (game.winner === 'DRAW') return "🤝 Unentschieden!";
    // Zeige an, wer gewonnen hat
    return `🏆 Gewinner: ${game.winner}`;
  }
  
  return `Am Zug: ${game.currentTurn}`; 
});

// Zug machen
const handleMove = async (row: number, col: number) => {
  // UI-Optimierung: Wir machen den Zug und bekommen SOFORT das neue Board (inkl. Computer-Zug)
  await gameStore.makeMove(row, col);
};

onMounted(async () => {
  // 1. Initiale Daten per REST holen (Sicherheit)
  await gameStore.fetchGame(gameId);

  // 2. WebSocket Verbindung aufbauen für Echtzeit-Updates
  gameStore.connectToGame(gameId);
});

</script>

<template>
  <div class="game-view" v-if="gameStore.currentGame">
    <header>
      <h1>Tic Tac Toe</h1>
      
      <div class="status-badge" :class="{'finished': gameStore.currentGame.status === 'FINISHED'}">
        {{ statusText }}
      </div>
    </header>

    <GameBoard 
      :board="gameStore.currentGame.board"
      :is-my-turn="isMyTurn" 
      @cell-click="handleMove"
    />

    <div class="info">
      <p class="game-id-text">Spiel-ID: {{ gameId }}</p>
      <router-link to="/lobby" class="btn-back">Zurück zur Lobby</router-link>
    </div>
  </div>
  
  <div v-else class="loading">
    <p>Lade Spielfeld...</p>
  </div>
</template>

<style scoped lang="scss">
.game-view {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 { margin-bottom: 0.5rem; }

.status-badge {
  background: #e5e7eb;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  display: inline-block;
  margin-bottom: 1rem;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &.finished {
    background: #fcd34d; /* Gold für Spielende */
    color: #000;
  }
}

.game-id-text {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 2rem;
}

.btn-back {
  display: inline-block;
  margin-top: 1rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  
  &:hover { text-decoration: underline; }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  font-size: 1.5rem;
  color: #6b7280;
}
</style>