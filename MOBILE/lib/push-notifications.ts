import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { registerPushDevice } from '@/lib/api-client';

let notificationHandlerConfigured = false;

/** Remote push requires a dev/production build — not Expo Go (SDK 53+). */
export function canUsePushNotifications(): boolean {
  return Device.isDevice && !isRunningInExpoGo();
}

async function getNotificationsModule() {
  if (!canUsePushNotifications()) {
    return null;
  }

  return import('expo-notifications');
}

async function ensureNotificationHandler(
  Notifications: Awaited<ReturnType<typeof getNotificationsModule>>,
): Promise<void> {
  if (!Notifications || notificationHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  try {
    await ensureNotificationHandler(Notifications);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'CardVault',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await registerPushDevice(api, token);
    return token;
  } catch {
    return null;
  }
}
