<template>
  <!-- <v-app :theme="currentTheme"> -->
  <v-app-bar color="primary" dark prominent>
    <v-app-bar-title class="font-weight-bold">
      <v-icon start icon="mdi-clock-outline"></v-icon>
      Future Countdown
    </v-app-bar-title>
  </v-app-bar>

  <v-main>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-card elevation="3" class="pa-4 pa-md-6">
            <v-card-title class="text-h5 text-md-h4 font-weight-medium text-center mb-4" style="color: #00796b">
              Set Your Countdown Target
            </v-card-title>

            <v-radio-group v-model="selectionMode" inline class="mb-4 d-flex justify-center">
              <v-radio label="Specific Date" value="calendar" color="primary"></v-radio>
              <v-radio label="Target Age" value="age" color="primary"></v-radio>
            </v-radio-group>
            <v-divider class="mb-6"></v-divider>

            <div v-if="selectionMode === 'calendar'" class="mb-4">
              <v-btn color="primary" @click="openCalendarDialog" block size="large" class="mb-3">
                <v-icon start>mdi-calendar</v-icon>
                {{ originalTargetDate && selectionMode === "calendar" ? "Change Target Date" : "Choose Target Date" }}
              </v-btn>
              <p v-if="originalTargetDate && selectionMode === 'calendar'" class="text-center text-subtitle-1">
                Selected: {{ formatDate(originalTargetDate, false) }}
              </p>
            </div>

            <div v-if="selectionMode === 'age'" class="mb-4">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-btn color="secondary" @click="openBirthdayDialog" block size="large" class="mb-2">
                    <v-icon start>mdi-cake-variant</v-icon>
                    {{ birthday ? "Change Birthday" : "Choose Birthday" }}
                  </v-btn>
                  <p v-if="birthday" class="text-center text-caption mt-1">Born: {{ formatDate(birthday, false) }}</p>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="targetAge"
                    label="Target Age"
                    type="number"
                    min="1"
                    max="150"
                    :disabled="!birthday"
                    variant="outlined"
                    density="compact"
                    color="secondary"
                    class="mb-0"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn
                color="primary-darken-1"
                @click="setTargetDateFromAge"
                :disabled="!birthday || !targetAge || targetAge <= 0"
                block
                size="large"
                class="mt-4"
              >
                <v-icon start>mdi-calculator-variant</v-icon>
                Set Countdown to Age {{ targetAge || "" }}
              </v-btn>
              <p v-if="originalTargetDate && selectionMode === 'age'" class="text-center text-subtitle-1 mt-3">
                Targeting: {{ formatDate(originalTargetDate, false) }}
              </p>
            </div>

            <v-divider class="my-5"></v-divider>
            <div class="exclusion-section pa-3 mb-4">
              <v-row align="center" class="mb-2">
                <v-col cols="auto">
                  <span class="text-subtitle-1 font-weight-medium" style="color: #00695c">Daily Time Exclusion:</span>
                </v-col>
                <v-col>
                  <v-switch
                    v-model="exclusionEnabled"
                    label="Enable Exclusion"
                    color="primary"
                    hide-details
                    inset
                    density="compact"
                  ></v-switch>
                </v-col>
              </v-row>

              <div v-if="exclusionEnabled" class="mt-1">
                <v-radio-group v-model="exclusionMode" inline hide-details class="mb-3">
                  <template v-slot:label
                    ><div class="text-caption" style="color: #004d40">Exclusion Method:</div></template
                  >
                  <v-radio label="Duration" value="duration" color="primary" density="compact"></v-radio>
                  <v-radio label="Time Range" value="range" color="primary" density="compact"></v-radio>
                </v-radio-group>

                <div v-if="exclusionMode === 'duration'">
                  <v-row dense>
                    <v-col cols="6" sm="4">
                      <v-text-field
                        v-model.number="excludedHours"
                        label="Hours"
                        type="number"
                        min="0"
                        max="23"
                        variant="outlined"
                        density="compact"
                        hide-details="auto"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="4">
                      <v-text-field
                        v-model.number="excludedMinutes"
                        label="Minutes"
                        type="number"
                        min="0"
                        max="59"
                        variant="outlined"
                        density="compact"
                        hide-details="auto"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>

                <div v-if="exclusionMode === 'range'">
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="exclusionStartTime"
                        label="Start (HH:MM)"
                        placeholder="e.g., 19:00"
                        variant="outlined"
                        density="compact"
                        hide-details="auto"
                        :rules="[timeFormatRule]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="exclusionEndTime"
                        label="End (HH:MM)"
                        placeholder="e.g., 21:00"
                        variant="outlined"
                        density="compact"
                        hide-details="auto"
                        :rules="[timeFormatRule]"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>
                <p class="text-caption mt-2" style="color: #00796b">
                  Daily exclusion: {{ formatDuration(dailyExclusionMilliseconds) }}
                </p>
              </div>
            </div>

            <v-alert
              v-if="
                exclusionEnabled &&
                actualCountdownTargetDate &&
                originalTargetDate &&
                actualCountdownTargetDate !== originalTargetDate
              "
              type="info"
              density="compact"
              class="mt-4"
              variant="tonal"
            >
              Original Target: {{ formatDate(originalTargetDate, true) }}<br />
              Effective Target (with exclusions):
              <strong style="color: #00695c">{{ formatDate(actualCountdownTargetDate, true) }}</strong>
            </v-alert>

            <v-card v-if="isTargetDateSet" class="mt-6 pa-4 pa-md-5" elevation="2" outlined border color="teal2">
              <v-card-title class="headline text-center font-weight-regular" style="color: #00695c">
                Time Remaining Until
              </v-card-title>
              <v-card-subtitle class="text-center mb-3 text-body-1" style="color: #004d40">
                {{ formatDate(actualCountdownTargetDate, true) }}
              </v-card-subtitle>
              <v-divider></v-divider>

              <div v-if="!timeUp && countdown.years !== null" class="countdown-grid">
                <div class="countdown-item">
                  <span class="value">{{ countdown.years }}</span
                  ><span class="label">Years</span>
                </div>
                <div class="countdown-item">
                  <span class="value">{{ countdown.months }}</span
                  ><span class="label">Months</span>
                </div>
                <div class="countdown-item">
                  <span class="value">{{ countdown.days }}</span
                  ><span class="label">Days</span>
                </div>
                <div class="countdown-item">
                  <span class="value">{{ countdown.hours }}</span
                  ><span class="label">Hours</span>
                </div>
                <div class="countdown-item">
                  <span class="value">{{ countdown.minutes }}</span
                  ><span class="label">Minutes</span>
                </div>
                <div class="countdown-item">
                  <span class="value">{{ countdown.seconds }}</span
                  ><span class="label">Seconds</span>
                </div>
              </div>
              <div v-else-if="timeUp" class="mt-4 text-h5 text-center font-weight-bold" style="color: #009688">
                🎉 The target date has arrived! 🎉
              </div>
              <div v-else class="text-center mt-4 pa-5">
                <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
                <p class="mt-3 text-body-2" style="color: #00796b">Calculating countdown...</p>
              </div>
            </v-card>

            <v-alert v-if="errorMessage" type="error" dismissible class="mt-4" density="compact">
              {{ errorMessage }}
            </v-alert>
            <v-alert
              v-if="
                infoMessage &&
                !(
                  exclusionEnabled &&
                  actualCountdownTargetDate &&
                  originalTargetDate &&
                  actualCountdownTargetDate !== originalTargetDate
                )
              "
              type="info"
              dismissible
              class="mt-4"
              density="compact"
            >
              {{ infoMessage }}
            </v-alert>

            <v-btn
              v-if="isTargetDateSet"
              color="warning"
              @click="clearTargetDateAndSettings"
              block
              size="large"
              class="mt-6"
            >
              <v-icon start>mdi-delete-sweep</v-icon>
              Clear Countdown & Settings
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="showCalendarDialog" max-width="340px" persistent>
        <v-card>
          <v-card-title class="text-h6" style="background-color: #009688; color: white"
            >Select Target Date</v-card-title
          >
          <v-date-picker
            v-model="tempCalendarDate"
            :min="minPickerDate"
            show-adjacent-months
            color="primary"
            header-color="primary"
            class="ma-2"
          ></v-date-picker>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showCalendarDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="confirmCalendarDate">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showBirthdayDialog" max-width="340px" persistent>
        <v-card>
          <v-card-title class="text-h6" style="background-color: #00796b; color: white"
            >Select Your Birthday</v-card-title
          >
          <v-date-picker
            v-model="tempBirthday"
            :max="maxBirthdayDate"
            show-adjacent-months
            color="secondary"
            header-color="secondary"
            class="ma-2"
          ></v-date-picker>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showBirthdayDialog = false">Cancel</v-btn>
            <v-btn color="secondary" variant="flat" @click="confirmBirthday">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-main>
  <!-- </v-app> -->
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from "vue";

// No need to import createVuetify here, it's handled in main.js/plugins

const originalTargetDate = ref(null);
const birthday = ref(null);
const targetAge = ref(null);
const selectionMode = ref("calendar");
const countdown = reactive({
  years: null,
  months: null,
  days: null,
  hours: null,
  minutes: null,
  seconds: null,
});
let intervalId = null;
const timeUp = ref(false);
const errorMessage = ref("");
const infoMessage = ref("");
const showCalendarDialog = ref(false);
const tempCalendarDate = ref(null); // This will hold a Date object from v-date-picker
const showBirthdayDialog = ref(false);
const tempBirthday = ref(null); // This will hold a Date object from v-date-picker

// Time Exclusion Refs
const exclusionEnabled = ref(false);
const exclusionMode = ref("duration"); // 'duration' or 'range'
const excludedHours = ref(0);
const excludedMinutes = ref(0);
const exclusionStartTime = ref(""); // HH:MM format
const exclusionEndTime = ref(""); // HH:MM format

// --- Validation Rules ---
const timeFormatRule = (v) => {
  if (!v) return true;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || "Invalid format (HH:MM)";
};

// --- Computed Properties ---
const isTargetDateSet = computed(() => !!originalTargetDate.value);
const minPickerDate = computed(() => new Date(new Date().setHours(0, 0, 0, 0)));
const maxBirthdayDate = computed(() => new Date(new Date().setHours(23, 59, 59, 999)));

const dailyExclusionMilliseconds = computed(() => {
  if (!exclusionEnabled.value) return 0;
  let hours = 0;
  let minutes = 0;

  if (exclusionMode.value === "duration") {
    hours = parseInt(excludedHours.value) || 0;
    minutes = parseInt(excludedMinutes.value) || 0;
  } else if (exclusionMode.value === "range") {
    if (
      timeFormatRule(exclusionStartTime.value) === true &&
      timeFormatRule(exclusionEndTime.value) === true &&
      exclusionStartTime.value &&
      exclusionEndTime.value
    ) {
      const [startH, startM] = exclusionStartTime.value.split(":").map(Number);
      const [endH, endM] = exclusionEndTime.value.split(":").map(Number);

      let startTotalMinutes = startH * 60 + startM;
      let endTotalMinutes = endH * 60 + endM;

      if (endTotalMinutes < startTotalMinutes) {
        // Handles overnight
        endTotalMinutes += 24 * 60;
      }
      const diffMinutes = endTotalMinutes - startTotalMinutes;
      hours = Math.floor(diffMinutes / 60);
      minutes = diffMinutes % 60;
    } else {
      return 0;
    }
  }
  const totalMs = hours * 60 * 60 * 1000 + minutes * 60 * 1000;
  return totalMs >= 24 * 60 * 60 * 1000 ? 0 : totalMs;
});

const actualCountdownTargetDate = computed(() => {
  if (!originalTargetDate.value) return null;

  if (exclusionEnabled.value) {
    const dailyMs = dailyExclusionMilliseconds.value;
    if (dailyMs > 0) {
      const origDateObj = new Date(originalTargetDate.value);
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      // Ensure targetDayStart is based on the date part of origDateObj
      const targetDayStart = new Date(origDateObj.getFullYear(), origDateObj.getMonth(), origDateObj.getDate());

      let numDaysInvolved = 0;
      if (targetDayStart.getTime() >= todayStart.getTime()) {
        // Calculate full days between today (start) and target day (start)
        numDaysInvolved = Math.floor((targetDayStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      } else {
        // Original target date is in the past (or today but before exclusions applied),
        // so no exclusion calculation needed in this manner.
        // The countdown will simply show time up or a very short duration.
        return originalTargetDate.value;
      }

      if (numDaysInvolved <= 0) return originalTargetDate.value;

      const totalExcludedMs = numDaysInvolved * dailyMs;
      return new Date(origDateObj.getTime() + totalExcludedMs).toISOString();
    }
  }
  return originalTargetDate.value;
});

// --- Methods ---
const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0 minutes";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(" ") : "0 minutes";
};

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return date.toLocaleString(undefined, options);
};

const calculateCountdown = () => {
  const currentTargetISO = actualCountdownTargetDate.value;
  if (!currentTargetISO) {
    resetCountdownValues();
    return;
  }
  const target = new Date(currentTargetISO);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    timeUp.value = true;
    resetCountdownValues(true);
    if (intervalId) clearInterval(intervalId);
    return;
  }
  timeUp.value = false;
  let t = new Date(target.getTime());
  let years = t.getFullYear() - now.getFullYear();
  let months = t.getMonth() - now.getMonth();
  let days = t.getDate() - now.getDate();
  let hours = t.getHours() - now.getHours();
  let minutes = t.getMinutes() - now.getMinutes();
  let seconds = t.getSeconds() - now.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    months--;
    const prevMonthDays = new Date(t.getFullYear(), t.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  countdown.years = Math.max(0, years);
  countdown.months = Math.max(0, months);
  countdown.days = Math.max(0, days);
  countdown.hours = Math.max(0, hours);
  countdown.minutes = Math.max(0, minutes);
  countdown.seconds = Math.max(0, seconds);
};

const resetCountdownValues = (isTimeUp = false) => {
  const val = isTimeUp ? 0 : null;
  countdown.years = val;
  countdown.months = val;
  countdown.days = val;
  countdown.hours = val;
  countdown.minutes = val;
  countdown.seconds = val;
};

const startOrUpdateCountdown = () => {
  if (intervalId) clearInterval(intervalId);
  const currentTargetISO = actualCountdownTargetDate.value;
  if (currentTargetISO) {
    timeUp.value = false;
    calculateCountdown(); // Initial calculation
    intervalId = setInterval(calculateCountdown, 1000);
  } else {
    stopCountdown();
  }
};

const stopCountdown = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  resetCountdownValues();
};

const saveSettings = () => {
  try {
    const settings = {
      originalTargetDate: originalTargetDate.value,
      birthday: birthday.value,
      targetAge: targetAge.value,
      selectionMode: selectionMode.value,
      exclusionEnabled: exclusionEnabled.value,
      exclusionMode: exclusionMode.value,
      excludedHours: excludedHours.value,
      excludedMinutes: excludedMinutes.value,
      exclusionStartTime: exclusionStartTime.value,
      exclusionEndTime: exclusionEndTime.value,
    };
    localStorage.setItem("futureCountdownSettings", JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving settings:", e);
    errorMessage.value = "Could not save settings.";
  }
};

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem("futureCountdownSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      originalTargetDate.value = settings.originalTargetDate || null;
      birthday.value = settings.birthday || null;
      targetAge.value = settings.targetAge || null;
      selectionMode.value = settings.selectionMode || "calendar";
      exclusionEnabled.value = settings.exclusionEnabled || false;
      exclusionMode.value = settings.exclusionMode || "duration";
      excludedHours.value = settings.excludedHours || 0;
      excludedMinutes.value = settings.excludedMinutes || 0;
      exclusionStartTime.value = settings.exclusionStartTime || "";
      exclusionEndTime.value = settings.exclusionEndTime || "";
    }
  } catch (e) {
    console.error("Error loading settings:", e);
    errorMessage.value = "Could not load settings.";
    localStorage.removeItem("futureCountdownSettings");
  }
};

const clearMessages = () => {
  errorMessage.value = "";
  infoMessage.value = "";
};

const openCalendarDialog = () => {
  clearMessages();
  // Initialize tempCalendarDate: if originalTargetDate exists, use it, otherwise default to tomorrow
  const initialDate =
    originalTargetDate.value && selectionMode.value === "calendar"
      ? new Date(originalTargetDate.value)
      : new Date(minPickerDate.value.getTime() + 24 * 60 * 60 * 1000); // Default to tomorrow
  tempCalendarDate.value = initialDate;
  showCalendarDialog.value = true;
};

const confirmCalendarDate = () => {
  if (tempCalendarDate.value) {
    const selected = new Date(tempCalendarDate.value); // tempCalendarDate is already a Date object
    // Set time to midday to avoid timezone issues for date-only comparisons if needed,
    // but for target date, user might want a specific time.
    // For simplicity, we'll keep the time from the picker or default to start of day if only date is picked.
    // The current v-date-picker seems to give date at 00:00:00 local time.
    // Let's ensure it's at least the start of the selected day.
    selected.setHours(12, 0, 0, 0); // Standardize to midday to be safe with date comparisons

    if (selected.getTime() < minPickerDate.value.getTime()) {
      errorMessage.value = "Please select a future date.";
      return;
    }
    originalTargetDate.value = selected.toISOString();
    selectionMode.value = "calendar";
    showCalendarDialog.value = false;
  } else {
    errorMessage.value = "No date selected.";
  }
};

const openBirthdayDialog = () => {
  clearMessages();
  const initialBday = birthday.value
    ? new Date(birthday.value)
    : new Date(maxBirthdayDate.value.getFullYear() - 20, 0, 1); // Default to 20 years ago
  tempBirthday.value = initialBday;
  showBirthdayDialog.value = true;
};

const confirmBirthday = () => {
  if (tempBirthday.value) {
    const selectedBirthday = new Date(tempBirthday.value);
    if (selectedBirthday.getTime() > maxBirthdayDate.value.getTime()) {
      errorMessage.value = "Birthday cannot be in the future.";
      return;
    }
    selectedBirthday.setHours(0, 0, 0, 0); // Normalize to start of day
    birthday.value = selectedBirthday.toISOString();
    showBirthdayDialog.value = false;
    if (targetAge.value && targetAge.value > 0) setTargetDateFromAge();
  } else {
    errorMessage.value = "No birthday selected.";
  }
};

const setTargetDateFromAge = () => {
  clearMessages();
  if (!birthday.value || !targetAge.value || targetAge.value <= 0) {
    errorMessage.value = "Please select a birthday and enter a valid target age.";
    return;
  }
  const bDate = new Date(birthday.value); // This is already normalized to 00:00:00 local
  const futureYear = bDate.getFullYear() + parseInt(targetAge.value);

  // Create target date using original birth month and day, at midday local time
  const targetBdayDate = new Date(futureYear, bDate.getMonth(), bDate.getDate(), 12, 0, 0);

  if (targetBdayDate.getTime() <= new Date().getTime()) {
    errorMessage.value = `The calculated target date (age ${targetAge.value}) is in the past.`;
    originalTargetDate.value = null;
    return;
  }
  originalTargetDate.value = targetBdayDate.toISOString();
  infoMessage.value = `Original target set for age ${targetAge.value}.`;
};

const clearTargetDateAndSettings = () => {
  clearMessages();
  originalTargetDate.value = null;
  exclusionEnabled.value = false;
  exclusionMode.value = "duration";
  excludedHours.value = 0;
  excludedMinutes.value = 0;
  exclusionStartTime.value = "";
  exclusionEndTime.value = "";
  // Optionally clear birthday and targetAge or keep them
  // birthday.value = null;
  // targetAge.value = null;
  infoMessage.value = "Countdown and all settings have been cleared.";
};

watch(
  actualCountdownTargetDate,
  (newTargetDateISO, oldTargetDateISO) => {
    // Only save if the actual value changed to prevent unnecessary saves on init
    if (newTargetDateISO !== oldTargetDateISO) {
      saveSettings();
    }
    startOrUpdateCountdown();
  },
  { immediate: true }
); // immediate: true to run on component mount after initial values are set

watch(
  [
    exclusionEnabled,
    exclusionMode,
    excludedHours,
    excludedMinutes,
    exclusionStartTime,
    exclusionEndTime,
    selectionMode,
    birthday,
    targetAge,
    originalTargetDate,
  ],
  () => {
    // This watcher ensures settings are saved when any of these change,
    // especially if actualCountdownTargetDate computation doesn't change its output
    // (e.g., if originalTargetDate is null, but user changes exclusion settings).
    saveSettings();
  },
  { deep: true }
); // deep might be useful if any of these were objects, but for refs it's fine

onMounted(() => {
  loadSettings();
  // The immediate watcher on actualCountdownTargetDate should handle the initial countdown start.
});

onBeforeUnmount(() => {
  stopCountdown();
});
</script>

<style scoped>
/* Component-specific styles from the original HTML */
.countdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 1rem;
  align-items: center;
  justify-items: center;
  margin-top: 1.25rem;
}
.countdown-item {
  background-color: #b2dfdb; /* Teal 100 */
  padding: 0.8rem 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;
  text-align: center;
  border: 1px solid #4db6ac; /* Teal 300 */
}
.countdown-item .value {
  font-size: 2.2em;
  font-weight: bold;
  color: #00796b; /* Teal 700 */
  line-height: 1.1;
  display: block;
}
.countdown-item .label {
  font-size: 0.75em;
  color: #004d40; /* Teal 900 */
  text-transform: uppercase;
  margin-top: 0.3rem;
  display: block;
}
@media (max-width: 768px) {
  .countdown-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .countdown-item .value {
    font-size: 1.8em;
  }
  .countdown-item .label {
    font-size: 0.7em;
  }
}
@media (max-width: 480px) {
  .countdown-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .countdown-item .value {
    font-size: 1.6em;
  }
  .countdown-item .label {
    font-size: 0.65em;
  }
}
.exclusion-section {
  border: 1px solid #80cbc4; /* Teal 200 */
  border-radius: 4px;
  background-color: #f0f8f7; /* Very light teal/almost white */
}
/* Styles for v-date-picker header and active buttons can be tricky with scoped.
   They might need to be global or use deep selectors if they don't apply.
   However, Vuetify themes should ideally handle this.
   If not, these might need to be in a global style file:
    .v-picker__header { background-color: #009688 !important; }
    .v-date-picker-month__day--selected .v-btn__content { color: white !important; }
    .v-btn--active.v-btn--variant-text .v-btn__overlay { background-color: #26A69A !important; }
*/
</style>
