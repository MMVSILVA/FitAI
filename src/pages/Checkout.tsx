import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { CheckCircle2, CreditCard, ShieldCheck, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') as 'PRO' | 'PREMIUM' | 'PROFESSIONAL' || 'PRO';
  const navigate = useNavigate();
  const { user, upgradePlan } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceMap = {
    'PRO': '39,90',
    'PREMIUM': '59,90',
    'PROFESSIONAL': '149,90'
  };
  const price = priceMap[plan as 'PRO' | 'PREMIUM' | 'PROFESSIONAL'];

  // Links reais de pagamento do Stripe - NUNCA use URLs de teste fixas em produção
  const stripeLinkPro = import.meta.env.VITE_STRIPE_LINK_PRO;
  const stripeLinkPremium = import.meta.env.VITE_STRIPE_LINK_PREMIUM;
  const stripeLinkProfessional = import.meta.env.VITE_STRIPE_LINK_PROFESSIONAL;

  const getManualLink = () => {
    let base = '';
    if (plan === 'PROFESSIONAL') base = stripeLinkProfessional;
    else if (plan === 'PREMIUM') base = stripeLinkPremium;
    else base = stripeLinkPro;
    
    if (!base) return null;
    
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${user?.uid ? separator + 'client_reference_id=' + user.uid : ''}`;
  };

  const handleCheckout = async () => {
    if (!user) {
      setError("Você precisa estar logado para realizar a assinatura.");
      return;
    }
    setLoading(true);
    setError(null);
    const origin = window.location.origin;
    
    const timer = setTimeout(() => {
      setLoading(false);
      setError("O redirecionamento está demorando. Tente o link manual abaixo.");
    }, 8000);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: user?.uid,
          userEmail: user?.email
        }),
      });

      clearTimeout(timer);

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          try {
            const win = window.open(data.url, '_blank');
            if (!win) {
               throw new Error("Popup blocked");
            }
          } catch (e) {
            window.location.href = data.url;
          }
          return;
        }
      } else {
        const text = await response.text();
        let errorMsg = "Erro ao criar sessão";
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = `Erro do servidor (${response.status}): ${text.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }
      throw new Error("A resposta do servidor não continha uma URL");
    } catch (err: any) {
      clearTimeout(timer);
      console.error("Erro no pagamento:", err);
      setError(err.message || "Não conseguimos gerar o pagamento automático. Use o botão abaixo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-6 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -track-x-1/2 w-[800px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
      
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Resumo do Pedido */}
        <div className="space-y-6">
          <button onClick={() => user ? navigate('/dashboard') : navigate('/')} className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">Assinar FitAI {plan}</h2>
            <p className="text-gray-500 dark:text-gray-400">Desbloqueie todo o potencial da IA para seus resultados.</p>
          </div>

          <div className="bg-gray-100 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
              <span className="text-lg text-gray-600 dark:text-gray-300">Plano Mensal</span>
              <span className="text-2xl font-bold">R$ {price}</span>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Treinos adaptativos ilimitados
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Plano alimentar completo
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Acompanhamento de evolução
              </li>
              {(plan === 'PREMIUM' || plan === 'PROFESSIONAL') && (
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Chat 24h com Coach IA
                </li>
              )}
              {plan === 'PROFESSIONAL' && (
                <>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Suporte Prioritário
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Consultas exclusivas
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Redirecionamento de Pagamento Real */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-green-500" />
          </div>

          <h3 className="text-2xl font-bold mb-4">Pagamento Seguro</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
            Você será redirecionado para o ambiente criptografado do Stripe para concluir sua assinatura de forma 100% segura.
          </p>

          <div className="w-full space-y-4">
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-green-600 dark:bg-green-500 text-white dark:text-black p-4 rounded-xl font-bold text-lg hover:after:bg-green-500 dark:hover:bg-green-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <RefreshCw className="w-6 h-6" />
                </motion.div>
              ) : (
                <>
                  Ir para o Pagamento <ExternalLink className="w-5 h-5" />
                </>
              )}
            </button>

            {error && getManualLink() && (
              <div className="space-y-3">
                <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
                <a 
                  href={getManualLink()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gray-200 dark:bg-white/10 text-black dark:text-white p-4 rounded-xl font-bold text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                >
                  Ir para Pagamento Direto
                </a>
              </div>
            )}
            {error && !getManualLink() && (
               <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
            )}
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-4 opacity-50">
            {/* Logos de cartões genéricos */}
            <div className="flex gap-2">
              <div className="w-10 h-6 bg-gray-300 dark:bg-white/20 rounded"></div>
              <div className="w-10 h-6 bg-gray-300 dark:bg-white/20 rounded"></div>
              <div className="w-10 h-6 bg-gray-300 dark:bg-white/20 rounded"></div>
            </div>
            <span className="text-xs font-medium dark:text-gray-400">Powered by Stripe</span>
          </div>
        </div>

      </div>
    </div>
  );
}
