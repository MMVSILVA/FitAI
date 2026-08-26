import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Timer, 
  Clock, 
  Plus, 
  Minus, 
  Flag, 
  X, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Zap,
  BellRing
} from 'lucide-react';

interface WorkoutTimerProps {
  initialSeconds?: number;
  mode?: 'countdown' | 'stopwatch';
  exerciseName?: string;
  onFinished?: () => void;
  onClose?: () => void;
  isFloating?: boolean;
  className?: string;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  initialSeconds = 60,
  mode: initialMode = 'countdown',
  exerciseName,
  onFinished,
  onClose,
  isFloating = false,
  className = ''
}) => {
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>(initialMode);
  
  // Countdown State
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);
  const [countdownTime, setCountdownTime] = useState(initialSeconds);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Stopwatch State
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  
  // UI State
  const [isMinimized, setIsMinimized] = useState(false);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keyboard shortcut: ESC to close timer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Play audio tones using Web Audio API (cross-browser, zero external files)
  const playTone = useCallback((freq = 880, duration = 0.2, type: OscillatorType = 'sine', count = 1) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq + (i * 80), ctx.currentTime + (i * 0.15));
        gain.gain.setValueAtTime(0.25, ctx.currentTime + (i * 0.15));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.15) + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (i * 0.15));
        osc.stop(ctx.currentTime + (i * 0.15) + duration);
      }
    } catch (err) {
      console.warn("Audio Context playback error:", err);
    }
  }, [soundEnabled]);

  // Countdown timer effect
  useEffect(() => {
    if (isCountdownRunning && countdownTime > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdownTime(prev => {
          // Warning beeps on 3, 2, 1
          if (prev === 4 || prev === 3 || prev === 2) {
            playTone(660, 0.1, 'triangle', 1);
          }
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setIsCountdownRunning(false);
            playTone(1046, 0.4, 'sine', 3); // High triumph beep (C6)
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 3000);
            if (onFinished) onFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isCountdownRunning, countdownTime, playTone, onFinished]);

  // Stopwatch effect (10ms tick)
  useEffect(() => {
    if (isStopwatchRunning) {
      const startTime = Date.now() - stopwatchMs;
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchMs(Date.now() - startTime);
      }, 30);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }

    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning, stopwatchMs]);

  // Reset Countdown
  const handleResetCountdown = (newSecs?: number) => {
    const s = newSecs !== undefined ? newSecs : targetSeconds;
    setIsCountdownRunning(false);
    setCountdownTime(s);
    setIsFlashing(false);
  };

  // Toggle Countdown
  const handleToggleCountdown = () => {
    if (countdownTime === 0) {
      setCountdownTime(targetSeconds);
      setIsCountdownRunning(true);
    } else {
      setIsCountdownRunning(!isCountdownRunning);
    }
  };

  // Adjust countdown +/- seconds
  const handleAdjustCountdown = (delta: number) => {
    setCountdownTime(prev => {
      const next = Math.max(5, prev + delta);
      if (!isCountdownRunning) setTargetSeconds(next);
      return next;
    });
  };

  // Select preset
  const handleSelectPreset = (secs: number) => {
    setTargetSeconds(secs);
    setCountdownTime(secs);
    setIsCountdownRunning(true);
  };

  // Stopwatch Controls
  const handleToggleStopwatch = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchMs(0);
    setLaps([]);
  };

  const handleAddLap = () => {
    if (stopwatchMs > 0) {
      setLaps(prev => [stopwatchMs, ...prev]);
    }
  };

  // Formatter functions
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatStopwatch = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  const progressRatio = targetSeconds > 0 ? (targetSeconds - countdownTime) / targetSeconds : 0;
  const presets = [
    { label: '30s', value: 30, desc: 'Isometria' },
    { label: '45s', value: 45, desc: 'Padrão' },
    { label: '60s', value: 60, desc: 'Hipertrofia' },
    { label: '90s', value: 90, desc: 'Carga Alta' },
    { label: '120s', value: 120, desc: 'Força' },
    { label: '180s', value: 180, desc: 'Potência' },
  ];

  // Minimized view
  if (isMinimized && isFloating) {
    return (
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50 bg-zinc-900/95 backdrop-blur-xl border border-purple-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 hover:border-purple-500"
      >
        <div 
          className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer ${isCountdownRunning || isStopwatchRunning ? 'bg-purple-600 animate-pulse text-white' : 'bg-zinc-800 text-zinc-400'}`}
          onClick={() => setIsMinimized(false)}
        >
          {mode === 'countdown' ? <Timer className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </div>
        <div className="cursor-pointer" onClick={() => setIsMinimized(false)}>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            {mode === 'countdown' ? 'Descanso' : 'Cronômetro'}
          </p>
          <p className="text-lg font-black font-mono leading-none">
            {mode === 'countdown' ? formatCountdown(countdownTime) : formatStopwatch(stopwatchMs)}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button 
            onClick={() => setIsMinimized(false)}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Expandir"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
              title="Fechar Cronômetro"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`bg-zinc-900 text-white rounded-3xl border border-zinc-800 shadow-2xl p-5 sm:p-6 transition-all ${isFlashing ? 'ring-4 ring-green-500/80 bg-zinc-900' : ''} ${className}`}>
      
      {/* Top Bar: Mode Selector & Controls */}
      <div className="flex items-center justify-between gap-3 mb-5 border-b border-zinc-800 pb-4">
        {/* Mode Switcher */}
        <div className="flex items-center bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/50">
          <button
            onClick={() => setMode('countdown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              mode === 'countdown' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            Descanso
          </button>
          <button
            onClick={() => setMode('stopwatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              mode === 'stopwatch' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Cronômetro
          </button>
        </div>

        {/* Right Tools: Sound, Minimize, Close */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-all ${
              soundEnabled ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20' : 'text-zinc-500 bg-zinc-800 hover:text-zinc-300'
            }`}
            title={soundEnabled ? 'Alerta Sonoro Ativado (Bip nos 3s finais)' : 'Alerta Sonoro Silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {isFloating && (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
              title="Minimizar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-all"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {exerciseName && (
        <div className="mb-4 px-1">
          <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest block">Exercício em Andamento</span>
          <p className="text-sm font-bold text-zinc-200 truncate">{exerciseName}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COUNTDOWN / REST INTERVAL MODE */}
      {/* ========================================================================= */}
      {mode === 'countdown' && (
        <div className="space-y-5">
          {/* Main Visual Display */}
          <div className="flex flex-col items-center justify-center relative py-2">
            
            {/* SVG Circular Progress */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-zinc-800"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`transition-all duration-300 ${
                    countdownTime <= 5 && countdownTime > 0 
                      ? 'stroke-red-500 animate-pulse' 
                      : countdownTime === 0 
                      ? 'stroke-green-500' 
                      : 'stroke-purple-500'
                  }`}
                  strokeWidth="7"
                  strokeDasharray="264"
                  strokeDashoffset={264 * (1 - progressRatio)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Time Numbers in Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                  countdownTime <= 5 && countdownTime > 0 
                    ? 'text-red-400 animate-bounce' 
                    : countdownTime === 0 
                    ? 'text-green-400' 
                    : 'text-white'
                }`}>
                  {formatCountdown(countdownTime)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                  {isCountdownRunning ? 'Descansando...' : countdownTime === 0 ? 'Concluído!' : 'Tempo Restante'}
                </span>
              </div>
            </div>

            {/* Quick Adjust Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => handleAdjustCountdown(-15)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all active:scale-95"
                title="-15 segundos"
              >
                -15s
              </button>
              <button
                onClick={() => handleAdjustCountdown(15)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all active:scale-95"
                title="+15 segundos"
              >
                +15s
              </button>
            </div>
          </div>

          {/* Controls: Start/Pause, Reset */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleResetCountdown()}
              className="p-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl transition-all active:scale-95 shadow-md"
              title="Reiniciar Descanso"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleCountdown}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                isCountdownRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' 
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              {isCountdownRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> {countdownTime === 0 ? 'Repetir' : 'Iniciar Descanso'}
                </>
              )}
            </button>
          </div>

          {/* Presets Grid */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">
              Intervalos Rápidos
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {presets.map(p => (
                <button
                  key={p.value}
                  onClick={() => handleSelectPreset(p.value)}
                  className={`py-2 px-2 rounded-xl text-center border transition-all ${
                    targetSeconds === p.value 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-black' 
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-white font-bold'
                  }`}
                >
                  <p className="text-xs">{p.label}</p>
                  <p className="text-[8px] opacity-60 uppercase">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STOPWATCH / COUNT-UP MODE */}
      {/* ========================================================================= */}
      {mode === 'stopwatch' && (
        <div className="space-y-5">
          {/* Large Digital Stopwatch Display */}
          <div className="bg-black/40 border border-zinc-800 rounded-2xl p-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
              Tempo Decorrido
            </span>
            <p className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              {formatStopwatch(stopwatchMs)}
            </p>
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleResetStopwatch}
              disabled={stopwatchMs === 0}
              className="p-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl transition-all active:scale-95 disabled:opacity-40"
              title="Zerar Cronômetro"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleStopwatch}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                isStopwatchRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' 
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30'
              }`}
            >
              {isStopwatchRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> {stopwatchMs === 0 ? 'Começar' : 'Continuar'}
                </>
              )}
            </button>

            <button
              onClick={handleAddLap}
              disabled={!isStopwatchRunning && stopwatchMs === 0}
              className="p-3.5 bg-zinc-800 hover:bg-purple-600 hover:text-white text-zinc-300 rounded-2xl transition-all active:scale-95 disabled:opacity-40"
              title="Marcar Volta / Série"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Laps / Series History */}
          {laps.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                Séries / Voltas Registradas ({laps.length})
              </span>
              {laps.map((lapTime, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between bg-zinc-800/40 border border-zinc-700/40 px-3 py-1.5 rounded-xl text-xs"
                >
                  <span className="text-zinc-400 font-bold">Série #{laps.length - idx}</span>
                  <span className="font-mono font-black text-white">{formatStopwatch(lapTime)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audio Status Footnote & Close Button */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <BellRing className="w-3 h-3 text-purple-400" />
            {soundEnabled ? 'Avisos sonoros ativados (3s finais + fim)' : 'Silencioso'}
          </span>
          <span className="font-mono">FitAI Pro Timer</span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-1 py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700/50 hover:border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Fechar / Ocultar Cronômetro
          </button>
        )}
      </div>
    </div>
  );
};
