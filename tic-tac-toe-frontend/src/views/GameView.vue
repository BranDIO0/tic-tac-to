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

// State für PVC Verzögerung
const isComputerThinking = ref(false);
const tempBoard = ref<string[][]>([]);

// 1. Identität bestimmen
const mySymbol = computed(() => {
  const game = gameStore.currentGame;
  if (!game) return '';
  
  // Im PVC Modus ist der Spieler immer X
  if (game.mode === 'PVC') return 'X';
  
  // FIX: Zuerst prüfen, ob wir die Rolle lokal gespeichert haben
  // Das umgeht das Problem, dass das Backend 'createdBy' oft nicht mitsendet
  const savedRole = localStorage.getItem(`role_${game.gameId}`);
  if (savedRole) return savedRole;

  // Im PVP Modus: Vergleich mit createdBy
  // WICHTIG: Wir nutzen zuerst den Store (Memory), da localStorage von anderen Tabs überschrieben sein könnte
  const myPlayerId = playerStore.player?.id || localStorage.getItem('playerId');
  console.log("My ID (Store/Storage):", myPlayerId);
  console.log("Game Creator ID:", game.createdBy?.playerId);
  console.log("Full Game Object:", game);

  if (game.createdBy && game.createdBy.playerId === myPlayerId) {
    return 'X';
  }

  // Fallback: Prüfen auf playerXID oder playerXId (falls Backend das sendet)
  const g = game as any;
  if (g.playerXID === myPlayerId || g.playerXId === myPlayerId || (g.playerX && g.playerX.playerId === myPlayerId)) {
    return 'X';
  }
  return 'O';
});

// Prüfung: Bin ich am Zug?
const isMyTurn = computed(() => {
  const game = gameStore.currentGame;
  // Wenn Computer denkt, ist der Spieler nicht am Zug (UI blockieren)
  if (isComputerThinking.value) return false;

  if (!game) return false;
  
  // Wenn das Spiel vorbei ist, darf keiner mehr klicken
  if (game.status === 'FINISHED') return false;

  // Prüfen ob mein Symbol am Zug ist
  return game.status === 'IN_PROGRESS' && game.currentTurn === mySymbol.value;
});

// Board für die Anzeige (handhabt die Verzögerung)
const boardToDisplay = computed(() => {
  // Wenn Computer denkt, zeigen wir das temporäre Board (mit dem Zug des Spielers)
  if (isComputerThinking.value && tempBoard.value.length > 0) {
    return tempBoard.value;
  }
  // Sonst das echte Board vom Server
  return gameStore.currentGame?.board || [];
});

// Text für die Statusanzeige
const statusText = computed(() => {
  const game = gameStore.currentGame;
  if (!game) return "Lade Spiel...";
  
  if (game.status === 'WAITING_FOR_PLAYER') return "Warte auf Mitspieler...";
  
  if (game.status === 'FINISHED') {
    if (game.winner === 'DRAW') return "🤝 Unentschieden!";
    // Zeige an, wer gewonnen hat
    return `🏆 Gewinner: ${game.winner}`;
  }
  
  if (isComputerThinking.value) {
    return "🤖 Computer überlegt...";
  }

  if (isMyTurn.value) {
    return "🟢 Dein Zug";
  } else {
    return "⏳ Gegner denkt nach...";
  }
});

// Zug machen
const handleMove = async (row: number, col: number) => {
  if (!gameStore.currentGame) return;

  // 2. PVC Künstliche Verzögerung
  if (gameStore.currentGame.mode === 'PVC') {
    // Optimistisches Update für das UI
    const currentBoard = JSON.parse(JSON.stringify(gameStore.currentGame.board));
    currentBoard[row][col] = mySymbol.value;
    tempBoard.value = currentBoard;
    
    isComputerThinking.value = true;

    // Zug an Server senden
    try {
      await gameStore.makeMove(row, col);
    } catch (e) {
      isComputerThinking.value = false;
      return;
    }

    // 2 Sekunden warten bevor das echte Ergebnis (mit Computer-Zug) angezeigt wird
    setTimeout(() => {
      isComputerThinking.value = false;
    }, 2000);

  } else {
    // PVP: Normaler Ablauf
    await gameStore.makeMove(row, col);
  }
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
  
  // Falls der Player-Store leer ist (z.B. bei Refresh), versuchen wir ihn zu laden
  if (!playerStore.player) {
    playerStore.initialize();
  }

  // 2. WebSocket Verbindung aufbauen für Echtzeit-Updates
  gameStore.connectToGame(gameId);
});

</script>

<template>
  <div class="game-view" v-if="gameStore.currentGame">
    <header>
      <h1>Tic Tac Toe</h1>
      
      <div class="header-info">
        <!-- Identity Badge -->
        <div class="identity-badge" v-if="mySymbol">
          <small>Du spielst als: <strong>{{ mySymbol }}</strong></small>
        </div>

        <div class="status-badge" :class="{'finished': gameStore.currentGame.status === 'FINISHED', 'my-turn': isMyTurn && !isComputerThinking, 'opponent-turn': (!isMyTurn || isComputerThinking) && gameStore.currentGame.status === 'IN_PROGRESS'}">
          {{ statusText }}
        </div>
      </div>
    </header>

    <GameBoard 
      :board="boardToDisplay"
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

.header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.identity-badge {
  background: var(--glass-bg);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: inline-block;
  font-size: 1.1rem;
  color: white;
}

.status-badge {
  background: var(--glass-bg); /* Adaptiver Hintergrund für Lesbarkeit im Dark Mode */
  backdrop-filter: blur(10px);
  padding: 0.8rem 2rem;
  border-radius: 16px;
  display: inline-block;
  margin-bottom: 1rem;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;

  &.finished {
    background: linear-gradient(135deg, #ffd700 0%, #fdb931 100%);
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }

  &.my-turn {
    background: var(--primary-gradient);
    box-shadow: 0 0 20px rgba(118, 75, 162, 0.4);
    color: white;
    border: 2px solid rgba(255,255,255,0.3);
  }

  &.opponent-turn {
    background: rgba(0,0,0,0.05);
    color: var(--text-secondary);
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 90%;
  width: 400px;

  h2 { margin-top: 0; color: #1f2937; }
  p { font-size: 1.2rem; margin-bottom: 1.5rem; color: #4b5563; }
}

.btn-lobby {
  background: var(--primary-gradient);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  text-decoration: none;
  font-weight: bold;
  transition: background 0.2s;
  
  &:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
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