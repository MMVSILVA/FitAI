import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Brain, Dumbbell, Apple, Zap, CheckCircle2, Download, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after a short delay
      setTimeout(() => setShowInstallBanner(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && deferredPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-20 left-6 right-6 z-[60] bg-purple-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 md:max-w-md md:left-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Instale o FitAI</p>
                <p className="text-xs text-purple-100">Acesse seus treinos direto da tela inicial.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors"
              >
                Instalar
              </button>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12" />
            <span className="text-3xl font-black tracking-tight">
              <span className="text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">Fit</span>
              <span className="text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link
              to="/onboarding"
              className="text-xs sm:text-sm font-bold bg-green-500 text-black px-3 py-2 sm:px-4 sm:py-2 rounded-full hover:bg-green-400 transition-colors"
            >
              Começar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-400"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Seu personal trainer 24h
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              Treino e dieta ajustados por <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">IA</span>
            </h1>
            <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
              Transforme seu corpo e supere seus limites. O FitAI cria, adapta e evolui sua rotina de treinos e nutrição com inteligência artificial para você alcançar resultados extraordinários.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/onboarding"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-green-400 hover:scale-105 transition-all"
            >
              Gerar meu plano agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
              >
                <Download className="w-5 h-5 text-purple-400" />
                Baixar App
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-zinc-950/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Como funciona?</h2>
            <p className="text-gray-400 mt-4">Tudo que você precisa em um só lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-6 h-6 text-purple-400" />}
              title="1. Análise Inteligente"
              description="A IA analisa seu perfil, objetivos e limitações para criar a base perfeita."
            />
            <FeatureCard 
              icon={<Dumbbell className="w-6 h-6 text-purple-400" />}
              title="2. Treino Adaptativo"
              description="Sua rotina muda conforme você evolui. Progressão de carga calculada automaticamente."
            />
            <FeatureCard 
              icon={<Apple className="w-6 h-6 text-purple-400" />}
              title="3. Nutrição Precisa"
              description="Macros e refeições ajustadas para o seu objetivo, sem dietas impossíveis."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Planos simples e diretos</h2>
            <p className="text-gray-400 mt-4">Comece de graça, evolua quando quiser.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
              name="Free"
              price="R$ 0"
              description="Para quem quer testar a tecnologia."
              features={["Treino inicial gerado por IA", "Cálculo de macros básico", "Acesso por 7 dias"]}
              buttonText="Começar Grátis"
              buttonLink="/onboarding"
            />
            <PricingCard 
              name="Pro"
              price="R$ 39,90"
              period="/mês"
              highlighted={true}
              description="O plano ideal para resultados reais."
              features={["Treinos adaptativos ilimitados", "Plano alimentar completo", "Progressão de carga automática", "Suporte prioritário"]}
              buttonText="Assinar Pro"
              buttonLink="/checkout?plan=PRO"
            />
            <PricingCard 
              name="Premium"
              price="R$ 59,90"
              period="/mês"
              description="Acompanhamento nível atleta."
              features={["Tudo do plano Pro", "Chat 24h com Coach IA", "Ajustes diários de dieta", "Análise avançada de progresso"]}
              buttonText="Assinar Premium"
              buttonLink="/checkout?plan=PREMIUM"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center text-gray-500">
        <p>© 2026 FitAI. Todos os direitos reservados. <br className="sm:hidden" /><span className="hidden sm:inline"> | </span>by Márcio Vinícius</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ 
  name, price, period = "", description, features, buttonText, buttonLink, highlighted = false 
}: { 
  name: string, price: string, period?: string, description: string, features: string[], buttonText: string, buttonLink: string, highlighted?: boolean 
}) {
  return (
    <div className={`p-8 rounded-3xl border ${highlighted ? 'bg-purple-900/20 border-purple-500 relative' : 'bg-white/5 border-white/10'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
          Mais popular
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-gray-400 text-sm mb-6">{description}</p>
      <div className="mb-8">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-400">{period}</span>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to={buttonLink}
        className={`block w-full text-center py-3 rounded-xl font-bold transition-colors ${
          highlighted 
            ? 'bg-purple-600 hover:bg-purple-500 text-white' 
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  );
}
