<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="3" class="pa-4 pa-md-6">
          <v-card-title
            class="text-h6 text-sm-h5 font-weight-medium text-center mb-4"
            style="color: #00796b; word-wrap: break-word; white-space: normal"
          >
            <v-icon start>mdi-meditation</v-icon>
            Breathing Exercise Timer
          </v-card-title>

          <div :class="{ 'disabled-settings': isRunning || isPaused }">
            <v-row dense>
              <v-col cols="12">
                <v-slider
                  v-model="intervalSeconds"
                  label="Interval (seconds)"
                  :min="3"
                  :max="30"
                  :step="1"
                  thumb-label
                  color="primary"
                  class="mb-2 pt-2"
                  :disabled="isRunning || isPaused"
                >
                  <template v-slot:append>
                    <v-chip size="small" color="primary-darken-1">{{ intervalSeconds }}s</v-chip>
                  </template>
                </v-slider>
              </v-col>
              <v-col cols="12">
                <v-slider
                  v-model="sessionMinutes"
                  label="Session (minutes)"
                  :min="5"
                  :max="60"
                  :step="1"
                  thumb-label
                  color="secondary"
                  class="mb-2 pt-2"
                  :disabled="isRunning || isPaused"
                >
                  <template v-slot:append>
                    <v-chip size="small" color="secondary-darken-1">{{ sessionMinutes }}m</v-chip>
                  </template>
                </v-slider>
              </v-col>
            </v-row>

            <v-radio-group
              v-model="notificationMethod"
              inline
              label="Notification Method:"
              color="primary"
              class="mb-4 d-flex justify-center"
              :disabled="isRunning || isPaused"
            >
              <v-radio label="Beep Sound" value="beep" density="compact"></v-radio>
              <v-radio label="Voice Guide" value="voice" density="compact"></v-radio>
            </v-radio-group>
          </div>
          <v-divider class="mb-6"></v-divider>

          <div class="text-center mb-6">
            <div v-if="isSessionActive || isPaused">
              <p class="text-h3 font-weight-bold" :style="{ color: isPaused ? '#FFA000' : '#00796B' }">
                {{ currentIntervalTimeLeft }}s
              </p>
              <p class="text-caption text-uppercase" style="color: #004d40">Interval Countdown</p>

              <p v-if="currentVoicePhrase" class="text-h6 mt-1 font-italic" style="color: #00897b">
                {{ currentVoicePhrase }}
              </p>

              <p class="text-h4 mt-4" :style="{ color: isPaused ? '#FFA000' : '#00695C' }">
                {{ formattedSessionTimeLeft }}
              </p>
              <p class="text-caption text-uppercase" style="color: #004d40">Session Remaining</p>
              <div v-if="sessionStartTime && sessionEndTime" class="text-caption mt-1" style="color: #004d40">
                Session: {{ formatTime(sessionStartTime) }} - {{ formatTime(sessionEndTime) }}
              </div>
            </div>
            <div v-else class="text-h5 py-8" style="color: #00796b">Ready to start your session?</div>
          </div>

          <v-row justify="center" dense>
            <v-col cols="auto" v-if="!isSessionActive && !isPaused">
              <v-btn color="success" @click="startTimer" size="large" class="mx-2" prepend-icon="mdi-play">
                Start
              </v-btn>
            </v-col>
            <v-col cols="auto" v-if="isSessionActive && !isPaused">
              <v-btn color="warning" @click="pauseTimer" size="large" class="mx-2" prepend-icon="mdi-pause">
                Pause
              </v-btn>
            </v-col>
            <v-col cols="auto" v-if="isSessionActive && isPaused">
              <v-btn color="success" @click="resumeTimer" size="large" class="mx-2" prepend-icon="mdi-play">
                Resume
              </v-btn>
            </v-col>
            <v-col cols="auto" v-if="isSessionActive || isPaused">
              <v-btn color="error" @click="stopTimer" size="large" class="mx-2" prepend-icon="mdi-stop"> Stop </v-btn>
            </v-col>
          </v-row>

          <v-alert v-if="errorMessage" type="error" class="mt-4" density="compact" dismissible>
            {{ errorMessage }}
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
    <video ref="wakeLockVideo" loop muted playsinline style="display: none; width: 1px; height: 1px"></video>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue"; // Removed reactive as it's not directly used

const intervalSeconds = ref(10);
const sessionMinutes = ref(5);
const notificationMethod = ref("beep");

const currentIntervalTimeLeft = ref(0);
const currentSessionTimeLeftMs = ref(0);
const isRunning = ref(false);
const isPaused = ref(false);
const isSessionActive = ref(false);

const voicePhrases = ["Inhale", "Hold", "Exhale"];
const currentVoicePhrase = ref("");
let voiceCycleIndex = 0;

let intervalTimerId = null;
let audioContext = null;
let wakeLockSentinel = null;
const wakeLockVideo = ref(null);

const errorMessage = ref("");

const sessionStartTime = ref(null);
const sessionEndTime = ref(null);

// --- Computed Properties ---
const formattedSessionTimeLeft = computed(() => {
  if (!isSessionActive.value && !isPaused.value && currentSessionTimeLeftMs.value <= 0) {
    const totalSeconds = sessionMinutes.value * 60;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  const totalSeconds = Math.max(0, Math.floor(currentSessionTimeLeftMs.value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

// --- Helper Functions ---
const formatTime = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
};

// --- Audio & Speech ---
const playBeep = () => {
  if (typeof window !== "undefined" && !audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (!audioContext) {
    console.warn("AudioContext not supported.");
    errorMessage.value = "AudioContext not supported by your browser for beep sound.";
    return;
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.6, audioContext.currentTime); // Increased volume

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.15);
};

const speak = (text) => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    // Cancel any ongoing speech before starting new one
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech Synthesis not supported.");
    errorMessage.value = "Speech Synthesis not supported by your browser for voice guide.";
  }
};

// --- Wake Lock ---
const requestWakeLock = async () => {
  if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
      wakeLockSentinel.addEventListener("release", () => {
        if (isSessionActive.value && typeof document !== "undefined" && document.visibilityState === "visible") {
          requestWakeLock();
        }
      });
    } catch (err) {
      playHiddenVideo();
    }
  } else {
    playHiddenVideo();
  }
};

const releaseWakeLock = async () => {
  if (wakeLockSentinel) {
    await wakeLockSentinel.release().catch(() => {}); // Catch potential errors on release
    wakeLockSentinel = null;
  }
  stopHiddenVideo();
};

const playHiddenVideo = () => {
  if (wakeLockVideo.value && wakeLockVideo.value.paused) {
    // Check if already playing
    // A tiny valid base64 video string
    wakeLockVideo.value.src =
      "data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAZRtb292AAAAbG12aGQAAAAAzasAAAMAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAABhpb2RzAAAAABCAgIAAAQAE/////wAAAG10cmFrAAAAXHRraGQAAAAHzasAAAMAAQAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAEAAAABAgAAAAAAAG1kaWEAAAAgbWRoZAAAAAAzasAAAMAAQAgVUxAAAAAAAAlWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABdm1pbgAAABRkbmlmAAAAHGRyZWYAAAAAAAABAAAADHVybCAAAAABAAABJHN0YmwAAACNc3RzZAAAAAAAAAABAAAAmWF2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACABAAUgAAAAAAADAAAAAAAAAABjEuMC4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPGFzcGMBAQAAAAEAABNzdHRzAAAAAAAAAAEAAAABAAEAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAYc3RzegAAAAAAAAAAAAAAAQAAAQAAABRzdGNvAAAAAAAAAAEAAAAsAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY1oC4xMi4xMDA=";
    wakeLockVideo.value.play().catch((e) => console.warn("Hidden video play failed:", e));
  }
};

const stopHiddenVideo = () => {
  if (wakeLockVideo.value) {
    wakeLockVideo.value.pause();
    wakeLockVideo.value.removeAttribute("src"); // Remove src to stop potential looping/network
    wakeLockVideo.value.load(); // Reset video element
  }
};

// --- Timer Logic ---
const startTimer = () => {
  errorMessage.value = "";
  if (sessionMinutes.value <= 0 || intervalSeconds.value <= 0) {
    errorMessage.value = "Please set a valid session duration and interval.";
    return;
  }

  isSessionActive.value = true;
  isRunning.value = true;
  isPaused.value = false;

  const now = new Date();
  sessionStartTime.value = now.toISOString();
  const sessionDurationMs = sessionMinutes.value * 60 * 1000;
  sessionEndTime.value = new Date(now.getTime() + sessionDurationMs).toISOString();

  currentSessionTimeLeftMs.value = sessionDurationMs;
  currentIntervalTimeLeft.value = intervalSeconds.value;
  voiceCycleIndex = 0;

  currentVoicePhrase.value = voicePhrases[voiceCycleIndex]; // Set initial phrase for display
  if (notificationMethod.value === "voice") {
    speak(currentVoicePhrase.value);
  }

  requestWakeLock();
  tick();
  if (intervalTimerId) clearInterval(intervalTimerId);
  intervalTimerId = setInterval(tick, 1000);
  saveSettings();
};

const pauseTimer = () => {
  if (!isRunning.value) return;
  isRunning.value = false;
  isPaused.value = true;
  if (intervalTimerId) clearInterval(intervalTimerId);
  releaseWakeLock();
};

const resumeTimer = () => {
  if (!isPaused.value) return;
  isRunning.value = true;
  isPaused.value = false;
  requestWakeLock();
  if (intervalTimerId) clearInterval(intervalTimerId); // Clear just in case
  tick(); // Call tick immediately to avoid 1s delay if paused mid-second
  intervalTimerId = setInterval(tick, 1000);
};

const stopTimer = (sessionCompleted = false) => {
  isRunning.value = false;
  isPaused.value = false;
  isSessionActive.value = false;
  if (intervalTimerId) clearInterval(intervalTimerId);
  intervalTimerId = null;

  releaseWakeLock();

  currentIntervalTimeLeft.value = intervalSeconds.value; // Reset to initial interval for next start
  if (!sessionCompleted) {
    currentSessionTimeLeftMs.value = sessionMinutes.value * 60 * 1000; // Reset to initial session for next start
    sessionStartTime.value = null;
    sessionEndTime.value = null;
  }
  currentVoicePhrase.value = "";
};

const tick = () => {
  if (!isRunning.value) return;

  currentSessionTimeLeftMs.value -= 1000;
  currentIntervalTimeLeft.value -= 1;

  if (currentSessionTimeLeftMs.value < 0) {
    // Use < 0 to ensure it triggers even if slightly off
    currentSessionTimeLeftMs.value = 0;
    currentIntervalTimeLeft.value = 0;
    handleSessionEnd();
    return;
  }

  if (currentIntervalTimeLeft.value <= 0) {
    handleIntervalEnd();
    // Reset interval only if session is not about to end in this same tick
    if (currentSessionTimeLeftMs.value > 0) {
      currentIntervalTimeLeft.value = intervalSeconds.value;
    } else {
      currentIntervalTimeLeft.value = 0; // Ensure it shows 0 if session ends
    }
  }
};

const handleIntervalEnd = () => {
  if (notificationMethod.value === "beep") {
    playBeep();
  }
  // Always cycle phrase for display, speak only if voice mode
  voiceCycleIndex = (voiceCycleIndex + 1) % voicePhrases.length;
  currentVoicePhrase.value = voicePhrases[voiceCycleIndex];
  if (notificationMethod.value === "voice") {
    speak(currentVoicePhrase.value);
  }
};

const handleSessionEnd = () => {
  stopTimer(true);
  const completedMinutes = sessionMinutes.value;
  speak(`Congratulations! You have completed your ${completedMinutes} minute breathing session.`);
};

// --- Settings Persistence ---
const saveSettings = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const settings = {
        intervalSeconds: intervalSeconds.value,
        sessionMinutes: sessionMinutes.value,
        notificationMethod: notificationMethod.value,
      };
      localStorage.setItem("breathTimerSettings", JSON.stringify(settings));
    }
  } catch (e) {
    console.error("Error saving breath timer settings:", e);
    errorMessage.value = "Could not save settings. Local storage might be full or disabled.";
  }
};

const loadSettings = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const savedSettings = localStorage.getItem("breathTimerSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        intervalSeconds.value = settings.intervalSeconds || 10;
        sessionMinutes.value = settings.sessionMinutes || 5;
        notificationMethod.value = settings.notificationMethod || "beep";
      }
    }
  } catch (e) {
    console.error("Error loading breath timer settings:", e);
    errorMessage.value = "Could not load saved settings.";
    if (typeof localStorage !== "undefined") localStorage.removeItem("breathTimerSettings");
  } finally {
    // Initialize display based on loaded or default settings
    currentIntervalTimeLeft.value = intervalSeconds.value;
    currentSessionTimeLeftMs.value = sessionMinutes.value * 60 * 1000;
  }
};

// --- Watchers ---
watch([intervalSeconds, sessionMinutes, notificationMethod], () => {
  if (!isRunning.value && !isPaused.value) {
    saveSettings();
    currentIntervalTimeLeft.value = intervalSeconds.value;
    currentSessionTimeLeftMs.value = sessionMinutes.value * 60 * 1000;
    sessionStartTime.value = null; // Clear session times if settings change before start
    sessionEndTime.value = null;
  }
});

const handleVisibilityChange = () => {
  if (
    typeof document !== "undefined" &&
    document.visibilityState === "visible" &&
    isSessionActive.value &&
    isRunning.value &&
    !wakeLockSentinel
  ) {
    requestWakeLock();
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  loadSettings();
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Ensure SpeechSynthesis queue is clear on page load/reload
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
});

onBeforeUnmount(() => {
  stopTimer();
  if (typeof window !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Clear speech queue
    }
  }
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close().catch((e) => console.warn("Error closing AudioContext:", e));
  }
});
</script>

<style scoped>
.disabled-settings {
  opacity: 0.6;
  pointer-events: none;
}
.v-slider__thumb-label {
  background-color: #00796b !important;
}
/* Ensure card title wraps and doesn't show ellipsis */
.v-card-title {
  white-space: normal !important; /* Allow wrapping */
  overflow: visible !important; /* Prevent ellipsis */
  word-wrap: break-word; /* Break long words if necessary */
}
</style>
