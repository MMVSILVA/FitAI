import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { 
  X, Share2, Download, Copy, Check, Sparkles, Flame, Trophy, 
  Droplets, Dumbbell, Award, ArrowUpRight, ShieldCheck, Heart,
  Smartphone, Square, Layout, Camera, Send, MessageCircle,
  ExternalLink, Zap, CheckCircle2, Star, TrendingUp, Calendar, AlertCircle
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

// Helper function to synchronously turn a dataURI into a Blob
function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const [format, setFormat] = useState<CardFormat>(initialFormat);
  const [theme, setTheme] = useState<CardTheme>('sunset');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
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
    if (isOpen && initialFormat) {
      setFormat(initialFormat);
    }
  }, [isOpen, initialFormat]);

  const getThemePalette = (selectedTheme: CardTheme) => {
    switch (selectedTheme) {
      case 'sunset':
        return {
          bgGradStart: '#18041d',
          bgGradMid: '#2d0b27',
          bgGradEnd: '#0d0211',
          accent: '#ec4899',
          accentLight: '#f472b6',
          accentSecondary: '#f59e0b',
          glow: 'rgba(236, 72, 153, 0.28)',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          cardBorder: 'rgba(236, 72, 153, 0.35)',
          badgeBg: 'rgba(236, 72, 153, 0.18)',
          badgeBorder: 'rgba(244, 114, 182, 0.45)',
          textPrimary: '#ffffff',
          textSecondary: '#cbd5e1',
          textMuted: '#94a3b8'
        };
      case 'cyber':
        return {
          bgGradStart: '#080214',
          bgGradMid: '#16042b',
          bgGradEnd: '#040108',
          accent: '#a855f7',
          accentLight: '#c084fc',
          accentSecondary: '#06b6d4',
          glow: 'rgba(168, 85, 247, 0.30)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(168, 85, 247, 0.35)',
          badgeBg: 'rgba(168, 85, 247, 0.18)',
          badgeBorder: 'rgba(192, 132, 252, 0.45)',
          textPrimary: '#ffffff',
          textSecondary: '#cbd5e1',
          textMuted: '#a8a29e'
        };
      case 'gold':
        return {
          bgGradStart: '#141005',
          bgGradMid: '#241c09',
          bgGradEnd: '#0a0802',
          accent: '#eab308',
          accentLight: '#fde047',
          accentSecondary: '#f97316',
          glow: 'rgba(234, 179, 8, 0.28)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(234, 179, 8, 0.35)',
          badgeBg: 'rgba(234, 179, 8, 0.18)',
          badgeBorder: 'rgba(253, 224, 71, 0.45)',
          textPrimary: '#ffffff',
          textSecondary: '#e2e8f0',
          textMuted: '#94a3b8'
        };
      case 'emerald':
        return {
          bgGradStart: '#02150f',
          bgGradMid: '#05281c',
          bgGradEnd: '#010c08',
          accent: '#10b981',
          accentLight: '#34d399',
          accentSecondary: '#06b6d4',
          glow: 'rgba(16, 185, 129, 0.28)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(16, 185, 129, 0.35)',
          badgeBg: 'rgba(16, 185, 129, 0.18)',
          badgeBorder: 'rgba(52, 211, 153, 0.45)',
          textPrimary: '#ffffff',
          textSecondary: '#cbd5e1',
          textMuted: '#94a3b8'
        };
      case 'stealth':
      default:
        return {
          bgGradStart: '#090a0f',
          bgGradMid: '#161822',
          bgGradEnd: '#040507',
          accent: '#f43f5e',
          accentLight: '#fb7185',
          accentSecondary: '#fb923c',
          glow: 'rgba(244, 63, 94, 0.28)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(244, 63, 94, 0.35)',
          badgeBg: 'rgba(244, 63, 94, 0.18)',
          badgeBorder: 'rgba(251, 113, 133, 0.45)',
          textPrimary: '#ffffff',
          textSecondary: '#cbd5e1',
          textMuted: '#94a3b8'
        };
    }
  };

  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawMetricBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    colors: ReturnType<typeof getThemePalette>,
    tag: string,
    val: string,
    sub: string
  ) => {
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 2;
    drawRoundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accentLight;
    ctx.font = "800 17px system-ui, -apple-system, sans-serif";
    ctx.fillText(tag, x + w / 2, y + 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = "900 44px system-ui, -apple-system, sans-serif";
    ctx.fillText(val, x + w / 2, y + 105);

    ctx.fillStyle = colors.textMuted;
    ctx.font = "600 16px system-ui, -apple-system, sans-serif";
    ctx.fillText(sub, x + w / 2, y + 152);
  };

  // Stories (9:16)
  const renderStoryCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: ReturnType<typeof getThemePalette>
  ) => {
    const heroY = 280;
    const heroH = 340;

    // Hero Achievement Card Box
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 2.5;
    drawRoundRect(ctx, 70, heroY, width - 140, heroH, 32);
    ctx.fill();
    ctx.stroke();

    // Badge Pill
    const badgeW = 400;
    const badgeH = 52;
    const badgeX = (width - badgeW) / 2;
    const badgeY = heroY + 38;
    ctx.fillStyle = colors.badgeBg;
    ctx.strokeStyle = colors.badgeBorder;
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 26);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accentLight;
    ctx.font = "900 20px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      customAchievement?.title ? `🏆 ${customAchievement.title.toUpperCase()}` : '🔥 OFENSIVA DIÁRIA ATIVA',
      width / 2,
      badgeY + badgeH / 2 + 2
    );

    // Huge Metric
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 86px system-ui, -apple-system, sans-serif";
    const mainMetric = customAchievement?.metric || `${streakDays} DIAS`;
    ctx.fillText(mainMetric, width / 2, heroY + 175);

    // Subtitle
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 24px system-ui, -apple-system, sans-serif";
    const subMetric = customAchievement?.description || (streakDays > 1 ? 'Consistência e foco absoluto todos os dias!' : 'O início da sua grande transformação física!');
    ctx.fillText(subMetric, width / 2, heroY + 260);

    // 4 Key Metric Cards (2x2 Grid)
    const gridY = heroY + heroH + 40;
    const cardW = (width - 140 - 24) / 2;
    const cardH = 220;

    drawMetricBox(ctx, 70, gridY, cardW, cardH, colors, 'TREINOS DA SEMANA', `${completedWorkoutsCount}/${totalDays}`, 'Sessões Concluídas');
    drawMetricBox(ctx, 70 + cardW + 24, gridY, cardW, cardH, colors, 'META DE ÁGUA', `${waterPercent}%`, `${todayWaterTotal} ml ingeridos`);
    drawMetricBox(ctx, 70, gridY + cardH + 24, cardW, cardH, colors, 'PESO ATUAL', weightCurrent, targetWeight ? `Meta: ${targetWeight}` : 'Em acompanhamento');
    drawMetricBox(ctx, 70 + cardW + 24, gridY + cardH + 24, cardW, cardH, colors, 'PONTOS & NÍVEL', `LV ${userLevel}`, `${userPoints} XP acumulados`);

    // Motivational Quote Box
    const quoteY = gridY + (cardH * 2) + 50;
    const quoteH = 220;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, 70, quoteY, width - 140, quoteH, 28);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = "italic 700 28px system-ui, -apple-system, sans-serif";
    ctx.fillText('"O segredo dos grandes resultados não é sorte,', width / 2, quoteY + 75);
    ctx.fillText('é a disciplina de nunca desistir."', width / 2, quoteY + 120);

    ctx.fillStyle = colors.accentLight;
    ctx.font = "800 20px system-ui, -apple-system, sans-serif";
    ctx.fillText('Evoluindo a cada treino com a FitAI ⚡', width / 2, quoteY + 175);
  };

  // Square (1:1 Feed)
  const renderSquareCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: ReturnType<typeof getThemePalette>
  ) => {
    const heroY = 200;
    const heroH = 250;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 2.5;
    drawRoundRect(ctx, 60, heroY, width - 120, heroH, 28);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accentLight;
    ctx.font = "900 22px system-ui, -apple-system, sans-serif";
    ctx.fillText(customAchievement?.title ? `🏆 ${customAchievement.title.toUpperCase()}` : '🔥 OFENSIVA & PROGRESSO', width / 2, heroY + 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = "900 76px system-ui, -apple-system, sans-serif";
    ctx.fillText(customAchievement?.metric || `${streakDays} DIAS SEGUIDOS`, width / 2, heroY + 145);

    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 22px system-ui, -apple-system, sans-serif";
    ctx.fillText(customAchievement?.description || 'Consistência, disciplina e foco no plano de evolução!', width / 2, heroY + 205);

    const rowY = heroY + heroH + 30;
    const cardW = (width - 120 - 48) / 3;
    const cardH = 190;

    drawMetricBox(ctx, 60, rowY, cardW, cardH, colors, 'TREINOS', `${completedWorkoutsCount}/${totalDays}`, 'Semana');
    drawMetricBox(ctx, 60 + cardW + 24, rowY, cardW, cardH, colors, 'ÁGUA', `${waterPercent}%`, `${todayWaterTotal} ml`);
    drawMetricBox(ctx, 60 + (cardW * 2) + 48, rowY, cardW, cardH, colors, 'PONTOS XP', `${userPoints}`, `Nível ${userLevel}`);

    const quoteY = rowY + cardH + 30;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    drawRoundRect(ctx, 60, quoteY, width - 120, 110, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accentLight;
    ctx.font = "800 22px system-ui, -apple-system, sans-serif";
    ctx.fillText('EVOLUINDO TODOS OS DIAS COM A FITAI ⚡', width / 2, quoteY + 55);
  };

  // Card (16:9)
  const renderCardCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: ReturnType<typeof getThemePalette>
  ) => {
    const cardY = 190;
    const leftW = 460;
    const rightW = width - leftW - 140;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 2.5;
    drawRoundRect(ctx, 60, cardY, leftW, 360, 28);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accentLight;
    ctx.font = "900 22px system-ui, -apple-system, sans-serif";
    ctx.fillText(customAchievement?.title ? `🏆 ${customAchievement.title.toUpperCase()}` : '🔥 OFENSIVA DIÁRIA', 60 + leftW / 2, cardY + 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = "900 70px system-ui, -apple-system, sans-serif";
    ctx.fillText(customAchievement?.metric || `${streakDays} DIAS`, 60 + leftW / 2, cardY + 165);

    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 20px system-ui, -apple-system, sans-serif";
    ctx.fillText(customAchievement?.description || 'Foco absoluto e consistência diária', 60 + leftW / 2, cardY + 245);

    const gridX = 60 + leftW + 24;
    const miniW = (rightW - 20) / 2;
    const miniH = 168;

    drawMetricBox(ctx, gridX, cardY, miniW, miniH, colors, 'TREINOS', `${completedWorkoutsCount}/${totalDays}`, 'Concluídos');
    drawMetricBox(ctx, gridX + miniW + 20, cardY, miniW, miniH, colors, 'HIDRATAÇÃO', `${waterPercent}%`, `${todayWaterTotal} ml`);
    drawMetricBox(ctx, gridX, cardY + miniH + 24, miniW, miniH, colors, 'NÍVEL & XP', `LV ${userLevel}`, `${userPoints} XP`);
    drawMetricBox(ctx, gridX + miniW + 20, cardY + miniH + 24, miniW, miniH, colors, 'PESO', weightCurrent, targetWeight ? `Meta: ${targetWeight}` : 'Monitorado');
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1080;
    let height = 1920; // 9:16 Instagram Stories

    if (format === 'square') {
      width = 1080;
      height = 1080; // 1:1 Feed
    } else if (format === 'card') {
      width = 1200;
      height = 675; // 16:9 Banner
    }

    canvas.width = width;
    canvas.height = height;

    const colors = getThemePalette(theme);

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width * 0.5, height);
    bgGrad.addColorStop(0, colors.bgGradStart);
    bgGrad.addColorStop(0.5, colors.bgGradMid);
    bgGrad.addColorStop(1, colors.bgGradEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Radial Glow Orbs
    const glow1 = ctx.createRadialGradient(width * 0.8, height * 0.2, 50, width * 0.8, height * 0.2, width * 0.7);
    glow1.addColorStop(0, colors.glow);
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(width * 0.2, height * 0.75, 50, width * 0.2, height * 0.75, width * 0.6);
    glow2.addColorStop(0, colors.glow);
    glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Subtle Technical Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1.5;
    for (let x = 60; x < width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 60; y < height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 4. Outer Elegant Frame Border
    ctx.strokeStyle = colors.badgeBorder;
    ctx.lineWidth = 3;
    drawRoundRect(ctx, 36, 36, width - 72, height - 72, 36);
    ctx.stroke();

    // 5. Header Branding
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Logo Icon Box
    const logoGrad = ctx.createLinearGradient(70, 90, 140, 160);
    logoGrad.addColorStop(0, colors.accentLight);
    logoGrad.addColorStop(1, colors.accent);
    ctx.fillStyle = logoGrad;
    drawRoundRect(ctx, 70, 90, 70, 70, 20);
    ctx.fill();

    // Bolt glyph inside Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', 105, 127);

    // FitAI Text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 36px system-ui, -apple-system, sans-serif";
    ctx.fillText('FITAI', 160, 115);

    ctx.fillStyle = colors.accentLight;
    ctx.font = "800 16px system-ui, -apple-system, sans-serif";
    ctx.fillText('PRO • IA FITNESS', 160, 145);

    // Right User Pill
    const displayUser = userName.toUpperCase();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 24px system-ui, -apple-system, sans-serif";
    ctx.fillText(displayUser, width - 70, 115);

    ctx.fillStyle = colors.accentLight;
    ctx.font = "800 18px system-ui, -apple-system, sans-serif";
    ctx.fillText(`NÍVEL ${userLevel} • ${userPoints} XP`, width - 70, 145);

    // 6. Center Layout by Format
    if (format === 'story') {
      renderStoryCanvas(ctx, width, height, colors);
    } else if (format === 'square') {
      renderSquareCanvas(ctx, width, height, colors);
    } else {
      renderCardCanvas(ctx, width, height, colors);
    }

    // 7. Footer Watermark & Hashtags
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = "700 20px system-ui, -apple-system, sans-serif";
    ctx.fillText('Gerado por FitAI • Seu Personal & Nutricionista com IA', width / 2, height - 90);

    ctx.fillStyle = colors.accentLight;
    ctx.font = "800 16px system-ui, -apple-system, sans-serif";
    ctx.fillText('#FitAI #InstagramStories #FocoTotal #TreinoDiario', width / 2, height - 60);
  }, [format, theme, streakDays, completedWorkoutsCount, totalDays, waterPercent, todayWaterTotal, userLevel, userPoints, weightCurrent, targetWeight, userName, customAchievement]);

  // Clean single effect triggered on modal state change or mode change (guaranteed no infinite loop)
  useEffect(() => {
    if (!isOpen) return;
    renderCanvas();
    const frameId = requestAnimationFrame(() => {
      renderCanvas();
    });
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, renderCanvas]);

  // Generate Image Blob with html2canvas (or canvas fallback) ensuring promise completes before sharing
  const generateImageBlob = async (): Promise<Blob | null> => {
    // 1. Try html2canvas on the card container DOM if available
    const targetElement = cardContainerRef.current;
    if (targetElement) {
      try {
        const capturedCanvas = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false
        });
        const blob = await new Promise<Blob | null>((resolve) => {
          capturedCanvas.toBlob((b) => resolve(b), 'image/png', 0.95);
        });
        if (blob) return blob;
      } catch (err) {
        console.warn("html2canvas DOM capture warning, using canvas directly:", err);
      }
    }

    // 2. Direct high-DPI Canvas fallback
    const canvas = canvasRef.current;
    if (canvas) {
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            // Fallback via dataURL
            try {
              const dataUrl = canvas.toDataURL('image/png', 0.95);
              resolve(dataURItoBlob(dataUrl));
            } catch {
              resolve(null);
            }
          }
        }, 'image/png', 0.95);
      });
    }

    return null;
  };

  // Download image as PNG
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImageBlob();
      if (!blob) throw new Error('Não foi possível gerar a imagem.');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `fitai-stories-${streakDays}dias-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareSuccess('Imagem salva na sua galeria/downloads com sucesso!');
      setTimeout(() => setShareSuccess(null), 4000);
    } catch (err) {
      console.error("Error downloading image:", err);
    } finally {
      setIsGenerating(false);
    }
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

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(caption);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = caption;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setShareSuccess('Legenda copiada para a área de transferência!');
      setTimeout(() => {
        setIsCopied(false);
        setShareSuccess(null);
      }, 3500);
    } catch (err) {
      console.warn("Failed to copy caption:", err);
    }
  };

  // Native navigator.share for Android / iOS - Awaiting blob generation BEFORE calling native share API
  const handleNativeShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // 1. Ensure html2canvas / canvas generates the blob completely BEFORE invoking navigator.share
      const blob = await generateImageBlob();
      if (!blob) {
        throw new Error('Falha ao processar o blob da imagem');
      }

      const file = new File([blob], `fitai-stories-${streakDays}dias.png`, { type: 'image/png' });
      const shareText = `🔥 Minha evolução no FitAI: ${streakDays} dias de ofensiva com foco total! Nível ${userLevel} • ${userPoints} XP. #FitAI #InstagramStories #Fitness`;

      // 2. Check if browser supports sharing files natively
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Meu Progresso no FitAI',
          text: shareText,
          files: [file]
        });
        setShareSuccess('Compartilhado com sucesso!');
        setShowMobileShareDrawer(false);
        return;
      }

      // 3. Fallback to native text/url share if file sharing is not supported by device
      if (navigator.share) {
        await navigator.share({
          title: 'Meu Progresso no FitAI',
          text: shareText,
          url: window.location.origin
        });
        setShareSuccess('Compartilhado com sucesso!');
        setShowMobileShareDrawer(false);
        return;
      }

      // 4. Open fallback quick share drawer if Web Share API is not available
      setShowMobileShareDrawer(true);
    } catch (err: any) {
      // If user cancelled, don't show error; otherwise show drawer fallback
      if (err?.name !== 'AbortError') {
        console.warn("navigator.share fallback:", err);
        setShowMobileShareDrawer(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct Instagram Stories flow
  const handleInstagramStories = async () => {
    handleCopyCaption();
    await handleDownload();

    try {
      const blob = await generateImageBlob();
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
    } catch (e) {
      console.warn("Instagram Stories direct share fallback:", e);
    }

    setShareSuccess('Card salvo na galeria e legenda copiada! Abra os Stories do Instagram para postar.');
    setTimeout(() => {
      window.open('https://www.instagram.com', '_blank');
    }, 800);
  };

  // Direct WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 *Minha evolução no FitAI*:\n` +
      `• *Ofensiva*: ${streakDays} dias seguidos\n` +
      `• *Treinos*: ${completedWorkoutsCount}/${totalDays} no plano\n` +
      `• *Hidratação*: ${waterPercent}% da meta batida\n` +
      `• *Nível*: ${userLevel} (${userPoints} XP)\n\n` +
      `Treinando com Inteligência Artificial no FitAI! 💪⚡\n` +
      `${window.location.origin}`
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col my-auto relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-600/30">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Compartilhar nos Stories
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 font-black border border-pink-500/30">
                    Instagram 9:16 HD
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Template em alta definição pronto para redes sociais</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 overflow-y-auto">
            {/* Left: Live Canvas / Image Preview with cardContainerRef for html2canvas */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-900/50 rounded-3xl p-3 sm:p-4 border border-zinc-800 relative min-h-[300px]">
              <div 
                ref={cardContainerRef}
                className="relative max-h-[440px] w-full flex items-center justify-center overflow-hidden rounded-2xl"
              >
                {/* Real Canvas element */}
                <canvas
                  ref={canvasRef}
                  className="max-h-[420px] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              </div>

              {shareSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 text-center"
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
                      className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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

                {/* 3. Quick Social Actions */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    3. Compartilhar Direto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleInstagramStories}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-500 hover:opacity-90 text-white border border-pink-500/40 text-xs font-black transition-all active:scale-95 shadow-md shadow-pink-600/20 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      Instagram Stories
                    </button>

                    <button
                      onClick={handleWhatsAppShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      WhatsApp
                    </button>

                    <button
                      onClick={handleTelegramShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-blue-400" />
                      Telegram
                    </button>

                    <button
                      onClick={handleTwitterShare}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-sm font-black">𝕏</span>
                      Twitter / X
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Actions: Mobile Native Share & Download */}
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                {/* Mobile-Native Share Trigger Button */}
                <button
                  onClick={handleNativeShare}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-yellow-300" />
                  {isGenerating ? 'Gerando Imagem...' : 'Abrir Menu de Compartilhar (Celular)'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-pink-400" />
                    Baixar PNG HD
                  </button>

                  <button
                    onClick={handleCopyCaption}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer active:scale-95"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-pink-400" />}
                    {isCopied ? 'Copiado!' : 'Copiar Legenda'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Fallback Drawer for direct social links if native share is blocked */}
          {showMobileShareDrawer && (
            <div className="px-5 py-4 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Escolha o app para compartilhar agora:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleWhatsAppShare}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={handleTelegramShare}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Telegram
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Imagem
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
