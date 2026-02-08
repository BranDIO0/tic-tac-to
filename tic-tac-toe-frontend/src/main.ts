import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './assets/styles/main.scss' // Falls schon angelegt
import App from './App.vue'

createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app')