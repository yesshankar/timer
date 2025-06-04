<template>
  <v-app :theme="currentThemeName">
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold d-none d-sm-flex align-center">
        <v-icon start :icon="activeView === 'BreathTimer' ? 'mdi-meditation' : 'mdi-clock-outline'"></v-icon>
        {{ activeView === "BreathTimer" ? "Breathing Timer" : "Future Countdown" }}
      </v-toolbar-title>
      <v-toolbar-title class="font-weight-bold d-flex d-sm-none align-center text-caption">
        {{ activeView === "BreathTimer" ? "Breath Timer" : "Countdown" }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Desktop Navigation Tabs -->
      <v-tabs v-model="activeViewTab" color="white" class="d-none d-md-flex" hide-slider>
        <v-tab value="BreathTimer" @click="setActiveView('BreathTimer')">
          <v-icon start>mdi-meditation</v-icon>
          Breath Timer
        </v-tab>
        <v-tab value="FutureCountdown" @click="setActiveView('FutureCountdown')">
          <v-icon start>mdi-clock-outline</v-icon>
          Future Countdown
        </v-tab>
      </v-tabs>

      <v-btn icon @click="toggleTheme">
        <v-icon>{{ currentThemeName === "customDarkTealTheme" ? "mdi-weather-night" : "mdi-weather-sunny" }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary app class="d-md-none">
      <v-list nav dense>
        <v-list-item
          prepend-icon="mdi-meditation"
          title="Breath Timer"
          value="BreathTimer"
          @click="
            setActiveView('BreathTimer');
            drawer = false;
          "
          :active="activeView === 'BreathTimer'"
          color="primary"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-clock-outline"
          title="Future Countdown"
          value="FutureCountdown"
          @click="
            setActiveView('FutureCountdown');
            drawer = false;
          "
          :active="activeView === 'FutureCountdown'"
          color="primary"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <component :is="activeComponentView" />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useTheme } from "vuetify";
import FutureCountdown from "./components/FutureCountdown.vue";
import BreathTimer from "./components/BreathTimer.vue";

const theme = useTheme();
const currentThemeName = ref("customTealTheme"); // Default to light theme
const activeView = ref("BreathTimer"); // Default view
const drawer = ref(false); // For mobile navigation drawer

const components = {
  FutureCountdown,
  BreathTimer,
};

const activeComponentView = computed(() => {
  return components[activeView.value];
});

// For v-tabs to reflect activeView
const activeViewTab = computed({
  get: () => activeView.value,
  set: (val) => setActiveView(val), // Though click handler is more direct for setting
});

function setActiveView(viewName) {
  activeView.value = viewName;
}

function toggleTheme() {
  const newTheme = theme.global.current.value.dark ? "customTealTheme" : "customDarkTealTheme";
  theme.global.name.value = newTheme;
  currentThemeName.value = newTheme; // Keep our ref in sync for the icon
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("appTheme", newTheme);
    }
  } catch (e) {
    console.error("Error saving theme to localStorage:", e);
  }
}

onMounted(() => {
  try {
    if (typeof localStorage !== "undefined") {
      const savedTheme = localStorage.getItem("appTheme");
      if (savedTheme && (savedTheme === "customTealTheme" || savedTheme === "customDarkTealTheme")) {
        theme.global.name.value = savedTheme;
        currentThemeName.value = savedTheme;
      } else {
        // If no saved theme or invalid, set default and save it
        theme.global.name.value = "customTealTheme";
        currentThemeName.value = "customTealTheme";
        localStorage.setItem("appTheme", "customTealTheme");
      }
    }
  } catch (e) {
    console.error("Error loading theme from localStorage:", e);
    // Fallback to default if localStorage fails
    theme.global.name.value = "customTealTheme";
    currentThemeName.value = "customTealTheme";
  }
});
</script>

<style>
/* Global styles if any, or specific to App.vue layout */
/* Ensure body background is handled by Vuetify theme */
body {
  background-color: rgb(var(--v-theme-background));
}
</style>
