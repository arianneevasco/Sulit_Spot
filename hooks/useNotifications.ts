import type { Notification, NotificationResponse } from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
    onForegroundNotification,
    onNotificationTap,
} from "../services/notificationService";

type NotificationData = {
  type?: "POST_OUTDATED" | "POST_HIDDEN";
  postId?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// useNotifications
// Sets up foreground + tap listeners using expo-router's useRouter.
// Call once in app/_layout.tsx.
// ─────────────────────────────────────────────────────────────────────────────
export const useNotifications = () => {
  const router = useRouter();
  const foregroundUnsub = useRef<(() => void) | null>(null);
  const tapUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Foreground listener — notification arrives while app is open
    foregroundUnsub.current = onForegroundNotification(
      (notification: Notification) => {
        console.log(
          "[Notification] Received in foreground:",
          notification.request.content.title,
        );
      },
    );

    // Tap listener — user taps a notification
    tapUnsub.current = onNotificationTap((response: NotificationResponse) => {
      const data = response.notification.request.content
        .data as NotificationData;

      if (data?.type === "POST_OUTDATED" && data.postId) {
        // Go to edit screen for that post
        router.push({ pathname: "/edit", params: { postId: data.postId } });
      } else if (data?.type === "POST_HIDDEN") {
        // Go to my posts tab
        router.push("/(tabs)/myposts");
      }
    });

    return () => {
      if (foregroundUnsub.current) foregroundUnsub.current();
      if (tapUnsub.current) tapUnsub.current();
    };
  }, []);
};
