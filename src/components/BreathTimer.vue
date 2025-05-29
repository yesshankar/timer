<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="3" class="pa-4 pa-md-6">
          <v-card-title class="text-h5 text-md-h4 font-weight-medium text-center mb-4" style="color: #00796b">
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
                  class="mb-2"
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
                  class="mb-2"
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

              <p class="text-h4 mt-4" :style="{ color: isPaused ? '#FFA000' : '#00695C' }">
                {{ formattedSessionTimeLeft }}
              </p>
              <p class="text-caption text-uppercase" style="color: #004d40">Session Remaining</p>

              <p
                v-if="notificationMethod === 'voice' && currentVoicePhrase"
                class="text-h6 mt-3 font-italic"
                style="color: #00897b"
              >
                {{ currentVoicePhrase }}
              </p>
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from "vue";

const intervalSeconds = ref(10); // Default 10s
const sessionMinutes = ref(5); // Default 5m
const notificationMethod = ref("beep"); // 'beep' or 'voice'

const currentIntervalTimeLeft = ref(0);
const currentSessionTimeLeftMs = ref(0);
const isRunning = ref(false); // Timer is actively ticking
const isPaused = ref(false); // Timer is paused
const isSessionActive = ref(false); // A session has started (could be running or paused)

const voicePhrases = ["Inhale", "Hold", "Exhale"];
const currentVoicePhrase = ref("");
let voiceCycleIndex = 0;

let intervalTimerId = null; // For the 1-second tick
let audioContext = null;
let wakeLockSentinel = null;
const wakeLockVideo = ref(null); // Ref for the hidden video element

const errorMessage = ref("");

// --- Computed Properties ---
const formattedSessionTimeLeft = computed(() => {
  if (!isSessionActive.value && !isPaused.value && currentSessionTimeLeftMs.value <= 0) {
    // Show initial session duration before start
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

// --- Audio & Speech ---
const playBeep = () => {
  if (!audioContext) {
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

  oscillator.type = "sine"; // sine, square, sawtooth, triangle
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Volume

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.15); // Beep duration 150ms
};

const speak = (text) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: Configure voice, rate, pitch
    // const voices = window.speechSynthesis.getVoices();
    // utterance.voice = voices[0]; // Select a voice
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
  if ("wakeLock" in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
      wakeLockSentinel.addEventListener("release", () => {
        // console.log('Screen Wake Lock was released');
        // Re-acquire if the session is still active and document is visible
        if (isSessionActive.value && document.visibilityState === "visible") {
          requestWakeLock();
        }
      });
      // console.log('Screen Wake Lock is active');
    } catch (err) {
      // console.error(`Failed to acquire Screen Wake Lock: ${err.name}, ${err.message}`);
      // Fallback to video if wake lock fails or is not supported
      playHiddenVideo();
    }
  } else {
    // console.log('Screen Wake Lock API not supported, using video fallback.');
    playHiddenVideo();
  }
};

const releaseWakeLock = async () => {
  if (wakeLockSentinel) {
    await wakeLockSentinel.release();
    wakeLockSentinel = null;
    // console.log('Screen Wake Lock released');
  }
  stopHiddenVideo();
};

const playHiddenVideo = () => {
  if (wakeLockVideo.value) {
    // A very short, silent, base64 encoded MP4 video (1x1 pixel, 1 frame)
    // This is a common workaround. You might need to generate a tiny mp4 file and base64 encode it.
    // For simplicity, I'll just try to play. If it's not a real video source, it won't do much but might prevent some sleep modes.
    // A more robust solution would be a tiny valid video.
    // Example of a tiny base64 video (replace with a real one if needed for better effect):
    // wakeLockVideo.value.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAZRtb292AAAAbG12aGQAAAAAzasAAAMAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAABhpb2RzAAAAABCAgIAAAQAE/////wAAAG10cmFrAAAAXHRraGQAAAAHzasAAAMAAQAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAEAAAABAgAAAAAAAG1kaWEAAAAgbWRoZAAAAAAzasAAAMAAQAgVUxAAAAAAAAlWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABdm1pbgAAABRkbmlmAAAAHGRyZWYAAAAAAAABAAAADHVybCAAAAABAAABJHN0YmwAAACNc3RzZAAAAAAAAAABAAAAmWF2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACABAAUgAAAAAAADAAAAAAAAAABjEuMC4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPGFzcGMBAQAAAAEAABNzdHRzAAAAAAAAAAEAAAABAAEAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAYc3RzegAAAAAAAAAAAAAAAQAAAQAAABRzdGNvAAAAAAAAAAEAAAAsAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY1oC4xMi4xMDA=';
    wakeLockVideo.value.play().catch((e) => console.warn("Hidden video play failed:", e));
  }
};

const stopHiddenVideo = () => {
  if (wakeLockVideo.value) {
    wakeLockVideo.value.pause();
    // wakeLockVideo.value.src = ''; // Clear source
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
  // timeUp.value = false; // REMOVED: This was the problematic line

  currentSessionTimeLeftMs.value = sessionMinutes.value * 60 * 1000;
  currentIntervalTimeLeft.value = intervalSeconds.value;
  voiceCycleIndex = 0; // Reset voice cycle

  if (notificationMethod.value === "voice") {
    currentVoicePhrase.value = voicePhrases[voiceCycleIndex];
    speak(currentVoicePhrase.value);
  } else {
    currentVoicePhrase.value = ""; // Clear phrase if not in voice mode
  }

  requestWakeLock();
  tick(); // Initial tick, then setInterval
  if (intervalTimerId) clearInterval(intervalTimerId); // Clear any existing
  intervalTimerId = setInterval(tick, 1000);
  saveSettings();
};

const pauseTimer = () => {
  if (!isRunning.value) return;
  isRunning.value = false;
  isPaused.value = true;
  if (intervalTimerId) clearInterval(intervalTimerId);
  releaseWakeLock(); // Release lock when paused
};

const resumeTimer = () => {
  if (!isPaused.value) return;
  isRunning.value = true;
  isPaused.value = false;
  requestWakeLock(); // Re-acquire lock
  if (intervalTimerId) clearInterval(intervalTimerId);
  intervalTimerId = setInterval(tick, 1000);
};

const stopTimer = (sessionCompleted = false) => {
  isRunning.value = false;
  isPaused.value = false;
  isSessionActive.value = false;
  if (intervalTimerId) clearInterval(intervalTimerId);
  intervalTimerId = null;

  releaseWakeLock();

  currentIntervalTimeLeft.value = 0; // Reset display
  // currentSessionTimeLeftMs.value = 0; // Reset session time, or keep for review? Let's reset.
  if (!sessionCompleted) {
    // Only reset session time if not completed naturally
    currentSessionTimeLeftMs.value = 0;
  }
  currentVoicePhrase.value = "";

  // Do not save settings on stop, user might want to resume with same settings later.
  // Settings are saved on start or when changed.
};

const tick = () => {
  if (!isRunning.value) return;

  currentSessionTimeLeftMs.value -= 1000;
  currentIntervalTimeLeft.value -= 1;

  if (currentSessionTimeLeftMs.value <= 0) {
    currentSessionTimeLeftMs.value = 0;
    currentIntervalTimeLeft.value = 0; // Ensure interval also shows 0
    handleSessionEnd();
    return;
  }

  if (currentIntervalTimeLeft.value <= 0) {
    handleIntervalEnd();
    currentIntervalTimeLeft.value = intervalSeconds.value; // Reset interval
  }
};

const handleIntervalEnd = () => {
  if (notificationMethod.value === "beep") {
    playBeep();
  } else if (notificationMethod.value === "voice") {
    voiceCycleIndex = (voiceCycleIndex + 1) % voicePhrases.length;
    currentVoicePhrase.value = voicePhrases[voiceCycleIndex];
    speak(currentVoicePhrase.value);
  }
};

const handleSessionEnd = () => {
  stopTimer(true); // Pass true to indicate session completed naturally
  const completedMinutes = sessionMinutes.value; // Use the initial setting for the message
  speak(`Congratulations! You have completed your ${completedMinutes} minute breathing session.`);
  // Optionally, display a message on screen
  // infoMessage.value = `Session of ${completedMinutes} minutes completed!`;
};

// --- Settings Persistence ---
const saveSettings = () => {
  try {
    const settings = {
      intervalSeconds: intervalSeconds.value,
      sessionMinutes: sessionMinutes.value,
      notificationMethod: notificationMethod.value,
    };
    localStorage.setItem("breathTimerSettings", JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving breath timer settings:", e);
    errorMessage.value = "Could not save settings. Local storage might be full or disabled.";
  }
};

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem("breathTimerSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      intervalSeconds.value = settings.intervalSeconds || 10;
      sessionMinutes.value = settings.sessionMinutes || 5;
      notificationMethod.value = settings.notificationMethod || "beep";
    }
    // Initialize display based on loaded settings before timer starts
    currentIntervalTimeLeft.value = intervalSeconds.value;
    currentSessionTimeLeftMs.value = sessionMinutes.value * 60 * 1000;
  } catch (e) {
    console.error("Error loading breath timer settings:", e);
    errorMessage.value = "Could not load saved settings.";
    localStorage.removeItem("breathTimerSettings");
  }
};

// --- Watchers ---
watch([intervalSeconds, sessionMinutes, notificationMethod], () => {
  if (!isRunning.value && !isPaused.value) {
    // Only save if timer is not active
    saveSettings();
    // Update display if timer not running
    currentIntervalTimeLeft.value = intervalSeconds.value;
    currentSessionTimeLeftMs.value = sessionMinutes.value * 60 * 1000;
  }
});

// Re-acquire wake lock if document becomes visible
const handleVisibilityChange = () => {
  if (document.visibilityState === "visible" && isSessionActive.value && isRunning.value && !wakeLockSentinel) {
    requestWakeLock();
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  loadSettings();
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
});

onBeforeUnmount(() => {
  stopTimer(); // Ensure timer and wake lock are cleared
  if (typeof window !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close(); // Clean up AudioContext
  }
});
</script>

<style scoped>
.disabled-settings {
  opacity: 0.6;
  pointer-events: none;
}
/* Add any component-specific styles here, consistent with the teal theme */
.v-slider__thumb-label {
  background-color: #00796b !important; /* Teal 700 for slider thumb */
}
</style>
