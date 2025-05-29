import { createVuetify } from "vuetify";
import "vuetify/styles"; // Import Vuetify styles
import "@mdi/font/css/materialdesignicons.css"; // Ensure you are using css-loader

// Define your custom teal theme
const customTealTheme = {
  dark: false,
  colors: {
    background: "#E0F2F1", // Teal 50
    surface: "#FFFFFF",
    primary: "#009688", // Teal 500
    "primary-darken-1": "#00796B", // Teal 700
    secondary: "#00796B", // Teal 700 (can be different if needed)
    "secondary-darken-1": "#00695C", // Teal 800
    error: "#D32F2F",
    info: "#1976D2",
    success: "#388E3C",
    warning: "#FFA000",
    // Custom shades for UI elements (can be referenced directly in components if needed)
    teal1: "#E0F2F1", // Teal 50
    teal2: "#B2DFDB", // Teal 100
    teal3: "#80CBC4", // Teal 200
  },
};

export default createVuetify({
  theme: {
    defaultTheme: "customTealTheme",
    themes: {
      customTealTheme,
    },
  },
  icons: {
    defaultSet: "mdi", // This is already the default value - only for display purposes
  },
});
