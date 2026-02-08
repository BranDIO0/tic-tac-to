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
/* Ein paar globale Styles, damit die App gut aussieht */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: Arial, sans-serif;
  background-color: var(--bg-primary); /* Nutzt unsere Variablen */
  color: var(--text-primary);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>