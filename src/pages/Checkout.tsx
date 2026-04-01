import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { CheckCircle2, CreditCard, ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') as 'PRO' | 'PREMIUM' || 'PRO';
  const navigate = useNavigate();
  const { user, upgradePlan } = useUser();
  const [loading, setLoading] = useState(false);

  const price = plan === 'PRO' ? '39,90' : '59,90';

  // Links reais de pagamento do Stripe (configurados no .env)
  const stripeLinkPro = import.meta.env.VITE_STRIPE_LINK_PRO || '#';
  const stripeLinkPremium = import.meta.env.VITE_STRIPE_LINK_PREMIUM || '#';

  const handlePayment = () => {
    setLoading(true);
    
    const baseUrl = plan === 'PRO' ? stripeLinkPro : stripeLinkPremium;
    
    // Se não houver link configurado ou for inválido, simula o pagamento para testes
    if (!baseUrl || baseUrl === '#' || !baseUrl.startsWith('http')) {
      setTimeout(() => {
        upgradePlan(plan);
        navigate('/dashboard');
      }, 1500);
      return;
    }

    // Adiciona o email de forma segura, verificando se a URL já tem parâmetros
    try {
      const url = new URL(baseUrl);
      if (user?.email) {
        url.searchParams.append('prefilled_email', user.email);
      }
      window.location.href = url.toString();
    } catch (error) {
      console.error("Link de pagamento inválido:", error);
      // Fallback para simulação se a URL for inválida
      setTimeout(() => {
        upgradePlan(plan);
        navigate('/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
      
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Resumo do Pedido */}
        <div className="space-y-6">
          <Link to="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">Assinar FitAI {plan}</h2>
            <p className="text-gray-400">Desbloqueie todo o potencial da IA para seus resultados.</p>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
              <span className="text-lg text-gray-300">Plano Mensal</span>
              <span className="text-2xl font-bold">R$ {price}</span>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Treinos adaptativos ilimitados
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Plano alimentar completo
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Acompanhamento de evolução
              </li>
              {plan === 'PREMIUM' && (
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Chat 24h com Coach IA
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Redirecionamento de Pagamento Real */}
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-green-500" />
          </div>

          <h3 className="text-2xl font-bold mb-4">Pagamento Seguro</h3>
          <p className="text-gray-400 mb-8 max-w-sm">
            Você será redirecionado para o ambiente criptografado do Stripe para concluir sua assinatura de forma 100% segura.
          </p>

          <button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-green-500 text-black p-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <CheckCircle2 className="w-6 h-6" />
              </motion.div>
            ) : (
              <>
                Ir para o Pagamento <ExternalLink className="w-5 h-5" />
              </>
            )}
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-4 opacity-50">
            {/* Logos de cartões genéricos */}
            <div className="flex gap-2">
              <div className="w-10 h-6 bg-white/20 rounded"></div>
              <div className="w-10 h-6 bg-white/20 rounded"></div>
              <div className="w-10 h-6 bg-white/20 rounded"></div>
            </div>
            <span className="text-xs font-medium">Powered by Stripe</span>
          </div>
        </div>

      </div>
    </div>
  );
}
