import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { CheckCircle2, ShieldCheck, ArrowLeft, ExternalLink, RefreshCw, X, AlertCircle, Sparkles, Check } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const rawPlan = searchParams.get('plan') || 'PRO';
  const plan = rawPlan.toUpperCase() as 'PRO' | 'PREMIUM' | 'PROFISSIONAL';
  const navigate = useNavigate();
  const { user, authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Link direto de pagamento configurado
  const stripeLinkPro = import.meta.env.VITE_STRIPE_LINK_PRO || 'https://buy.stripe.com/3cIbJ0aC423f65b6Vd4wM02';

  const isValidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('https://') || trimmed.startsWith('http://');
  };

  const getManualLink = () => {
    if (isComingSoon) return null;
    const base = stripeLinkPro.trim();
    if (!isValidUrl(base)) return null;
    
    const separator = base.includes('?') ? '&' : '?';
    // Adiciona o UID do usuário para vincular o pagamento à conta
    return `${base}${user?.uid ? separator + 'client_reference_id=' + encodeURIComponent(user.uid) : ''}${user?.email ? (user?.uid ? '&' : '?') + 'prefilled_email=' + encodeURIComponent(user.email) : ''}`;
  };

  const hasValidDirectLink = isValidUrl(stripeLinkPro);

  const handleCheckout = async () => {
    if (isComingSoon) {
      setError("Este plano estará disponível em breve. Por favor, assine o plano PRO.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'PRO',
          userId: user?.uid,
          userEmail: user?.email
        })
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      } else {
        // Se a API retornou erro mas temos o link de pagamento direto configurado e validado
        const manualLink = getManualLink();
        if (manualLink) {
          window.location.href = manualLink;
          return;
        }
        throw new Error(data.error || "Erro ao criar sessão de pagamento.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      
      const manualLink = getManualLink();
      if (manualLink) {
        window.location.href = manualLink;
      } else {
        setError(err.message || "Não foi possível iniciar o checkout. Verifique as configurações do Stripe nas variáveis de ambiente.");
      }
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

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
              {isComingSoon && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full">
                  Em Breve
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isComingSoon 
                ? "Este plano está sendo preparado para o próximo lançamento." 
                : "Desbloqueie todo o potencial da IA com treinos e dietas ilimitados."}
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
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">Mensalidade</span>
                <p className="text-xs text-gray-500">Renovação a cada 30 dias</p>
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
              Você será redirecionado para o ambiente seguro e criptografado do Stripe para concluir a assinatura com cartão ou boleto.
            </p>

            {/* Validação de link direto ativa */}
            {hasValidDirectLink && (
              <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" /> Link oficial de pagamento validado
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
              <button 
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-lg transition-all shadow-xl uppercase tracking-wider ${
                  loading 
                  ? 'bg-gray-400 dark:bg-zinc-700 cursor-wait text-white' 
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20 active:scale-[0.98]' 
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Ir para o Pagamento
                    <ExternalLink className="w-5 h-5" />
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 text-left space-y-3">
                <p className="text-red-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <X className="w-4 h-4" /> Problema na Conexão com Stripe
                </p>
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2">
                  {error.includes('*') || error.includes('asteriscos') || error.includes('Autenticação') || error.includes('Invalid API Key') || error.includes('rk_') || error.includes('sk_') ? (
                    <>
                      <p className="font-semibold text-red-400">
                        A chave secreta do Stripe configurada está mascarada ou incompleta (ex: <code>rk_1TGql...V3ry</code>).
                      </p>
                      <ol className="list-decimal list-inside text-xs space-y-1 text-gray-400">
                        <li>Acesse o <strong>Stripe Dashboard &gt; Desenvolvedores &gt; Chaves de API</strong></li>
                        <li>Clique em <strong>Revelar chave secreta</strong> (Reveal key) para ver todos os caracteres</li>
                        <li>Copie o texto completo (<code>sk_live_...</code> ou <code>rk_live_...</code>)</li>
                        <li>Abra o menu <strong>Settings (Configurações)</strong> no topo do editor e atualize a variável <code>STRIPE_SECRET_KEY</code></li>
                      </ol>
                    </>
                  ) : (
                    <p>{error}</p>
                  )}
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg text-[11px] font-mono text-gray-500 dark:text-gray-400 break-words">
                  {error}
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-center gap-4 opacity-60">
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
    </div>
  );
}
