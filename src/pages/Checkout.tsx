import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { CheckCircle2, CreditCard, ShieldCheck, ArrowLeft, ExternalLink, RefreshCw, X } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const rawPlan = searchParams.get('plan') || 'PRO';
  const plan = rawPlan.toUpperCase() as 'PRO' | 'PREMIUM' | 'PROFISSIONAL';
  const navigate = useNavigate();
  const { user, upgradePlan } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceMap = {
    'PRO': '39,90',
    'PREMIUM': '59,90',
    'PROFISSIONAL': '149,90'
  };
  const price = priceMap[plan] || priceMap['PRO'];

  // Links reais de pagamento do Stripe - NUNCA use URLs de teste fixas em produção
  const stripeLinkPro = import.meta.env.VITE_STRIPE_LINK_PRO;
  const stripeLinkPremium = import.meta.env.VITE_STRIPE_LINK_PREMIUM;
  const stripeLinkProfissional = import.meta.env.VITE_STRIPE_LINK_PROFISSIONAL;

  const getManualLink = () => {
    let base = '';
    if (plan === 'PROFISSIONAL') base = stripeLinkProfissional;
    else if (plan === 'PREMIUM') base = stripeLinkPremium;
    else base = stripeLinkPro;
    
    if (!base) return null;
    
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${user?.uid ? separator + 'client_reference_id=' + user.uid : ''}`;
  };

  const handleCheckout = async () => {
    const link = getManualLink();
    if (link) {
      window.location.href = link;
    } else {
      setError("Link de pagamento não configurado.");
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
              <span className="text-lg text-gray-600 dark:text-gray-300">Mensal</span>
              <div className="text-right">
                <span className="text-2xl font-bold">R$ {price}</span>
                <span className="text-sm font-medium text-gray-500 ml-1">/mês</span>
              </div>
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
              {(plan === 'PREMIUM' || plan === 'PROFISSIONAL') && (
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Chat 24h com Coach IA
                </li>
              )}
              {plan === 'PROFISSIONAL' && (
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

          <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">Pagamento Seguro</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
            Você será redirecionado para o ambiente criptografado do Stripe para concluir sua assinatura de forma 100% segura.
          </p>

          <div className="w-full space-y-4">
            <a 
              href={getManualLink() || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!getManualLink()) {
                  e.preventDefault();
                  setError("Configuração pendente: Link de pagamento não encontrado.");
                }
              }}
              className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-xl transition-all shadow-xl ${
                getManualLink() 
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20 active:scale-[0.98]' 
                : 'bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed'
              }`}
            >
              Ir para o Pagamento
              <ExternalLink className="w-6 h-6" />
            </a>

            {error && (
              <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 text-left space-y-3">
                <p className="text-red-500 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                  <X className="w-4 h-4" /> Erro de Configuração
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  O link de pagamento para o plano <span className="font-bold text-red-500">{plan}</span> não foi configurado nas Variáveis de Ambiente (Settings).
                </p>
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg text-[10px] font-mono text-gray-400 break-all">
                  Necessário: VITE_STRIPE_LINK_{plan === 'PROFISSIONAL' ? 'PROFISSIONAL' : plan}
                </div>
              </div>
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
