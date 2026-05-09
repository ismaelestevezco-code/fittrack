import * as Notifications from 'expo-notifications';

const COUNTDOWN_ID = 'fittrack-countdown';
const END_BASE_ID = 'fittrack-timer-end';
// 4 alerts, 4 seconds apart — gives 16 seconds of repeated pings
const END_REPEAT_COUNT = 4;
const END_REPEAT_INTERVAL_S = 4;
const PAUSE_ACTION = 'pause';
const CATEGORY = 'fittrack-timer';

let pauseCallback: (() => void) | null = null;

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  return `${pad2(Math.floor(totalSec / 60))}:${pad2(totalSec % 60)}`;
}

function formatEndTime(endTimestampMs: number): string {
  const d = new Date(endTimestampMs);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function endNotificationId(index: number) {
  return `${END_BASE_ID}-${index}`;
}

export function registerPauseCallback(cb: () => void): void {
  pauseCallback = cb;
}

export function unregisterPauseCallback(): void {
  pauseCallback = null;
}

export function triggerPause(): void {
  pauseCallback?.();
}

export async function setupTimerNotificationCategory(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    {
      identifier: PAUSE_ACTION,
      buttonTitle: 'Pausar',
      options: { isDestructive: false, opensAppToForeground: true },
    },
  ]);
  return true;
}

// Schedules 4 end notifications, 4 seconds apart, so the phone sounds 4 times in quick succession
async function scheduleEndNotifications(secondsFromNow: number): Promise<void> {
  for (let i = 0; i < END_REPEAT_COUNT; i++) {
    const delay = secondsFromNow + i * END_REPEAT_INTERVAL_S;
    await Notifications.scheduleNotificationAsync({
      identifier: endNotificationId(i),
      content: {
        title: '⚡ ¡DESCANSO TERMINADO! ⚡',
        body: 'FITTRACK  ·  Continúa el entrenamiento',
        sound: true,
        data: { type: 'timer-end' },
        color: '#7C3AED',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delay },
    });
  }
}

async function cancelScheduledEndNotifications(): Promise<void> {
  await Promise.all(
    Array.from({ length: END_REPEAT_COUNT }, (_, i) =>
      Notifications.cancelScheduledNotificationAsync(endNotificationId(i)),
    ),
  );
}

async function dismissEndNotifications(): Promise<void> {
  await Promise.all(
    Array.from({ length: END_REPEAT_COUNT }, (_, i) =>
      Notifications.dismissNotificationAsync(endNotificationId(i)),
    ),
  );
}

export async function startTimerNotifications(remainingMs: number): Promise<void> {
  try {
    const secondsFromNow = Math.max(1, Math.round(remainingMs / 1000));
    const endTimestampMs = Date.now() + remainingMs;
    const endTimeStr = formatEndTime(endTimestampMs);

    await Notifications.scheduleNotificationAsync({
      identifier: COUNTDOWN_ID,
      content: {
        title: `⚡ ${formatMs(remainingMs)} ⚡`,
        body: `FITTRACK  ·  DESCANSO  ·  termina ${endTimeStr}`,
        sound: false,
        categoryIdentifier: CATEGORY,
        sticky: false,
        color: '#7C3AED',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });

    await scheduleEndNotifications(secondsFromNow);
  } catch {
    // Notifications not available; fail silently
  }
}

// Called every second while the timer is running — updates the countdown in the notification
export async function updateTimerNotification(remainingMs: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: COUNTDOWN_ID,
      content: {
        title: `⚡ ${formatMs(remainingMs)} ⚡`,
        body: `FITTRACK  ·  DESCANSO  ·  termina ${formatEndTime(Date.now() + remainingMs)}`,
        sound: false,
        categoryIdentifier: CATEGORY,
        sticky: false,
        color: '#7C3AED',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });
  } catch {
    // Ignore update errors silently
  }
}

export async function finishTimerNotifications(): Promise<void> {
  try {
    await cancelScheduledEndNotifications();
    await Notifications.dismissNotificationAsync(COUNTDOWN_ID);
    // Fire 4 immediate end notifications with slight delays via scheduling
    for (let i = 0; i < END_REPEAT_COUNT; i++) {
      const delay = i * END_REPEAT_INTERVAL_S;
      await Notifications.scheduleNotificationAsync({
        identifier: endNotificationId(i),
        content: {
          title: '⚡ ¡DESCANSO TERMINADO! ⚡',
          body: 'FITTRACK  ·  Continúa el entrenamiento',
          sound: true,
          data: { type: 'timer-end' },
          color: '#7C3AED',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: delay === 0
          ? null
          : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delay },
      });
    }
  } catch {
    // Fail silently
  }
}

export async function cancelTimerNotifications(): Promise<void> {
  try {
    await Promise.all([
      Notifications.dismissNotificationAsync(COUNTDOWN_ID),
      Notifications.cancelScheduledNotificationAsync(COUNTDOWN_ID),
      cancelScheduledEndNotifications(),
      dismissEndNotifications(),
    ]);
  } catch {
    // Fail silently
  }
}
