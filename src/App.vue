<script setup>
import FutureCountdown from "./components/FutureCountdown.vue";
import BreathTimer from "./components/BreathTimer.vue";

import { ref } from "vue";

const currentTheme = ref("customTealTheme"); // This will be set by Vuetify plugin
</script>

<template>
  <v-app :theme="currentTheme">
    <v-divider class="my-10"></v-divider>
    <BreathTimer />
    <v-divider class="my-10"></v-divider>
    <FutureCountdown />
  </v-app>
</template>

<style>
/* You can add global styles specific to App.vue here, or keep them in main.css */
/* Ensure no conflicting body styles if defined elsewhere */
</style>
