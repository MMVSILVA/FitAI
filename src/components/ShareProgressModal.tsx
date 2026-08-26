import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { 
  X, Share2, Download, Copy, Check, Sparkles, Flame, Trophy, 
  Droplets, Dumbbell, Award, ArrowUpRight, ShieldCheck, Heart,
  Smartphone, Square, Layout, Camera, Send, MessageCircle,
  ExternalLink, Zap, CheckCircle2, Star, TrendingUp, Calendar
} from 'lucide-react';
import { UserProfile, WorkoutPlan } from '../types';
import { useUser } from '../store/userStore';

export interface ShareProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormat?: 'story' | 'square' | 'card';
  profile?: UserProfile | null;
  plan?: WorkoutPlan | null;
  achievementBadge?: {
    title?: string;
    description?: string;
    metric?: string;
    metricLabel?: string;
  };
  customAchievement?: {
    title?: string;
    description?: string;
    metric?: string;
    metricLabel?: string;
  };
}

export type CardFormat = 'story' | 'square' | 'card';
export type CardTheme = 'sunset' | 'cyber' | 'gold' | 'emerald' | 'stealth';

export function ShareProgressModal({
  isOpen,
  onClose,
  initialFormat = 'story',
  profile: propProfile,
  plan: propPlan,
  achievementBadge,
  customAchievement: propCustomAchievement
}: ShareProgressModalProps) {
  const { profile: storeProfile, plan: storePlan } = useUser();
  const profile = propProfile || storeProfile;
  const plan = propPlan || storePlan;
  const customAchievement = achievementBadge || propCustomAchievement;

  const captureCardRef = useRef<HTMLDivElement | null>(null);
  const [format, setFormat] = useState<CardFormat>(initialFormat);
  const [theme, setTheme] = useState<CardTheme>('sunset');
  const [isCopied, setIsCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [showMobileShareDrawer, setShowMobileShareDrawer] = useState(false);

  // Derived metrics for summary card
  const streakDays = profile?.streak || (profile?.checkInDates?.length ? 1 : 0);
  const completedWorkoutsCount = plan?.days?.filter(d => d.isCompleted).length || 0;
  const totalDays = plan?.days?.length || 5;
  const waterGoal = profile?.hydration?.goal || 2500;
  const todayWaterTotal = (profile?.hydration?.logs || []).reduce((acc, l) => acc + l.amount, 0);
  const waterPercent = Math.min(100, Math.round((todayWaterTotal / waterGoal) * 100));
  const userLevel = profile?.level || 1;
  const userPoints = profile?.points || 0;
  const weightCurrent = profile?.weight ? `${profile.weight} kg` : '--';
  const targetWeight = profile?.targetWeight ? `${profile.targetWeight} kg` : null;
  const userName = (profile?.displayName || profile?.name || 'Atleta FitAI').split('@')[0];

  // Set format on open if specified
  useEffect(() => {
    if (isOpen) {
      if (initialFormat) setFormat(initialFormat);
    }
  }, [isOpen, initialFormat]);

  // Generate screenshot preview with html2canvas whenever format, theme, or data changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      generateCaptureCanvas(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, format, theme, profile, plan, customAchievement]);

  // Core capture function using html2canvas
  const generateCaptureCanvas = async (notify = false): Promise<Blob | null> => {
    if (!captureCardRef.current) return null;
    setIsCapturing(true);

    try {
      const element = captureCardRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2, // Retina HD
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 5000
      });

      const dataUrl = canvas.toDataURL('image/png');
      setPreviewDataUrl(dataUrl);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          setIsCapturing(false);
          if (notify && blob) {
            setShareSuccess('Card gerado em alta resolução!');
            setTimeout(() => setShareSuccess(null), 3000);
          }
          resolve(blob);
        }, 'image/png', 0.95);
      });
    } catch (err) {
      console.error('Error in html2canvas capture:', err);
      setIsCapturing(false);
      return null;
    }
  };

  // Download image
  const handleDownload = async () => {
    setIsCapturing(true);
    const blob = await generateCaptureCanvas(false);
    if (!blob) {
      setIsCapturing(false);
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitai-stories-${streakDays}dias-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsCapturing(false);

    setShareSuccess('Imagem salva com sucesso! Pronta para postar.');
    setTimeout(() => setShareSuccess(null), 3500);
  };

  // Native navigator.share for Android / iOS
  const handleNativeShare = async () => {
    setIsCapturing(true);
    const blob = await generateCaptureCanvas(false);
    setIsCapturing(false);

    if (!blob) return;

    const file = new File([blob], `fitai-stories-${streakDays}dias.png`, { type: 'image/png' });
    const shareText = `🔥 Minha evolução no FitAI: ${streakDays} dias de ofensiva com foco total! Nível ${userLevel} • ${userPoints} XP. #FitAI #InstagramStories #Fitness`;

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Meu Progresso no FitAI',
          text: shareText,
          files: [file]
        });
        setShareSuccess('Compartilhado com sucesso!');
        setShowMobileShareDrawer(false);
      } else if (navigator.share) {
        await navigator.share({
          title: 'Meu Progresso no FitAI',
          text: shareText,
          url: window.location.origin
        });
        setShareSuccess('Link compartilhado!');
        setShowMobileShareDrawer(false);
      } else {
        // Fallback for desktop browsers without file share API
        setShowMobileShareDrawer(true);
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setShowMobileShareDrawer(true);
      }
    }
  };

  // Direct Instagram Stories flow
  const handleInstagramStories = async () => {
    handleCopyCaption();
    handleDownload();

    try {
      const blob = await generateCaptureCanvas(false);
      if (blob) {
        const file = new File([blob], `fitai-stories-${streakDays}dias.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Compartilhar nos Stories',
            text: `🔥 ${streakDays} dias de foco no @FitAI! #FitAI #Stories`,
            files: [file]
          });
          return;
        }
      }
    } catch {
      // Fallback
    }

    setShareSuccess('Card salvo na galeria e legenda copiada! Abra os Stories do Instagram para postar.');
    setTimeout(() => {
      window.open('https://www.instagram.com', '_blank');
    }, 1000);
  };

  // Copy caption
  const handleCopyCaption = () => {
    const caption = `🔥 OFENSIVA FITAI: ${streakDays} DIAS SEGUIDOS!\n\n` +
      `🏋️ Treinos concluídos: ${completedWorkoutsCount}/${totalDays}\n` +
      `💧 Hidratação diária: ${waterPercent}%\n` +
      `⭐ Nível ${userLevel} • ${userPoints} XP\n` +
      `⚖️ Peso atual: ${weightCurrent}\n\n` +
      `"A disciplina constrói resultados consistentes todos os dias!" ⚡\n\n` +
      `Treinando com @FitAIPro #FitAI #InstagramStories #Foco #Treino`;

    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    setShareSuccess('Legenda copiada para a área de transferência!');
    setTimeout(() => {
      setIsCopied(false);
      setShareSuccess(null);
    }, 3000);
  };

  // Direct WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 *Minha evolução no FitAI*:\n` +
      `• *Ofensiva*: ${streakDays} dias seguidos\n` +
      `• *Treinos*: ${completedWorkoutsCount}/${totalDays} no plano\n` +
      `• *Hidratação*: ${waterPercent}% da meta batida\n` +
      `• *Nível*: ${userLevel} (${userPoints} XP)\n\n` +
      `Treinando com Inteligência Artificial no FitAI! 💪⚡`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Direct Telegram Share
  const handleTelegramShare = () => {
    const text = encodeURIComponent(
      `🔥 ${streakDays} dias de ofensiva no FitAI! Nível ${userLevel} (${userPoints} XP). Bora evoluir junto! 💪⚡`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${text}`, '_blank');
  };

  // Direct Twitter / X Share
  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `🔥 ${streakDays} dias de ofensiva no @FitAI! Nível ${userLevel} com ${userPoints} XP conquistados. Rumo à meta! 💪⚡ #FitAI #Fitness`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  // Helper theme classes for capturing element
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'sunset':
        return 'bg-gradient-to-b from-[#1a0520] via-[#2d0b27] to-[#0d0211] text-white border-pink-500/30';
      case 'cyber':
        return 'bg-gradient-to-b from-[#090014] via-[#160228] to-[#040008] text-white border-purple-500/30';
      case 'gold':
        return 'bg-gradient-to-b from-[#141005] via-[#241c09] to-[#0a0802] text-white border-yellow-500/30';
      case 'emerald':
        return 'bg-gradient-to-b from-[#02150f] via-[#05281c] to-[#010c08] text-white border-emerald-500/30';
      case 'stealth':
        return 'bg-gradient-to-b from-[#090a0f] via-[#13151f] to-[#050608] text-white border-rose-500/30';
      default:
        return 'bg-gradient-to-b from-[#1a0520] via-[#2d0b27] to-[#0d0211] text-white border-pink-500/30';
    }
  };

  const getThemeAccentGradient = () => {
    switch (theme) {
      case 'sunset':
        return 'from-pink-500 via-rose-500 to-amber-500';
      case 'cyber':
        return 'from-purple-500 via-indigo-500 to-pink-500';
      case 'gold':
        return 'from-amber-400 via-yellow-500 to-orange-500';
      case 'emerald':
        return 'from-emerald-400 via-teal-500 to-cyan-500';
      case 'stealth':
        return 'from-rose-500 via-red-500 to-orange-500';
      default:
        return 'from-pink-500 via-rose-500 to-amber-500';
    }
  };

  const getThemeAccentColor = () => {
    switch (theme) {
      case 'sunset':
        return 'text-pink-400';
      case 'cyber':
        return 'text-purple-400';
      case 'gold':
        return 'text-yellow-400';
      case 'emerald':
        return 'text-emerald-400';
      case 'stealth':
        return 'text-rose-400';
      default:
        return 'text-pink-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col my-auto relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-600/30">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Compartilhar nos Stories
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 font-black border border-pink-500/30">
                    Instagram 9:16
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Template otimizado para Stories com captura em alta resolução</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-y-auto">
            {/* Left: Interactive Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-900/40 rounded-3xl p-4 border border-zinc-800/80 relative">
              <div className="relative max-h-[460px] w-full flex items-center justify-center overflow-hidden rounded-2xl">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Card Preview"
                    className="max-h-[440px] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                  />
                ) : (
                  <div className="w-64 h-96 bg-zinc-900 animate-pulse rounded-2xl flex items-center justify-center text-xs text-zinc-500">
                    Renderizando Card com html2canvas...
                  </div>
                )}
              </div>

              {shareSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 text-center"
                >
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{shareSuccess}</span>
                </motion.div>
              )}
            </div>

            {/* Right: Controls & Actions */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* 1. Format Selection */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    1. Formato de Exportação
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFormat('story')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        format === 'story'
                          ? 'bg-gradient-to-br from-pink-600/30 to-purple-600/30 border-pink-500 text-white shadow-lg shadow-pink-600/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-1 text-pink-400" />
                      Stories (9:16)
                    </button>
                    <button
                      onClick={() => setFormat('square')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        format === 'square'
                          ? 'bg-gradient-to-br from-pink-600/30 to-purple-600/30 border-pink-500 text-white shadow-lg shadow-pink-600/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Square className="w-5 h-5 mb-1 text-pink-400" />
                      Feed (1:1)
                    </button>
                    <button
                      onClick={() => setFormat('card')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        format === 'card'
                          ? 'bg-gradient-to-br from-pink-600/30 to-purple-600/30 border-pink-500 text-white shadow-lg shadow-pink-600/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Layout className="w-5 h-5 mb-1 text-pink-400" />
                      Card (16:9)
                    </button>
                  </div>
                </div>

                {/* 2. Theme Selection */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    2. Tema do Fundo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme('sunset')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'sunset'
                          ? 'bg-pink-600/20 border-pink-500 text-pink-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 shadow-sm" />
                      Sunset Stories
                    </button>
                    <button
                      onClick={() => setTheme('cyber')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'cyber'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-sm" />
                      Cyber Neon
                    </button>
                    <button
                      onClick={() => setTheme('gold')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'gold'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-sm" />
                      Gold Champion
                    </button>
                    <button
                      onClick={() => setTheme('emerald')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'emerald'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm" />
                      Emerald Energy
                    </button>
                  </div>
                </div>

                {/* 3. Quick Share Row */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    3. Compartilhar Direto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleInstagramStories}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-500 hover:opacity-90 text-white border border-pink-500/40 text-xs font-black transition-all active:scale-95 shadow-md shadow-pink-600/20"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      Instagram Stories
                    </button>

                    <button
                      onClick={handleWhatsAppShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      WhatsApp
                    </button>

                    <button
                      onClick={handleTelegramShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4 text-blue-400" />
                      Telegram
                    </button>

                    <button
                      onClick={handleTwitterShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <span className="text-sm font-black">𝕏</span>
                      Twitter / X
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Actions: Mobile Native Share Sheet & Download */}
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                {/* Mobile-Native Share Trigger Button */}
                <button
                  onClick={handleNativeShare}
                  disabled={isCapturing}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
                >
                  <Smartphone className="w-4 h-4 text-yellow-300" />
                  {isCapturing ? 'Gerando Imagem...' : 'Abrir Menu de Compartilhar (Celular)'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={isCapturing}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"
                  >
                    <Download className="w-4 h-4 text-pink-400" />
                    Baixar PNG HD
                  </button>

                  <button
                    onClick={handleCopyCaption}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-pink-400" />}
                    {isCopied ? 'Copiado!' : 'Copiar Legenda'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden DOM element specifically rendered and formatted for html2canvas capture */}
          <div className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
            <div
              ref={captureCardRef}
              style={{
                width: format === 'story' ? '540px' : format === 'square' ? '540px' : '640px',
                height: format === 'story' ? '960px' : format === 'square' ? '540px' : '360px',
              }}
              className={`p-8 rounded-3xl border flex flex-col justify-between relative overflow-hidden font-sans ${getThemeWrapperClass()}`}
            >
              {/* Background Glows and Decorative Elements */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Top Branding & User Info */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <Zap className="w-7 h-7 text-white fill-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                      FITAI <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 font-bold ${getThemeAccentColor()}`}>PRO</span>
                    </h2>
                    <p className="text-xs text-white/60 font-semibold tracking-wider uppercase">Relatório de Evolução</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-black text-white">{userName}</p>
                  <p className={`text-xs font-black uppercase tracking-widest ${getThemeAccentColor()}`}>
                    Nível {userLevel} • {userPoints} XP
                  </p>
                </div>
              </div>

              {/* Middle Section: Hero Metric / Badge */}
              <div className="relative z-10 my-auto py-4 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-300">
                    {customAchievement?.title ? customAchievement.title.toUpperCase() : 'OFENSIVA ATIVA'}
                  </span>
                </div>

                <div>
                  <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-2">
                    {customAchievement?.metric || `${streakDays} DIAS`}
                  </h1>
                  <p className="text-sm font-semibold text-white/80 max-w-sm mx-auto">
                    {customAchievement?.description || 'Foco absoluto e consistência nos treinos com a FitAI.'}
                  </p>
                </div>

                {/* 4 Core Metric Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Treinos da Semana</p>
                    <p className="text-2xl font-black text-white">{completedWorkoutsCount}/{totalDays}</p>
                    <p className="text-[10px] text-white/60 font-medium">Sessões Concluídas</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Meta de Água</p>
                    <p className="text-2xl font-black text-white">{waterPercent}%</p>
                    <p className="text-[10px] text-white/60 font-medium">{todayWaterTotal} ml ingeridos</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Peso Atual</p>
                    <p className="text-2xl font-black text-white">{weightCurrent}</p>
                    <p className="text-[10px] text-white/60 font-medium">{targetWeight ? `Meta: ${targetWeight}` : 'Em monitoramento'}</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Classificação</p>
                    <p className="text-2xl font-black text-amber-300">LV {userLevel}</p>
                    <p className="text-[10px] text-white/60 font-medium">{userPoints} XP Acumulados</p>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Call to Action */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white/80">#FitAI #FocoTotal</span>
                </div>
                <span className="font-medium">app.fitai.com.br</span>
              </div>
            </div>
          </div>

          {/* Native-Style Mobile Share Sheet Drawer Overlay */}
          <AnimatePresence>
            {showMobileShareDrawer && (
              <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-3 sm:p-6 animate-fadeIn">
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl max-w-lg mx-auto w-full space-y-4"
                >
                  <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Menu de Compartilhamento
                      </h4>
                      <p className="text-xs text-zinc-400">Envie seu card diretamente para seus apps favoritos</p>
                    </div>
                    <button
                      onClick={() => setShowMobileShareDrawer(false)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* App Grid */}
                  <div className="grid grid-cols-4 gap-3 py-2">
                    <button
                      onClick={handleInstagramStories}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-center transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-600/30 group-hover:scale-105 transition-transform">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300">Stories</span>
                    </button>

                    <button
                      onClick={handleWhatsAppShare}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-center transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300">WhatsApp</span>
                    </button>

                    <button
                      onClick={handleTelegramShare}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-center transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform">
                        <Send className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300">Telegram</span>
                    </button>

                    <button
                      onClick={handleTwitterShare}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-center transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-700 flex items-center justify-center shadow-lg shadow-zinc-700/30 group-hover:scale-105 transition-transform">
                        <span className="text-lg font-black text-white">𝕏</span>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300">Twitter</span>
                    </button>
                  </div>

                  {/* Direct Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        handleDownload();
                        setShowMobileShareDrawer(false);
                      }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700 transition-colors"
                    >
                      <Download className="w-4 h-4 text-pink-400" />
                      Salvar na Galeria
                    </button>
                    <button
                      onClick={() => {
                        handleCopyCaption();
                        setShowMobileShareDrawer(false);
                      }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-pink-400" />
                      Copiar Legenda
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
