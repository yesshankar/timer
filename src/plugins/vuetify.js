import { createVuetify } from "vuetify";
import "vuetify/styles"; // Import Vuetify styles
import "@mdi/font/css/materialdesignicons.css"; // Ensure you are using css-loader

// Define your custom light teal theme
const customTealTheme = {
  dark: false,
  colors: {
    background: "#E0F2F1", // Teal 50
    surface: "#FFFFFF", // White for cards, etc.
    primary: "#009688", // Teal 500
    "primary-darken-1": "#00796B", // Teal 700
    secondary: "#00796B", // Teal 700
    "secondary-darken-1": "#00695C", // Teal 800
    error: "#D32F2F", // Standard Red
    info: "#1976D2", // Standard Blue
    success: "#388E3C", // Standard Green
    warning: "#FFA000", // Standard Amber / Orange
    // Custom shades for UI elements
    teal1: "#E0F2F1", // Teal 50 (Often used as light background)
    teal2: "#B2DFDB", // Teal 100 (Countdown item background)
    teal3: "#80CBC4", // Teal 200 (Exclusion section border)
  },
};

// Define your custom dark teal theme
const customDarkTealTheme = {
  dark: true,
  colors: {
    background: "#122B2A", // Very dark desaturated teal
    surface: "#1F3C3A", // Darker teal for cards, dialogs
    primary: "#26A69A", // Teal 400 (brighter for dark bg)
    "primary-darken-1": "#00897B", // Teal 600
    secondary: "#00897B", // Teal 600
    "secondary-darken-1": "#00796B", // Teal 700
    error: "#EF5350", // Lighter Red for dark mode
    info: "#42A5F5", // Lighter Blue
    success: "#66BB6A", // Lighter Green
    warning: "#FFCA28", // Lighter Amber / Orange
    // Custom shades for UI elements in dark mode
    teal1: "#1A3A38", // Darker version of Teal 50 concept
    teal2: "#2C4A48", // Darker version of Teal 100 concept
    teal3: "#385A57", // Darker version of Teal 200 concept
  },
};

export default createVuetify({
  theme: {
    defaultTheme: "customTealTheme", // This will be the initial light theme
    themes: {
      customTealTheme,
      customDarkTealTheme, // Add the dark theme here
    },
  },
  icons: {
    defaultSet: "mdi",
  },
});
