// theme.ts
import { Dimensions, Platform } from "react-native";

// Get screen width
const { width } = Dimensions.get("window");

// Responsive multipliers (mobile, tablet, desktop)
const scale = width < 400 ? 0.9 : width < 768 ? 1 : 1.2;

const theme = {
  colors: {
    primary: "#E30613",   // KeNIC Red
    secondary: "#009739", // Kenyan Green
    dark: "#1A1A1A",      // Dark Gray / Black
    light: "#F5F5F5",     // Light Gray background
    accent: "#666666",    // Muted Gray for text/icons
    white: "#FFFFFF",     // Pure White
    black: "#000000",     // Pure Black (extra for flexibility)

    // Semantic / Status colors
    success: "#28A745",   // Success Green
    warning: "#FFC107",   // Warning Yellow
    error: "#DC3545",     // Error Red
    info: "#17A2B8",      // Info Blue

    // Neutral grays (for better UI contrast scaling)
    gray100: "#F8F9FA",
    gray200: "#E9ECEF",
    gray300: "#DEE2E6",
    gray400: "#CED4DA",
    gray500: "#ADB5BD",
    gray600: "#6C757D",
    gray700: "#495057",
    gray800: "#343A40",
    gray900: "#212529",

    // Text contrast helpers
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onLight: "#1A1A1A",
    onDark: "#FFFFFF",
  },

  // Light & Dark mode palettes
  palette: {
    light: {
      background: "#F5F5F5",
      surface: "#FFFFFF",
      text: "#1A1A1A",
    },
    dark: {
      background: "#121212",
      surface: "#1E1E1E",
      text: "#FFFFFF",
    },
  },

  typography: {
    fontFamily: {
      regular: Platform.select({ web: "Inter, Arial, sans-serif", default: "System" }),
      medium: Platform.select({ web: "Inter, Arial, sans-serif", default: "System" }),
      bold: Platform.select({ web: "Inter, Arial, sans-serif", default: "System" }),
    },
    fontWeight: {
      regular: "400",
      medium: "500",
      bold: "700",
    },
    fontSize: {
      xs: 12 * scale,
      sm: 14 * scale,
      md: 16 * scale,
      lg: 20 * scale,
      xl: 24 * scale,
      xxl: 32 * scale,
      display: 40 * scale, // Extra-large for headers/hero
    },
    lineHeight: {
      compact: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },

  spacing: (factor: number) => factor * 8 * scale,

  // Layout spacing tokens for consistency
  layout: {
    container: 24 * scale, // Page padding
    gutter: 16 * scale,    // Between cards
    section: 32 * scale,   // Between sections
  },

  radius: {
    xs: 4,
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    pill: 9999,
    full: 99999,
  },

  shadow: {
    light: Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 3px rgba(0,0,0,0.12)",
      },
    }),
    medium: Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0px 2px 6px rgba(0,0,0,0.16)",
      },
    }),
    heavy: Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0px 4px 12px rgba(0,0,0,0.20)",
      },
    }),
    extra: Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0px 6px 16px rgba(0,0,0,0.25)",
      },
    }),
  },

  // State styles
  states: {
    hover: "rgba(0,0,0,0.04)",
    pressed: "rgba(0,0,0,0.08)",
    disabled: "rgba(0,0,0,0.3)",
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  },

  // Animation presets
  animation: {
    fast: "150ms ease-in-out",
    normal: "300ms ease-in-out",
    slow: "500ms ease",
  },
};

export default theme;
