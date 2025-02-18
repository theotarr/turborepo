import type { Subscription } from "expo-modules-core";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import create from "zustand";

interface NotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  setExpoPushToken: (token: string | null) => void;
  setNotification: (notification: Notifications.Notification | null) => void;
  setError: (error: Error | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  expoPushToken: null,
  notification: null,
  error: null,
  setExpoPushToken: (token) => set({ expoPushToken: token }),
  setNotification: (notification) => set({ notification }),
  setError: (error) => set({ error }),
}));

export const useNotificationSetup = () => {
  const { setExpoPushToken, setNotification, setError } =
    useNotificationStore();

  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "🔔 Notification Response: ",
          JSON.stringify(response, null, 2),
          JSON.stringify(response.notification.request.content.data, null, 2),
        );
        // Handle the notification response here
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [setExpoPushToken, setNotification, setError]);
};
