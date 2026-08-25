import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Share2, Download, Copy, Check, Sparkles, Flame, Trophy, 
  Droplets, Dumbbell, Award, ArrowUpRight, ShieldCheck, Heart,
  Smartphone, Square, Layout
} from 'lucide-react';
import { UserProfile, WorkoutPlan } from '../types';

interface ShareProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  plan: WorkoutPlan | null;
  customAchievement?: {
    title?: string;
    description?: string;
    metric?: string;
    metricLabel?: string;
  };
}

type CardFormat = 'story' | 'square' | 'card';
type CardTheme = 'cyber' | 'gold' | 'ocean' | 'stealth';

export function ShareProgressModal({
  isOpen,
  onClose,
  profile,
  plan,
  customAchievement
}: ShareProgressModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [format, setFormat] = useState<CardFormat>('story');
  const [theme, setTheme] = useState<CardTheme>('cyber');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

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

  // Render canvas whenever format, theme, or data changes
  useEffect(() => {
    if (!isOpen) return;
    renderCanvas();
  }, [isOpen, format, theme, profile, plan, customAchievement]);

  const getThemeColors = (selectedTheme: CardTheme) => {
    switch (selectedTheme) {
      case 'gold':
        return {
          bgGradStart: '#0f0f12',
          bgGradEnd: '#1a1608',
          accent: '#eab308',
          accentGrad: ['#fbbf24', '#d97706'],
          textPrimary: '#ffffff',
          textSecondary: '#a1a1aa',
          badgeBg: 'rgba(234, 179, 8, 0.15)',
          badgeBorder: 'rgba(234, 179, 8, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(234, 179, 8, 0.25)',
          glow: 'rgba(234, 179, 8, 0.25)'
        };
      case 'ocean':
        return {
          bgGradStart: '#08141f',
          bgGradEnd: '#06283d',
          accent: '#06b6d4',
          accentGrad: ['#22d3ee', '#0891b2'],
          textPrimary: '#ffffff',
          textSecondary: '#94a3b8',
          badgeBg: 'rgba(6, 182, 212, 0.15)',
          badgeBorder: 'rgba(6, 182, 212, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(6, 182, 212, 0.25)',
          glow: 'rgba(6, 182, 212, 0.25)'
        };
      case 'stealth':
        return {
          bgGradStart: '#090a0f',
          bgGradEnd: '#18181b',
          accent: '#f43f5e',
          accentGrad: ['#fb7185', '#e11d48'],
          textPrimary: '#ffffff',
          textSecondary: '#a1a1aa',
          badgeBg: 'rgba(244, 63, 94, 0.15)',
          badgeBorder: 'rgba(244, 63, 94, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.04)',
          cardBorder: 'rgba(244, 63, 94, 0.25)',
          glow: 'rgba(244, 63, 94, 0.25)'
        };
      case 'cyber':
      default:
        return {
          bgGradStart: '#0b0817',
          bgGradEnd: '#180e29',
          accent: '#a855f7',
          accentGrad: ['#c084fc', '#9333ea'],
          textPrimary: '#ffffff',
          textSecondary: '#a8a29e',
          badgeBg: 'rgba(168, 85, 247, 0.15)',
          badgeBorder: 'rgba(168, 85, 247, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(168, 85, 247, 0.25)',
          glow: 'rgba(168, 85, 247, 0.3)'
        };
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1080;
    let height = 1920; // 9:16 Story
    if (format === 'square') {
      width = 1080;
      height = 1080; // 1:1 Feed
    } else if (format === 'card') {
      width = 1200;
      height = 675; // 16:9
    }

    canvas.width = width;
    canvas.height = height;

    const colors = getThemeColors(theme);

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, colors.bgGradStart);
    bgGrad.addColorStop(1, colors.bgGradEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh/glow circle
    const glowGrad = ctx.createRadialGradient(width * 0.5, height * 0.35, 50, width * 0.5, height * 0.35, width * 0.6);
    glowGrad.addColorStop(0, colors.glow);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid pattern / decorative accents
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Outer framing border
    ctx.strokeStyle = colors.badgeBorder;
    ctx.lineWidth = 3;
    roundRect(ctx, 30, 30, width - 60, height - 60, 36);
    ctx.stroke();

    // HEADER SECTION
    // Brand pill
    const brandText = "FITAI PRO • PROGRESSO";
    ctx.font = "900 24px 'Inter', sans-serif";
    ctx.fillStyle = colors.accent;
    ctx.textAlign = "left";
    ctx.fillText("⚡ " + brandText, 70, 95);

    // Date
    const todayFormatted = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    ctx.font = "600 22px 'Inter', sans-serif";
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = "right";
    ctx.fillText(todayFormatted.toUpperCase(), width - 70, 95);

    // USER INFO BANNER
    const userDisplayName = profile?.displayName || profile?.email?.split('@')[0] || 'Atleta';
    ctx.textAlign = "left";
    ctx.fillStyle = colors.textPrimary;
    ctx.font = format === 'card' ? "900 48px 'Inter', sans-serif" : "900 58px 'Inter', sans-serif";
    ctx.fillText(userDisplayName, 70, format === 'card' ? 175 : 210);

    ctx.fillStyle = colors.accent;
    ctx.font = "800 24px 'Inter', sans-serif";
    const levelLabel = `NÍVEL ${userLevel} • ${userPoints} XP CONQUISTADOS`;
    ctx.fillText(levelLabel, 70, format === 'card' ? 215 : 260);

    // BIG HERO STREAK / BADGE HIGHLIGHT
    if (format === 'story') {
      // Large Hero Badge in Center
      const heroY = 330;
      const heroHeight = 360;
      ctx.fillStyle = colors.cardBg;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 2;
      roundRect(ctx, 70, heroY, width - 140, heroHeight, 32);
      ctx.fill();
      ctx.stroke();

      // Flame icon & Streak number
      ctx.textAlign = "center";
      ctx.font = "900 110px 'Inter', sans-serif";
      ctx.fillStyle = colors.accent;
      ctx.fillText(`🔥 ${streakDays}`, width / 2, heroY + 160);

      ctx.font = "900 32px 'Inter', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.fillText("DIAS DE OFENSIVA SEGUIDOS", width / 2, heroY + 230);

      ctx.font = "500 22px 'Inter', sans-serif";
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText("Consistência inabalável rumo ao objetivo", width / 2, heroY + 280);

      // 4 Metric Grid in Story Format
      const gridY = 730;
      const boxW = (width - 140 - 30) / 2;
      const boxH = 220;

      // Metric 1: Treinos Concluídos
      drawMetricBox(ctx, 70, gridY, boxW, boxH, "🏋️ TREINOS", `${completedWorkoutsCount}/${totalDays}`, "Concluídos no ciclo", colors);
      // Metric 2: Hidratação
      drawMetricBox(ctx, 70 + boxW + 30, gridY, boxW, boxH, "💧 HIDRATAÇÃO", `${waterPercent}%`, `${todayWaterTotal}ml / ${waterGoal}ml`, colors);
      // Metric 3: Peso Atual
      drawMetricBox(ctx, 70, gridY + boxH + 25, boxW, boxH, "⚖️ PESO ATUAL", weightCurrent, targetWeight ? `Meta: ${targetWeight}` : "Em evolução", colors);
      // Metric 4: Foco & Disciplina
      drawMetricBox(ctx, 70 + boxW + 30, gridY + boxH + 25, boxW, boxH, "🎯 DISCIPLINA", "100%", "Foco mantido hoje", colors);

      // MOTIVATIONAL QUOTE CARD
      const quoteY = 1250;
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      roundRect(ctx, 70, quoteY, width - 140, 240, 28);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "italic 700 28px 'Inter', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.fillText('"A dor é temporária, o orgulho de nunca desistir', width / 2, quoteY + 90);
      ctx.fillText('é para sempre."', width / 2, quoteY + 135);

      ctx.font = "800 20px 'Inter', sans-serif";
      ctx.fillStyle = colors.accent;
      ctx.fillText("— #FitAITransformation", width / 2, quoteY + 190);

      // FOOTER BRANDING
      const footY = 1780;
      ctx.textAlign = "center";
      ctx.font = "900 26px 'Inter', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.fillText("⚡ FITAI • TREINO & NUTRIÇÃO INTELIGENTE", width / 2, footY);
      ctx.font = "500 18px 'Inter', sans-serif";
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText("Treine com metodologia personalizada por IA", width / 2, footY + 40);

    } else if (format === 'square') {
      // 1:1 Square Feed Format
      // Hero Streak Box
      const heroY = 300;
      const heroHeight = 240;
      ctx.fillStyle = colors.cardBg;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 2;
      roundRect(ctx, 70, heroY, width - 140, heroHeight, 28);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "900 84px 'Inter', sans-serif";
      ctx.fillStyle = colors.accent;
      ctx.fillText(`🔥 ${streakDays} DIAS`, width / 2, heroY + 115);

      ctx.font = "800 24px 'Inter', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.fillText("OFENSIVA DE TREINO & FOCO ATIVA", width / 2, heroY + 175);

      // 3 Stat Columns
      const statsY = 575;
      const colW = (width - 140 - 40) / 3;
      const colH = 240;

      drawMetricBox(ctx, 70, statsY, colW, colH, "🏋️ TREINOS", `${completedWorkoutsCount}`, "Realizados", colors);
      drawMetricBox(ctx, 70 + colW + 20, statsY, colW, colH, "💧 ÁGUA", `${waterPercent}%`, `${todayWaterTotal}ml`, colors);
      drawMetricBox(ctx, 70 + (colW + 20) * 2, statsY, colW, colH, "⭐ XP TOTAL", `${userPoints}`, `Nível ${userLevel}`, colors);

      // Footer
      const footY = 960;
      ctx.textAlign = "center";
      ctx.font = "900 22px 'Inter', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.fillText("⚡ FITAI • MEU PROGRESSO DIÁRIO", width / 2, footY);
      ctx.font = "500 16px 'Inter', sans-serif";
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText("#FitAI #NoExcuses #FitnessTransformation", width / 2, footY + 32);

    } else {
      // 16:9 Card Format
      const leftW = 440;
      const rightX = 540;
      const rightW = width - 540 - 70;

      // Left Box: Streak Hero
      const heroY = 260;
      const heroHeight = 310;
      ctx.fillStyle = colors.cardBg;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 2;
      roundRect(ctx, 70, heroY, leftW, heroHeight, 28);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "900 80px 'Inter', sans-serif";
      ctx.fillStyle = colors.accent;
      ctx.fillText(`🔥 ${streakDays}`, 70 + leftW / 2, heroY + 120);

      ctx.font = "800 24px 'Inter', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.fillText("DIAS DE OFENSIVA", 70 + leftW / 2, heroY + 180);

      ctx.font = "500 18px 'Inter', sans-serif";
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText("Consistência Imparável", 70 + leftW / 2, heroY + 225);

      // Right: 2x2 mini grid
      const gridW = (rightW - 20) / 2;
      const gridH = 145;
      drawMetricBox(ctx, rightX, heroY, gridW, gridH, "🏋️ TREINOS", `${completedWorkoutsCount}/${totalDays}`, "Concluídos", colors);
      drawMetricBox(ctx, rightX + gridW + 20, heroY, gridW, gridH, "💧 ÁGUA", `${waterPercent}%`, `${todayWaterTotal}ml meta`, colors);
      drawMetricBox(ctx, rightX, heroY + gridH + 20, gridW, gridH, "⚖️ PESO", weightCurrent, "Registrado", colors);
      drawMetricBox(ctx, rightX + gridW + 20, heroY + gridH + 20, gridW, gridH, "⭐ XP", `${userPoints}`, `Nível ${userLevel}`, colors);

      // Footer
      const footY = 610;
      ctx.textAlign = "left";
      ctx.font = "900 18px 'Inter', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.fillText("⚡ FITAI • TREINO & NUTRIÇÃO PERSONALIZADOS", 70, footY);

      ctx.textAlign = "right";
      ctx.font = "700 16px 'Inter', sans-serif";
      ctx.fillStyle = colors.accent;
      ctx.fillText("#FitAIPro #Consistência", width - 70, footY);
    }
  };

  const drawMetricBox = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    tag: string, 
    val: string, 
    sub: string, 
    colors: any
  ) => {
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "800 18px 'Inter', sans-serif";
    ctx.fillStyle = colors.accent;
    ctx.fillText(tag, x + w / 2, y + 42);

    ctx.font = "900 42px 'Inter', sans-serif";
    ctx.fillStyle = colors.textPrimary;
    ctx.fillText(val, x + w / 2, y + 105);

    ctx.font = "500 17px 'Inter', sans-serif";
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText(sub, x + w / 2, y + 145);
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Download image as PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsGenerating(true);

    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `fitai-conquista-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsGenerating(false);
      setShareSuccess('Imagem baixada com sucesso!');
      setTimeout(() => setShareSuccess(null), 3000);
    }, 150);
  };

  // Native Web Share API
  const handleWebShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `fitai-conquista.png`, { type: 'image/png' });
        
        const shareText = `🔥 Minha ofensiva no FitAI: ${streakDays} dias seguidos! Nível ${userLevel} com ${userPoints} XP conquistados. #FitAI #Treino`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Minha Conquista no FitAI',
            text: shareText,
            files: [file]
          });
          setShareSuccess('Compartilhado com sucesso!');
        } else if (navigator.share) {
          await navigator.share({
            title: 'Minha Conquista no FitAI',
            text: shareText,
            url: window.location.origin
          });
          setShareSuccess('Link compartilhado!');
        } else {
          // Fallback to copy text
          handleCopyText();
        }
      });
    } catch (err) {
      console.warn("Share cancelled or failed:", err);
    }
  };

  // Copy text formatted for Social Media Caption
  const handleCopyText = () => {
    const caption = `🔥 OFENSIVA FITAI: ${streakDays} DIAS SEGUIDOS!\n\n` +
      `🏋️ Treinos concluídos: ${completedWorkoutsCount}/${totalDays}\n` +
      `💧 Meta de hidratação: ${waterPercent}%\n` +
      `⭐ Nível: ${userLevel} (${userPoints} XP)\n` +
      `⚖️ Peso atual: ${weightCurrent}\n\n` +
      `"A consistência vence o talento todo dia!"\n\n` +
      `Treinando com @FitAIPro 💪⚡`;

    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    setShareSuccess('Texto copiado para a área de transferência!');
    setTimeout(() => {
      setIsCopied(false);
      setShareSuccess(null);
    }, 3000);
  };

  // Direct WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 Minha evolução no FitAI:\n` +
      `• Ofensiva: ${streakDays} dias seguidos\n` +
      `• Treinos: ${completedWorkoutsCount}/${totalDays} no plano\n` +
      `• Hidratação: ${waterPercent}% da meta batida\n` +
      `• Nível: ${userLevel} (${userPoints} XP)\n\n` +
      `Bora treinar junto! 💪`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Direct Twitter / X Share
  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `🔥 ${streakDays} dias de ofensiva no @FitAI! Nível ${userLevel} com ${userPoints} XP. Rumo à melhor versão! 💪⚡ #FitAI #FitnessJourney`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Compartilhar Progresso & Conquistas
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                    HD Card
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Gere um card estilizado para Stories, Feed ou WhatsApp</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body with 2-column layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-y-auto">
            {/* Left: Preview Canvas */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-900/40 rounded-2xl p-4 border border-zinc-800/80">
              <div className="relative max-h-[460px] w-full flex items-center justify-center overflow-hidden rounded-xl">
                <canvas
                  ref={canvasRef}
                  className="max-h-[440px] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                />
              </div>

              {shareSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {shareSuccess}
                </motion.div>
              )}
            </div>

            {/* Right: Controls & Options */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Format selection */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    1. Formato do Card
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFormat('story')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        format === 'story'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-1" />
                      Story (9:16)
                    </button>
                    <button
                      onClick={() => setFormat('square')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        format === 'square'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Square className="w-5 h-5 mb-1" />
                      Feed (1:1)
                    </button>
                    <button
                      onClick={() => setFormat('card')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        format === 'card'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Layout className="w-5 h-5 mb-1" />
                      Banner (16:9)
                    </button>
                  </div>
                </div>

                {/* Theme selection */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    2. Tema Visual
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme('cyber')}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'cyber'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                      Cyber Purple
                    </button>
                    <button
                      onClick={() => setTheme('gold')}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'gold'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
                      Gold Champion
                    </button>
                    <button
                      onClick={() => setTheme('ocean')}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'ocean'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                      Ocean Cyan
                    </button>
                    <button
                      onClick={() => setTheme('stealth')}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'stealth'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                      Stealth Crimson
                    </button>
                  </div>
                </div>

                {/* Quick Social Media Buttons */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    3. Compartilhamento Rápido
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleWhatsAppShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <span className="text-sm">💬</span> WhatsApp
                    </button>
                    <button
                      onClick={handleTwitterShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <span className="text-sm">🐦</span> Twitter / X
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Actions: Web Share & Download */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={handleWebShare}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar Imagem / Stories
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    Baixar PNG
                  </button>

                  <button
                    onClick={handleCopyText}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                    {isCopied ? 'Copiado!' : 'Copiar Legenda'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
