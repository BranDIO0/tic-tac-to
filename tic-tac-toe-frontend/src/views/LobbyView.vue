<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { usePlayerStore } from '../stores/player';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const router = useRouter();

// Beim Laden der Seite die Liste der Spiele holen
onMounted(() => {
  gameStore.fetchAvailableGames();
  // Polling alle 5 Sekunden, um die Liste aktuell zu halten
  setInterval(() => gameStore.fetchAvailableGames(), 5000);
});

// Spiel erstellen
const createGame = async (mode: 'PVP' | 'PVC') => {
  try {
    const newGameId = await gameStore.createGame(mode);
    if (newGameId) {
      // WICHTIG: Wir nutzen die ID für die URL
      router.push({ name: 'Game', params: { id: newGameId } });
    }
  } catch (e) {
    alert("Fehler beim Erstellen des Spiels");
  }
};

// Spiel beitreten
const joinGame = async (gameId: string) => {
  try {
    await gameStore.joinGame(gameId);
    router.push({ name: 'Game', params: { id: gameId } });
  } catch (e) {
    alert("Beitreten fehlgeschlagen (Spiel vielleicht schon voll?)");
    gameStore.fetchAvailableGames(); 
  }
};
</script>

<template>
  <div class="lobby-container">
    <header>
      <h1>Spiel-Lobby</h1>
      <p>Hallo, <strong>{{ playerStore.player?.name }}</strong></p>
    </header>

    <div class="lobby-grid">
      <div class="card create-section">
        <h2>Neues Spiel starten</h2>
        <div class="button-group">
          <button @click="createGame('PVC')" class="btn-primary">
            🤖 Gegen Computer
          </button>
          <button @click="createGame('PVP')" class="btn-secondary">
            👥 Gegen Spieler (PVP)
          </button>
        </div>
      </div>

      <div class="card list-section">
        <div class="list-header">
          <h2>Offene Spiele</h2>
          <button @click="gameStore.fetchAvailableGames()" class="btn-icon">🔄</button>
        </div>

        <div v-if="gameStore.isLoading && gameStore.availableGames.length === 0">
          Lade Spiele...
        </div>

        <ul v-else-if="gameStore.availableGames.length > 0" class="game-list">
          <li v-for="game in gameStore.availableGames" :key="game.gameId">
            
            <span>
                Spiel von <strong>{{ game.createdBy?.name || 'Unbekannt' }}</strong>
                <small style="color: #888; margin-left: 5px;">({{ game.gameId.substring(0,4) }}...)</small>
            </span>
            
            <button @click="joinGame(game.gameId)" class="btn-small">Beitreten</button>
          </li>
        </ul>

        <p v-else class="empty-state">Keine offenen Spiele gefunden.</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lobby-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.lobby-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  button {
    padding: 1rem;
    font-size: 1.1rem;
    cursor: pointer;
    border: none;
    border-radius: 8px;
    transition: transform 0.1s;
    
    &:active { transform: scale(0.98); }
  }
}

.btn-primary { background-color: var(--accent-color); color: white; }
.btn-secondary { background-color: #10b981; color: white; }
.btn-small { background-color: var(--accent-color); color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.game-list {
  list-style: none;
  padding: 0;
  
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem;
    border-bottom: 1px solid #eee;
    
    &:last-child { border-bottom: none; }
  }
}

.empty-state { color: #888; font-style: italic; }
</style>