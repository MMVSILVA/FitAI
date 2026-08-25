import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Clock, 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Play, 
  Save, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { WorkoutReminderConfig } from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendWorkoutNotification,
  playNotificationSound,
  evaluateWorkoutReminder
} from '../services/notificationService';

const DAYS = [
  { id: 1, label: 'Seg', name: 'Segunda-feira' },
  { id: 2, label: 'Ter', name: 'Terça-feira' },
  { id: 3, label: 'Qua', name: 'Quarta-feira' },
  { id: 4, label: 'Qui', name: 'Quinta-feira' },
  { id: 5, label: 'Sex', name: 'Sexta-feira' },
  { id: 6, label: 'Sáb', name: 'Sábado' },
  { id: 0, label: 'Dom', name: 'Domingo' },
];

interface WorkoutReminderWidgetProps {
  className?: string;
  onSaved?: () => void;
}

export const WorkoutReminderWidget: React.FC<WorkoutReminderWidgetProps> = ({ 
  className = '',
  onSaved 
}) => {
  const { user, profile, setProfile, plan } = useUser();

  const defaultConfig: WorkoutReminderConfig = {
    enabled: false,
    time: '07:30',
    daysOfWeek: [1, 2, 3, 4, 5], // Seg a Sex
    customMessage: '',
    soundEnabled: true,
  };

  const initialConfig = profile?.workoutReminder || defaultConfig;

  const [config, setConfig] = useState<WorkoutReminderConfig>(initialConfig);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [testTriggered, setTestTriggered] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  useEffect(() => {
    if (profile?.workoutReminder) {
      setConfig(profile.workoutReminder);
    }
  }, [profile?.workoutReminder]);

  // Background reminder scheduler loop while the tab is open
  useEffect(() => {
    if (!config.enabled) return;

    // Check every 30 seconds
    const interval = setInterval(() => {
      const todayDayFocus = plan?.days?.[0]?.focus || plan?.title || 'Treino do Dia';
      evaluateWorkoutReminder(config, todayDayFocus);
    }, 30000);

    return () => clearInterval(interval);
  }, [config, plan]);

  const handleToggleEnable = async (newEnabled: boolean) => {
    if (newEnabled) {
      if (!supported) {
        alert('Seu navegador atual não suporta notificações nativas.');
        return;
      }

      if (permission !== 'granted') {
        const granted = await requestNotificationPermission();
        setPermission(getNotificationPermission());
        if (!granted) {
          return;
        }
      }
    }

    const updated = { ...config, enabled: newEnabled };
    setConfig(updated);
    await saveToDatabase(updated);
  };

  const toggleDay = (dayId: number) => {
    const exists = config.daysOfWeek.includes(dayId);
    let newDays: number[];
    if (exists) {
      newDays = config.daysOfWeek.filter((d) => d !== dayId);
    } else {
      newDays = [...config.daysOfWeek, dayId].sort();
    }
    setConfig({ ...config, daysOfWeek: newDays });
  };

  const selectAllDays = () => {
    setConfig({ ...config, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
  };

  const selectWeekdays = () => {
    setConfig({ ...config, daysOfWeek: [1, 2, 3, 4, 5] });
  };

  const saveToDatabase = async (overrideConfig?: WorkoutReminderConfig) => {
    const toSave = overrideConfig || config;
    setIsSaving(true);
    try {
      if (user?.uid && db) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          workoutReminder: toSave,
          updatedAt: new Date().toISOString()
        });
      }

      if (profile) {
        setProfile({ ...profile, workoutReminder: toSave });
      }

      // Also cache in localStorage
      localStorage.setItem('fitai_workout_reminder_config', JSON.stringify(toSave));

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Error saving workout reminder configuration:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!supported) {
      alert('Seu navegador não possui suporte a notificações.');
      return;
    }

    if (permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermission(getNotificationPermission());
      if (!granted) {
        alert('Permissão de notificações não foi concedida no navegador.');
        return;
      }
    }

    setTestTriggered(true);
    setTimeout(() => setTestTriggered(false), 2500);

    const todayWorkoutTitle = plan?.days?.[0]?.focus || plan?.title || 'Treino Hipertrofia';

    sendWorkoutNotification('🔥 Hora do Treino FitAI! (Teste)', {
      body: `Notificação configurada com sucesso para às ${config.time}. Hoje é dia de foco total no treino!`,
      playSound: config.soundEnabled,
      onClick: () => {
        window.focus();
      }
    });
  };

  return (
    <div className={`bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden ${className}`}>
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Enable Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            config.enabled 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
              : 'bg-gray-100 dark:bg-zinc-900 text-gray-400 border border-gray-200 dark:border-white/10'
          }`}>
            {config.enabled ? <BellRing className="w-6 h-6 animate-pulse" /> : <BellOff className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-black dark:text-white tracking-tight">Lembretes Diários de Treino</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                config.enabled 
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
              }`}>
                {config.enabled ? 'Ativado' : 'Desativado'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Notificações do navegador para manter o foco e nunca perder um dia de treino
            </p>
          </div>
        </div>

        {/* Master Switch Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            onClick={() => handleToggleEnable(!config.enabled)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              config.enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                config.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {config.enabled ? (
                <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3]" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Permission Blocked Warning */}
      {permission === 'denied' && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Notificações Bloqueadas no Navegador</p>
            <p>
              Para receber os lembretes de treino, clique no ícone de <strong>cadeado/configurações</strong> ao lado da URL no seu navegador e permita as <strong>Notificações</strong> para este site.
            </p>
          </div>
        </div>
      )}

      {/* Configuration Controls */}
      <div className={`space-y-6 transition-opacity duration-300 ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        
        {/* Row 1: Time Picker & Sound Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Time Picker */}
          <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-white/5 rounded-2xl p-4">
            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-500" /> Horário do Lembrete
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={config.time}
                onChange={(e) => setConfig({ ...config, time: e.target.value })}
                className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-lg font-black text-black dark:text-white outline-none focus:border-purple-500 w-full shadow-sm"
              />
              <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                Horário Local
              </span>
            </div>
          </div>

          {/* Sound & Alert Tone */}
          <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-green-500" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />} Alerta Sonoro
            </label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Tocar toque motivacional
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextSound = !config.soundEnabled;
                  setConfig({ ...config, soundEnabled: nextSound });
                  if (nextSound) playNotificationSound();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                  config.soundEnabled 
                    ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-white/10 text-gray-400'
                }`}
              >
                {config.soundEnabled ? 'Ativado' : 'Mudo'}
              </button>
            </div>
          </div>

        </div>

        {/* Row 2: Days of the Week Selection */}
        <div className="bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-white/5 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-500" /> Dias de Treino Ativos
            </label>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectWeekdays}
                className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:underline"
              >
                Seg - Sex
              </button>
              <span className="text-gray-300 dark:text-zinc-700">•</span>
              <button
                type="button"
                onClick={selectAllDays}
                className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:underline"
              >
                Todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {DAYS.map((day) => {
              const isSelected = config.daysOfWeek.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`py-3 px-1 sm:px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 scale-[1.02]'
                      : 'bg-white dark:bg-zinc-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-purple-500/40'
                  }`}
                  title={day.name}
                >
                  <span>{day.label}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: Test Notification & Save */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestNotification}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-purple-500/40 bg-white dark:bg-zinc-900 text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-purple-500" />
            {testTriggered ? 'Notificação Enviada!' : 'Testar Notificação'}
          </button>

          <button
            type="button"
            onClick={() => saveToDatabase()}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Preferências
          </button>
        </div>

      </div>

      {/* Success Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-xs font-black flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Preferências de lembrete salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
