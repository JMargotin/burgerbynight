import "dotenv/config";
import { ConfigContext, ExpoConfig } from "expo/config";

const EAS_PROJECT_ID = "58880630-2b9e-435d-ba41-326832b50a17";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Burger By Night | BBN Le Mans",
  slug: "bbn",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "fr.jmstudio.burgerbynight",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: "fr.jmstudio.burgerbynight",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "L’app utilise l’appareil photo pour prendre des photos liées à vos commandes (ex. ticket, produit, QR code).",
    },
  },

  android: {
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: "resize",
    package: "fr.jmstudio.burgerbynight",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon/foreground.png",
      backgroundColor: "#ffffff",
    },
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "expo-font",
    "expo-web-browser",
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
    eas: { projectId: EAS_PROJECT_ID },
  },
});
