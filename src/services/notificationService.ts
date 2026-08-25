import { WorkoutReminderConfig } from '../types';

/**
 * Service to manage browser notifications and local scheduling for daily workout reminders.
 */

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Browser Notifications are not supported in this environment.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Synthesizes a subtle, pleasant chime using the Web Audio API without needing external MP3 files.
 */
export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Chime Note 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Chime Note 2 (harmonious finish)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch {
    // Audio might be blocked until user gesture, ignore silently
  }
};

export interface SendNotificationOptions {
  body?: string;
  tag?: string;
  playSound?: boolean;
  onClick?: () => void;
}

/**
 * Dispatches an instant web notification if permission is granted.
 */
export const sendWorkoutNotification = (
  title: string,
  options: SendNotificationOptions = {}
): Notification | null => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const { body, tag = 'fitai-workout-reminder', playSound = true, onClick } = options;

  if (playSound) {
    playNotificationSound();
  }

  try {
    const notification = new Notification(title, {
      body: body || 'Hora de manter a consistência! Seu treino de hoje está pronto no FitAI.',
      icon: '/icon.png',
      tag,
      badge: '/icon.png',
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      if (onClick) onClick();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Failed to trigger web notification:', error);
    return null;
  }
};

/**
 * Evaluates the reminder config against current time and executes if matching.
 */
export const evaluateWorkoutReminder = (
  config: WorkoutReminderConfig,
  workoutTitle?: string
) => {
  if (!config.enabled || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // Check if today is an active day
  const isScheduledDay = config.daysOfWeek.includes(currentDayOfWeek);
  if (!isScheduledDay) return;

  // Check if current time matches scheduled time
  if (currentTimeStr === config.time) {
    const todayStr = now.toISOString().split('T')[0];
    const triggerKey = `fitai_reminder_triggered_${todayStr}_${config.time}`;

    // Prevent duplicate triggers in the same minute window
    if (localStorage.getItem(triggerKey)) {
      return;
    }

    localStorage.setItem(triggerKey, 'true');

    const motivationalTitle = '🔥 Hora do seu Treino FitAI!';
    const notificationBody = config.customMessage
      ? config.customMessage
      : workoutTitle
      ? `Hoje é dia de ${workoutTitle}. Mantenha o foco e alcance seu objetivo!`
      : 'Seu treino do dia está pronto. Vista a roupa de treino e vamos nessa!';

    sendWorkoutNotification(motivationalTitle, {
      body: notificationBody,
      playSound: config.soundEnabled ?? true,
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }
    });
  }
};
