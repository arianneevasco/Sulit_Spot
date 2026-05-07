// ...existing code from notificationService.js...
// ─────────────────────────────────────────────────────────────────────────────
// services/notificationService.js
// Push Notifications — Expo Notifications + Firebase Cloud Messaging
//
// Satisfies: Device Feature (push notifications) requirement
//
// Responsibilities:
//   1. Set global notification display behavior (setNotificationHandler)
//   2. Request permission from user
//   3. Create Android notification channel
//   4. Retrieve Expo push token for this device
//   5. Provide foreground + tap listener functions for App.js
//
// IMPORTANT: Push notifications do NOT work on simulators/emulators.
//            Must test on a real physical device.
// ─────────────────────────────────────────────────────────────────────────────
import Constants from "expo-constants";
import { Platform } from "react-native";

const Notifications = require("expo-notifications") as {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  setNotificationChannelAsync: (
    channelId: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern: number[];
      lightColor: string;
      sound: string;
    },
  ) => Promise<void>;
  getExpoPushTokenAsync: (options: {
    projectId?: string;
  }) => Promise<{ data: string }>;
  addNotificationReceivedListener: (
    handler: (notification: Notification) => void,
  ) => { remove: () => void };
  addNotificationResponseReceivedListener: (
    handler: (response: NotificationResponse) => void,
  ) => { remove: () => void };
  AndroidImportance: { MAX: number };
};

type Notification = unknown;
type NotificationResponse = unknown;

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL NOTIFICATION BEHAVIOR
// Controls how notifications appear when the app is OPEN (foreground)
// This must be set before any listener is registered
// ─────────────────────────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Show banner even when app is open
    shouldShowList: true, // Show in notification center/list
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// GET FCM PUSH TOKEN
//
// 1. Checks if running on a real device (not simulator)
// 2. Requests notification permission from user
// 3. Creates Android notification channel (required for Android 8+)
// 4. Returns the Expo push token string or null
//
// The token is saved to Firestore users/{uid}.fcmToken by authService.js
// Cloud Functions read this token to send targeted notifications
// ─────────────────────────────────────────────────────────────────────────────
export const getFCMToken = async (): Promise<string | null> => {
  // Web cannot receive push notifications in this setup
  if (Platform.OS === "web") {
    console.warn("[Notifications] Push requires a real physical device.");
    return null;
  }

  // Check existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] Permission denied by user.");
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sulitspot-default", {
      name: "Sulit Spot",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E8711A",
      sound: "default",
    });
  }

  // Get the unique Expo push token for this device
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId:
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId,
  });

  return tokenData.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// FOREGROUND NOTIFICATION LISTENER
//
// Fires when a notification arrives while the app is OPEN
// The banner is shown automatically by setNotificationHandler above
// Use this if you need to do anything extra (e.g., update a badge count)
//
// Returns: unsubscribe function — call in useEffect cleanup
// ─────────────────────────────────────────────────────────────────────────────
export const onForegroundNotification = (
  handler: (notification: Notification) => void,
) => {
  const sub = Notifications.addNotificationReceivedListener(handler);
  return () => sub.remove();
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TAP LISTENER
//
// Fires when user TAPS a notification (works in foreground, background, and
// when the app was closed — quit state)
//
// Use this to navigate to the relevant screen based on notification data
// handler receives the full response object:
//   response.notification.request.content.data → your custom payload
//
// Notification types sent by Cloud Functions:
//   { type: 'POST_OUTDATED', postId: '...', postTitle: '...' }
//     → navigate to EditPostScreen
//   { type: 'POST_HIDDEN', postId: '...', postTitle: '...' }
//     → navigate to MyPostsScreen
//
// Returns: unsubscribe function — call in useEffect cleanup
// ─────────────────────────────────────────────────────────────────────────────
export const onNotificationTap = (
  handler: (response: NotificationResponse) => void,
) => {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
};
