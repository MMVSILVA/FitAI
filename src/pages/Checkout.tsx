import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { CheckCircle2, ShieldCheck, ArrowLeft, ExternalLink, AlertCircle, Sparkles, Check, Tag } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const rawPlan = searchParams.get('plan') || 'PRO';
  const plan = rawPlan.toUpperCase() as 'PRO' | 'PREMIUM' | 'PROFISSIONAL';
  const navigate = useNavigate();
  const { user, authLoading } = useUser();
  const [errorMessage] = useState<string | null>(null);

  const isComingSoon = plan === 'PREMIUM' || plan === 'PROFISSIONAL';

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=checkout&plan=' + plan);
    }
  }, [user, authLoading, plan, navigate]);

  const priceMap = {
    'PRO': '39,90',
    'PREMIUM': '59,90',
    'PROFISSIONAL': '149,90'
  };
  const price = priceMap[plan] || priceMap['PRO'];

  // Link direto de pagamento configurado (VITE_STRIPE_LINK_PRO)
  const defaultProLink = 'https://buy.stripe.com/3cIbJ0aC423f65b6Vd4wM02';
  const rawStripeLinkPro = import.meta.env.VITE_STRIPE_LINK_PRO || '';
  const stripeLinkPro = (rawStripeLinkPro && !rawStripeLinkPro.includes('your_pro_link'))
    ? rawStripeLinkPro.trim()
    : defaultProLink;

  const isValidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return (trimmed.startsWith('https://') || trimmed.startsWith('http://')) && !trimmed.includes('your_pro_link');
  };

  const getManualLink = () => {
    if (isComingSoon) return defaultProLink;
    const base = stripeLinkPro.trim() || defaultProLink;
    if (!isValidUrl(base)) return defaultProLink;
    
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${user?.uid ? separator + 'client_reference_id=' + encodeURIComponent(user.uid) : ''}${user?.email ? (user?.uid ? '&' : '?') + 'prefilled_email=' + encodeURIComponent(user.email) : ''}`;
  };

  const hasValidDirectLink = isValidUrl(stripeLinkPro);
  const finalPaymentUrl = getManualLink() || defaultProLink;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-6 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -track-x-1/2 w-[800px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
      
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Resumo do Pedido */}
        <div className="space-y-6">
          <button 
            onClick={() => user ? navigate('/dashboard') : navigate('/')} 
            className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black tracking-tight">Assinar FitAI {plan}</h2>
              {isComingSoon ? (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full">
                  Em Breve
                </span>
              ) : (
                <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Mais Popular
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isComingSoon 
                ? "Este plano está sendo preparado para o próximo lançamento." 
                : "Desbloqueie todo o potencial da IA com treinos e dietas personalizados e ilimitados."}
            </p>
          </div>

          {isComingSoon && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-left space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h4 className="font-black text-sm uppercase tracking-wider">Plano Em Breve</h4>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                O plano <strong className="text-white">{plan}</strong> ainda não está aberto para contratação. 
                O <strong className="text-purple-400">Plano PRO</strong> está 100% ativo com todos os recursos inteligentes para sua transformação física!
              </p>
              <button
                onClick={() => navigate('/checkout?plan=PRO', { replace: true })}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Mudar para Plano PRO (R$ 39,90/mês)
              </button>
            </motion.div>
          )}

          <div className="bg-gray-100 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-200">Mensalidade</span>
                  <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">Recorrente</span>
                </div>
                <p className="text-xs text-gray-500">Renovação a cada 30 dias • Cancele quando quiser</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-purple-600 dark:text-purple-400">R$ {price}</span>
                <span className="text-sm font-medium text-gray-500 ml-1">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                Treinos adaptativos ilimitados por IA
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                Plano alimentar completo, macros e suplementação
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                Chat 24h com Coach IA & ajustes diários
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                Acompanhamento, fotos e progressão de cargas
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                Suporte prioritário VIP
              </li>
              {isComingSoon && (
                <li className="flex items-center gap-3 text-sm font-medium text-gray-500">
                  <CheckCircle2 className="w-5 h-5 text-gray-600 shrink-0" />
                  Recursos corporativos do plano {plan} (no lançamento)
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Painel de Pagamento */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-between text-center">
          <div>
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-green-500" />
            </div>

            <h3 className="text-2xl font-black mb-3 text-black dark:text-white">Pagamento Seguro</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto leading-relaxed">
              Você será redirecionado para o checkout oficial do Stripe para concluir a assinatura com cartão, boleto ou Pix.
            </p>

            {/* Validação de link direto ativa */}
            {hasValidDirectLink && (
              <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" /> Link oficial de pagamento validado
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="w-full space-y-4">
            {isComingSoon ? (
              <button 
                disabled
                className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-base uppercase tracking-wider bg-zinc-800 border border-white/10 text-gray-500 cursor-not-allowed"
              >
                Plano Em Breve (Indisponível)
              </button>
            ) : (
              <div className="space-y-3">
                <a
                  href={finalPaymentUrl || defaultProLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-lg transition-all shadow-xl uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white shadow-green-600/20 active:scale-[0.98] text-center cursor-pointer block"
                >
                  Ir para o Pagamento
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            )}

            <div className="pt-4 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>Cartão</span> • <span>Pix / Boleto</span> • <span>Apple Pay / Google Pay</span>
              </div>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Checkout 100% Seguro Powered by Stripe</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
