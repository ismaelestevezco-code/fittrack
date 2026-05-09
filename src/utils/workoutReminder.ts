import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_KEY = 'workout_reminder_enabled';
const REMINDER_HOUR_KEY = 'workout_reminder_hour';

export async function isReminderEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(REMINDER_KEY);
  return val === 'true';
}

export async function getReminderHour(): Promise<number> {
  const val = await AsyncStorage.getItem(REMINDER_HOUR_KEY);
  return val ? parseInt(val, 10) : 9;
}

// Programa el recordatorio diario a la hora especificada.
// Cancela cualquier recordatorio previo antes de crear el nuevo.
export async function scheduleWorkoutReminder(hour: number): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await cancelWorkoutReminder();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💪 Hora de entrenar',
      body: 'Tienes una sesión planificada hoy. ¡Abre FitTrack y a por ello!',
      sound: true,
      data: { type: 'workout-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });

  await AsyncStorage.setItem(REMINDER_KEY, 'true');
  await AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour));
  return true;
}

// Cancela el recordatorio diario y limpia el estado persistido.
export async function cancelWorkoutReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'workout-reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
  await AsyncStorage.setItem(REMINDER_KEY, 'false');
}
