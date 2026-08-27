import { useEffect } from 'react';
import { useUser } from '../store/userStore';
import { 
  registerServiceWorker, 
  evaluateWorkoutReminder 
} from '../services/notificationService';

export function GlobalWorkoutReminderScheduler() {
  const { profile, plan } = useUser();

  // Register service worker on application startup
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Continuous background evaluator for scheduled workout push notifications
  useEffect(() => {
    const config = profile?.workoutReminder;
    if (!config || !config.enabled) return;

    // Immediate check
    const todayFocus = plan?.days?.[0]?.focus || plan?.title || 'Treino do Dia';
    evaluateWorkoutReminder(config, todayFocus);

    // Periodic evaluation every 15 seconds
    const interval = setInterval(() => {
      evaluateWorkoutReminder(config, todayFocus);
    }, 15000);

    return () => clearInterval(interval);
  }, [profile?.workoutReminder, plan]);

  return null;
}
