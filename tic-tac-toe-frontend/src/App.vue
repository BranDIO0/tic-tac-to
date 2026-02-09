<script setup lang="ts">
// Die App.vue dient als Rahmen. 
// Der Router entscheidet, ob HomeView oder LobbyView angezeigt wird.
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
@import './assets/main.css';

.app-container {
  display: flex;
  flex-direction: column;
}
</style>