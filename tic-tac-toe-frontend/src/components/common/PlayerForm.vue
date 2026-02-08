<script setup lang="ts">
import { ref } from 'vue';

// Wir definieren Events, die diese Komponente nach außen sendet
const emit = defineEmits(['submit']);

const playerName = ref('');

const handleSubmit = () => {
  if (playerName.value.trim().length > 0) {
    emit('submit', playerName.value);
  }
};
</script>

<template>
  <div class="player-form-card">
    <h2>Willkommen bei Tic-Tac-Toe</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Dein Spielername:</label>
        <input 
          id="name" 
          v-model="playerName" 
          type="text" 
          placeholder="Namen eingeben..." 
          required
        />
      </div>
      <button type="submit" :disabled="!playerName">Spiel betreten</button>
    </form>
  </div>
</template>

<style scoped lang="scss">
/* Minimales Styling für den Start */
.player-form-card {
  background: var(--bg-secondary); /* Nutzt Theme-Variable */
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 400px;
  margin: 0 auto;

  input {
    padding: 0.5rem;
    margin: 1rem 0;
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    background-color: var(--accent-color);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>