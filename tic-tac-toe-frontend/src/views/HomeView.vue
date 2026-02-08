<script setup lang="ts">
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import PlayerForm from '../components/common/PlayerForm.vue';

const playerStore = usePlayerStore();
const router = useRouter();

const handleLogin = async (name: string) => {
  await playerStore.registerPlayer(name);
  if (playerStore.isAuthenticated) {
    router.push('/lobby'); 
  }
};
</script>

<template>
  <div class="home-container">
    <p v-if="playerStore.error" class="error">{{ playerStore.error }}</p>
    <PlayerForm @submit="handleLogin" />
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh; 
}
.error { color: red; text-align: center; }
</style>