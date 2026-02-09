<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/game';
import { usePlayerStore } from '../stores/player';
import GameBoard from '../components/game/GameBoard.vue';

const route = useRoute();
const gameStore = useGameStore();
const playerStore = usePlayerStore();

// Game-ID aus der URL
const gameId = route.params.id as string;

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
  
  if (isMyTurn.value) {
    return "Du bist am Zug";
  } else {
    return "Gegner überlegt...";
  }
});

// Zug machen
const handleMove = async (row: number, col: number) => {
  // UI-Optimierung: Wir machen den Zug und bekommen SOFORT das neue Board (inkl. Computer-Zug)
  await gameStore.makeMove(row, col);
};

// Gewinnlinie berechnen
const winningLine = computed(() => {
  const game = gameStore.currentGame;
  if (!game || game.status !== 'FINISHED' || !game.winner || game.winner === 'DRAW') {
    return null;
  }
  
  const b = game.board;
  const w = game.winner;
  
  // Reihen prüfen
  for (let i = 0; i < 3; i++) {
    if (b[i]?.[0] === w && b[i]?.[1] === w && b[i]?.[2] === w) return [[i,0], [i,1], [i,2]];
  }
  // Spalten prüfen
  for (let i = 0; i < 3; i++) {
    if (b[0]?.[i] === w && b[1]?.[i] === w && b[2]?.[i] === w) return [[0,i], [1,i], [2,i]];
  }
  // Diagonalen prüfen
  if (b[0]?.[0] === w && b[1]?.[1] === w && b[2]?.[2] === w) return [[0,0], [1,1], [2,2]];
  if (b[0]?.[2] === w && b[1]?.[1] === w && b[2]?.[0] === w) return [[0,2], [1,1], [2,0]];
  
  return null;
});

// Ergebnis-Text für Modal
const gameResult = computed(() => {
  const game = gameStore.currentGame;
  if (!game || game.status !== 'FINISHED') return null;
  
  if (game.winner === 'DRAW') {
    return { title: 'Unentschieden! 🤝', message: 'Ein ausgeglichenes Spiel.', type: 'draw' };
  }

  // Einfache Gewinnanzeige basierend auf dem Gewinner-Symbol
  const winnerText = `Spieler ${game.winner} hat gewonnen!`;
  return { title: 'Spiel beendet! 🏆', message: winnerText, type: 'win' };
});

// Fehleranzeige
const showError = ref(false);

watch(() => gameStore.error, (newVal) => {
  if (newVal) {
    showError.value = true;
    setTimeout(() => {
      showError.value = false;
      gameStore.error = null;
    }, 3000);
  }
});

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
      
      <div class="status-badge" :class="{'finished': gameStore.currentGame.status === 'FINISHED', 'my-turn': isMyTurn, 'opponent-turn': !isMyTurn && gameStore.currentGame.status === 'IN_PROGRESS'}">
        {{ statusText }}
      </div>
    </header>

    <GameBoard 
      :board="gameStore.currentGame.board"
      :is-my-turn="isMyTurn" 
      :winning-line="winningLine"
      @cell-click="handleMove"
    />

    <div v-if="showError" class="error-toast">
      {{ gameStore.error }}
    </div>

    <div class="info">
      <p class="game-id-text">Spiel-ID: {{ gameId }}</p>
      <router-link to="/lobby" class="btn-back">Zurück zur Lobby</router-link>
    </div>

    <!-- Game Over Modal -->
    <div v-if="gameStore.currentGame.status === 'FINISHED' && gameResult" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ gameResult.title }}</h2>
        <p>{{ gameResult.message }}</p>
        <router-link to="/lobby" class="btn-lobby">Zurück zur Lobby</router-link>
      </div>
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

  &.my-turn {
    background: #10b981; /* Grün */
    color: white;
  }

  &.opponent-turn {
    background: #f59e0b; /* Gelb/Orange */
    color: white;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 90%;
  width: 400px;

  h2 { margin-top: 0; color: #1f2937; }
  p { font-size: 1.2rem; margin-bottom: 1.5rem; color: #4b5563; }
}

.btn-lobby {
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: background 0.2s;
  
  &:hover { background: #1d4ed8; }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  font-size: 1.5rem;
  color: #6b7280;
}

.error-toast {
  background-color: #ef4444;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  margin: 1rem auto;
  max-width: 300px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>