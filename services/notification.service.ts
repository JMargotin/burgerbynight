import { db } from "@/lib/firebase";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { Platform } from "react-native";

/**
 * Fonction utilitaire pour ajouter un délai
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationToken {
  uid: string;
  token: string;
  deviceId: string;
  platform: string;
  createdAt: number;
}

/**
 * Demande les permissions de notification et enregistre le token
 */
export async function registerForPushNotificationsAsync(
  uid: string
): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22C55E",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Push token:", token);

      // Sauvegarder le token dans Firestore (avec gestion d'erreur)
      await saveNotificationToken(uid, token);
    } catch (error) {
      console.error("Error getting push token:", error);
      // Même en cas d'erreur, on retourne le token si on l'a obtenu
      return token;
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

/**
 * Sauvegarde le token de notification dans Firestore
 */
async function saveNotificationToken(
  uid: string,
  token: string
): Promise<void> {
  try {
    // Utiliser un ID unique basé sur l'UID et le token
    const deviceId = `${uid}_${token.slice(-8)}`;
    const notificationToken: NotificationToken = {
      uid,
      token,
      deviceId,
      platform: Platform.OS,
      createdAt: Date.now(),
    };

    // Essayer de sauvegarder dans la collection notificationTokens
    await setDoc(doc(db, "notificationTokens", deviceId), notificationToken);
    console.log("Notification token saved for user:", uid);
  } catch (error: any) {
    console.error("Error saving notification token:", error);

    // Si c'est une erreur de permissions, essayer une approche alternative
    if (
      error?.code === "permission-denied" ||
      error?.message?.includes("permissions")
    ) {
      console.warn(
        "Permissions insuffisantes pour notificationTokens, tentative avec userTokens..."
      );

      try {
        // Essayer de sauvegarder dans une sous-collection de l'utilisateur
        const userDeviceId = `${uid}_${token.slice(-8)}`;
        await setDoc(
          doc(db, "users", uid, "notificationTokens", userDeviceId),
          {
            token,
            deviceId: userDeviceId,
            platform: Platform.OS,
            createdAt: Date.now(),
          }
        );
        console.log("Notification token saved in user subcollection:", uid);
        return;
      } catch (subError: any) {
        console.error("Error saving in user subcollection:", subError);
      }

      console.warn(
        "Impossible de sauvegarder le token de notification. Les notifications push ne fonctionneront pas."
      );
      return;
    }

    // Pour les autres erreurs, on continue aussi
    console.warn(
      "Impossible de sauvegarder le token de notification, mais on continue..."
    );
  }
}

/**
 * Envoie une notification à tous les utilisateurs
 */
export async function sendNotificationToAllUsers(
  title: string,
  body: string,
  data?: any
): Promise<{ sent: number; failed: number }> {
  try {
    // Récupérer tous les tokens de notification (collection principale)
    let tokens: NotificationToken[] = [];

    try {
      const tokensSnap = await getDocs(collection(db, "notificationTokens"));
      tokens = tokensSnap.docs.map((doc) => doc.data() as NotificationToken);
    } catch (error) {
      console.warn(
        "Impossible de récupérer les tokens de la collection principale:",
        error
      );
    }

    // Si pas de tokens dans la collection principale, essayer de récupérer depuis les sous-collections utilisateurs
    if (tokens.length === 0) {
      console.log(
        "Aucun token dans la collection principale, recherche dans les sous-collections..."
      );

      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const userTokens: NotificationToken[] = [];

        for (const userDoc of usersSnap.docs) {
          try {
            const userTokensSnap = await getDocs(
              collection(db, "users", userDoc.id, "notificationTokens")
            );

            userTokensSnap.docs.forEach((tokenDoc) => {
              const tokenData = tokenDoc.data();
              userTokens.push({
                uid: userDoc.id,
                token: tokenData.token,
                deviceId: tokenData.deviceId,
                platform: tokenData.platform,
                createdAt: tokenData.createdAt,
              });
            });
          } catch (error) {
            // Ignorer les erreurs pour les utilisateurs individuels
          }
        }

        tokens = userTokens;
        console.log(
          `Tokens récupérés depuis les sous-collections: ${tokens.length}`
        );
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des tokens depuis les sous-collections:",
          error
        );
      }
    }

    if (tokens.length === 0) {
      console.log("No notification tokens found");
      return { sent: 0, failed: 0 };
    }

    console.log(`Envoi de notifications à ${tokens.length} appareils...`);

    // Préparer les messages
    const messages = tokens.map((token) => ({
      to: token.token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    // Envoyer les notifications par lots de 50 (plus petit pour éviter les timeouts)
    const CHUNK_SIZE = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(messages.length / CHUNK_SIZE);

      console.log(
        `Envoi du lot ${chunkNumber}/${totalChunks} (${chunk.length} notifications)...`
      );

      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(chunk),
        });

        const result = await response.json();

        // Compter les succès et échecs
        if (Array.isArray(result.data)) {
          result.data.forEach((item: any) => {
            if (item.status === "ok") {
              sent++;
            } else {
              failed++;
              console.error("Failed to send notification:", item);
            }
          });
        } else {
          // Si c'est un seul message
          if (result.status === "ok") {
            sent++;
          } else {
            failed++;
            console.error("Failed to send notification:", result);
          }
        }

        console.log(
          `Lot ${chunkNumber} terminé: ${sent} succès, ${failed} échecs`
        );

        // Délai entre les lots pour éviter de surcharger l'API
        if (i + CHUNK_SIZE < messages.length) {
          await delay(1000); // 1 seconde de délai
        }
      } catch (error) {
        console.error(
          `Error sending notification chunk ${chunkNumber}:`,
          error
        );
        failed += chunk.length;
      }
    }

    console.log(
      `✅ Toutes les notifications envoyées: ${sent} succès, ${failed} échecs`
    );
    return { sent, failed };
  } catch (error) {
    console.error("Error sending notifications to all users:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Envoie une notification à un utilisateur spécifique
 */
export async function sendNotificationToUser(
  uid: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    // Récupérer les tokens de l'utilisateur
    const tokensSnap = await getDocs(
      query(collection(db, "notificationTokens"), where("uid", "==", uid))
    );

    if (tokensSnap.empty) {
      console.log("No notification tokens found for user:", uid);
      return false;
    }

    const tokens = tokensSnap.docs.map(
      (doc) => doc.data() as NotificationToken
    );

    // Envoyer à tous les appareils de l'utilisateur
    const messages = tokens.map((token) => ({
      to: token.token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log("Notification sent to user:", uid, result);
    return true;
  } catch (error) {
    console.error("Error sending notification to user:", error);
    return false;
  }
}

/**
 * Supprime les tokens de notification d'un utilisateur
 */
export async function removeNotificationTokens(uid: string): Promise<void> {
  try {
    const tokensSnap = await getDocs(
      query(collection(db, "notificationTokens"), where("uid", "==", uid))
    );

    const batch = writeBatch(db);
    tokensSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("Notification tokens removed for user:", uid);
  } catch (error) {
    console.error("Error removing notification tokens:", error);
  }
}
