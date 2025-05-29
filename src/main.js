import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify"; // Import your Vuetify configuration
import "./assets/main.css"; // Import global styles

const app = createApp(App);

app.use(vuetify); // Use Vuetify

app.mount("#app");
