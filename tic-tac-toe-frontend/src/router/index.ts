import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LobbyView from '../views/LobbyView.vue';
import { usePlayerStore } from '../stores/player';
import GameView from '../views/GameView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      name: 'Home', 
      component: HomeView 
    },
    { 
      path: '/lobby', 
      name: 'Lobby', 
      component: LobbyView 
    },
    { 
      path: '/game/:id', 
      name: 'Game', 
      component: GameView, 
      props: true 
    },
  ]
});

// Guard: Nicht eingeloggt -> Zurück zum Start
router.beforeEach((to, from, next) => {
  const playerStore = usePlayerStore();
  
  // Wenn wir nicht auf Home sind und nicht authentifiziert sind...
  if (to.name !== 'Home' && !playerStore.isAuthenticated) {
    // Versuch, Session aus LocalStorage wiederherzustellen
    playerStore.initialize();
    
    if (!playerStore.isAuthenticated) {
      next({ name: 'Home' }); // zum Login
      return;
    }
  }
  next();
});

export default router;