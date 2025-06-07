# Countdown & Breath Timer App

A versatile, single-page web application built with Vue 3 and Vuetify 3, featuring two main utilities: a highly customizable countdown timer and a guided breathing exercise timer. The app is designed with a clean, responsive interface and supports both light and dark themes based on a teal color palette.

**Live Demo:** [**https://skhatri.xyz/timer**](https://skhatri.xyz/timer)

---

## Features

The application is split into two main components, easily switchable via the navigation bar.

### 1. Future Countdown Timer

A tool to track the time remaining to any significant future date.

- **Dual-Mode Date Selection:**
  - **Calendar Mode:** Set a countdown to any specific date and time selected from a calendar.
  - **Age Mode:** Calculate a future target date by providing your birthday and a target age (e.g., countdown to your 40th birthday).
- **Time Exclusion:** Exclude a specific duration (e.g., 8 hours of sleep) from each day of the countdown. This unique feature adjusts the "effective" target date, showing a more accurate countdown of your "active" time.
- **Dynamic Display:** The countdown is shown in years, months, days, hours, minutes, and seconds, updating in real-time.
- **Informative UI:** Clearly displays the original target date and the effective target date when time exclusion is active.

### 2. Breath Timer (for Anulom Vilom / Nadi Shodhana)

A specialized timer designed to guide users through breathing exercises, particularly helpful for practices like **Anulom Vilom**.

_Anulom Vilom_, also known as Alternate Nostril Breathing or Nadi Shodhana Pranayama, is a significant yogic technique involving the control of subtle pranic energies flowing through specific channels in the body, known as ida and pingala nadis.

- **Customizable Sessions:**
  - **Interval:** Set the duration for each phase of breathing, from 3 to 30 seconds.
  - **Session Duration:** Set the total length of the exercise, from 5 to 60 minutes.
- **Dual Notification Methods:**
  - **Beep Sound:** A clear, audible beep signals the end of each interval.
  - **Voice Guide:** A human voice guides you through the exercise with the phrases "Inhale", "Hold", and "Exhale" at each interval, providing a more immersive experience.
- **Clear Visual Cues:** Displays the countdown for the current interval, the total session time remaining, and the active breathing phrase ("Inhale", "Hold", "Exhale").
- **Session Controls:** Full control with Start, Pause, Resume, and Stop buttons.
- **Screen Wake Lock:** Utilizes the browser's Wake Lock API (with a video fallback) to prevent the device from sleeping during a session, ensuring uninterrupted guidance.
- **Session Completion:** Congratulates the user with a voice notification upon completing the full session duration.

### Global Features

- **Light & Dark Themes:** Easily switch between a light teal and a dark teal theme using the sun/moon icon in the navigation bar. Your preference is saved in local storage.
- **Fully Responsive:** The layout adapts smoothly to all screen sizes, from mobile phones to desktops.
- **Persistent Settings:** All your settings for both timers are saved locally in your browser, so your configuration is ready for you on your next visit.

---

## Tech Stack

- **Framework:** Vue 3 (Composition API)
- **UI Library:** Vuetify 3
- **Build Tool:** Vite
- **Deployment:** GitHub Pages

---

## Local Setup

To run this project on your local machine:

1.  Clone the repository:
    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
    ```
2.  Navigate to the project directory:
    ```bash
    cd YOUR_REPO_NAME
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
