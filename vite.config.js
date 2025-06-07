import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify"; // Import Vuetify plugin

// https://vite.dev/config/
export default defineConfig({
  base: "/timer/", // for github pages
  // base: "./",
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // Enable Vuetify plugin with autoImport
  ],
});
