import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { installMotion } from './directives/motion.js'
import { installSpotlight } from './directives/spotlight.js'
import './assets/main.css'

const app = createApp(App).use(router)
installMotion(app)
installSpotlight()
app.mount('#app')
