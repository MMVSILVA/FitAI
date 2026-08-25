import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Timer, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Dumbbell, 
  Sparkles,
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface RestIntervalTimerProps {
  initialSeconds?: number;
  compact?: boolean;
  className?: string;
  onFinished?: () => void;
}

export const RestIntervalTimer: React.FC<RestIntervalTimerProps> = ({
  initialSeconds = 60,
  compact = false,
  className = '',
  onFinished
}) => {
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets, setTotalSets] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play beep sound using Web Audio API (does not require external mp3 files)
  const playBeep = useCallback((frequency = 880, duration = 0.25, count = 2) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency + (i * 120), ctx.currentTime + (i * 0.2));
        gain.gain.setValueAtTime(0.3, ctx.currentTime + (i * 0.2));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.2) + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + (i * 0.2));
        osc.stop(ctx.currentTime + (i * 0.2) + duration);
      }
    } catch (e) {
      console.warn("Audio playback not supported in current state:", e);
    }
  }, [soundEnabled]);

  // Main countdown tick effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playBeep(880, 0.3, 3);
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 2500);
            if (onFinished) onFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, playBeep, onFinished]);

  // Reset timer
  const handleReset = (newDuration?: number) => {
    const dur = newDuration !== undefined ? newDuration : targetSeconds;
    setIsRunning(false);
    setTimeLeft(dur);
    setIsFlashing(false);
  };

  // Toggle start / pause
  const handleTogglePlay = () => {
    if (timeLeft === 0) {
      setTimeLeft(targetSeconds);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  // Preset button click
  const handleSelectPreset = (seconds: number) => {
    setTargetSeconds(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
  };

  // Adjust +/- seconds
  const handleAdjustTime = (delta: number) => {
    setTimeLeft((prev) => {
      const next = Math.max(5, prev + delta);
      if (!isRunning) setTargetSeconds(next);
      return next;
    });
  };

  // Complete set & start countdown
  const handleNextSet = () => {
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
    } else {
      setCurrentSet(1);
    }
    setTimeLeft(targetSeconds);
    setIsRunning(true);
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Progress ratio (0 to 1)
  const progressRatio = targetSeconds > 0 ? (targetSeconds - timeLeft) / targetSeconds : 0;
  const strokeDashoffset = 283 * (1 - progressRatio); // Circumference for r=45 is 2 * PI * 45 ~ 283

  const presets = [
    { label: '30s', value: 30, desc: 'Isometria' },
    { label: '45s', value: 45, desc: 'Padrão' },
    { label: '60s', value: 60, desc: 'Hipertrofia' },
    { label: '90s', value: 90, desc: 'Carga Média' },
    { label: '120s', value: 120, desc: 'Força' },
    { label: '180s', value: 180, desc: 'Potência' },
  ];

  return (
    <div 
      id="rest-interval-timer-card"
      className={`bg-white dark:bg-zinc-950 border transition-all duration-300 rounded-3xl p-6 shadow-xl relative overflow-hidden ${
        isFlashing 
          ? 'border-emerald-500 ring-4 ring-emerald-500/30 animate-pulse' 
          : 'border-gray-200 dark:border-white/10'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-black dark:text-white tracking-tight flex items-center gap-1.5">
              Temporizador de Descanso
              <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase">
                Entre Séries
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs transition-colors ${
              soundEnabled 
                ? 'bg-gray-100 dark:bg-zinc-900 text-purple-600 dark:text-purple-400' 
                : 'bg-gray-100 dark:bg-zinc-900 text-gray-400'
            }`}
            title={soundEnabled ? 'Som ativado' : 'Som desativado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-gray-100 dark:bg-zinc-900 transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex flex-col items-center justify-center my-2">
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Circular SVG gauge */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-gray-200 dark:stroke-zinc-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-300 ${
                timeLeft === 0 
                  ? 'stroke-emerald-500' 
                  : isRunning 
                    ? 'stroke-purple-600' 
                    : 'stroke-purple-400/60'
              }`}
              strokeWidth="6"
              strokeDasharray={276}
              strokeDashoffset={276 * (1 - (targetSeconds > 0 ? (targetSeconds - timeLeft) / targetSeconds : 0))}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Clock */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black tracking-tight text-black dark:text-white font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
              {timeLeft === 0 
                ? '🔔 Hora da Série!' 
                : isRunning 
                  ? 'Descansando...' 
                  : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Quick adjustments */}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => handleAdjustTime(-15)}
            className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            <Minus className="w-3 h-3" /> 15s
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(15)}
            className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 15s
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <button
          type="button"
          onClick={() => handleReset()}
          className="bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          className={`col-span-2 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Pausar Descanso
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> {timeLeft === 0 ? 'Recomeçar' : 'Iniciar Descanso'}
            </>
          )}
        </button>
      </div>

      {/* Presets List */}
      {!isMinimized && (
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Intervalos Pré-definidos
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleSelectPreset(p.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                    targetSeconds === p.value 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'bg-gray-50 dark:bg-zinc-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div>{p.label}</div>
                  <div className="text-[8px] opacity-70 font-normal truncate">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Set Tracker & Next Set Button */}
          <div className="bg-gray-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/5 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs font-bold text-black dark:text-white">
                  Série {currentSet} de {totalSets}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">
                Avança a série e ativa o cronômetro
              </p>
            </div>

            <button
              type="button"
              onClick={handleNextSet}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluir Série
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
