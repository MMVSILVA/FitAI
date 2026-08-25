import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, LogIn, Camera, Loader2 } from 'lucide-react';
import { signInWithGoogle, auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '../store/userStore';
import { Logo } from '../components/Logo';
import { LegalConsent } from '../components/LegalConsent';

export default function Login() {
  const navigate = useNavigate();
  const { user, profile, plan, role, authLoading, isAdmin } = useUser();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Navigate once user and basic role info is available
    if (user && !authLoading) {
      console.log("Direcionando usuário logado...", { email: user.email, role, isAdmin });
      
      // Prioritize Professional Panels ONLY if they are NOT the main "user" flow
      // or if they explicitly have that role and NO plan yet.
      // However, usually, a trainer/nutri who is also a user might want their dashboard.
      
      // Redirecionamento inteligente:
      // 1. Admins sempre vão para o dashboard principal
      // 2. Usuários com plano (profile e plan) vão para o dashboard principal
      // 3. Profissionais sem plano de treino vão para seus painéis específicos
      // 4. Novos usuários vão para onboarding
      
      let targetPath = '/onboarding';
      
      if (isAdmin) {
        targetPath = '/dashboard';
      } else if (profile && plan) {
        targetPath = '/dashboard';
      } else if (role === 'trainer') {
        targetPath = '/trainer';
      } else if (role === 'nutritionist') {
        targetPath = '/nutritionist';
      } else {
        targetPath = '/onboarding';
      }
      
      navigate(targetPath);
    }
  }, [user, profile, plan, role, authLoading, isAdmin, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // LGPD Consent Gate
    const hasAgreed = localStorage.getItem('fitai_lgpd_consent') === 'true';
    if (!hasAgreed) {
      setPendingAuthAction(() => () => proceedWithAuth());
      setShowLegal(true);
      return;
    }

    proceedWithAuth();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (resetEmail || email).trim().toLowerCase();
    if (!cleanEmail) {
      setError('Por favor, informe seu email para redefinir a senha.');
      return;
    }

    setResetLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccess(true);
      setSuccessMessage('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada e spam.');
    } catch (err: any) {
      console.error("Erro ao enviar email de recuperação:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Não encontramos nenhuma conta com este email. Verifique o endereço ou cadastre-se.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O formato do email é inválido.');
      } else {
        setError('Erro ao enviar email de redefinição. Tente novamente mais tarde.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const proceedWithAuth = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const newUser = userCredential.user;
        
        let photoURL = '';
        if (photoFile) {
          try {
            const storageRef = ref(storage, `profile_photos/${newUser.uid}`);
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
          } catch (uploadError) {
            console.error("Erro ao fazer upload da foto:", uploadError);
            // Continua mesmo se a foto falhar
          }
        }

        await updateProfile(newUser, {
          displayName: name.trim(),
          photoURL: photoURL || null
        });

        await setDoc(doc(db, 'users', newUser.uid), {
          displayName: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          photoURL,
          role: 'user',
          planType: 'FREE',
          isPremium: false,
          createdAt: new Date().toISOString()
        });

      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      }
      // Navigation is handled by useEffect
    } catch (err: any) {
      console.error("Erro no Auth:", err);
      const code = err.code || '';
      const msg = err.message || '';

      if (code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Faça login ou use outro e-mail.');
      } else if (code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (
        code === 'auth/user-not-found' || 
        code === 'auth/wrong-password' || 
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials' ||
        msg.includes('invalid-credential') ||
        msg.includes('invalid-login-credentials')
      ) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais, crie uma conta nova se não for cadastrado, ou redefina sua senha.');
      } else if (code === 'auth/invalid-email') {
        setError('O formato do e-mail é inválido.');
      } else if (code === 'auth/too-many-requests') {
        setError('Muitas tentativas consecutivas. Aguarde alguns minutos ou redefina sua senha.');
      } else if (code === 'auth/user-disabled') {
        setError('Esta conta de usuário foi desativada.');
      } else if (code === 'auth/network-request-failed') {
        setError('Erro de conexão com a internet. Verifique sua rede e tente novamente.');
      } else {
        setError(isSignUp ? 'Erro ao criar conta. Verifique os dados e tente novamente.' : 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // LGPD Consent Gate
    const hasAgreed = localStorage.getItem('fitai_lgpd_consent') === 'true';
    if (!hasAgreed) {
      setPendingAuthAction(() => () => proceedWithGoogle());
      setShowLegal(true);
      return;
    }
    
    proceedWithGoogle();
  };

  const proceedWithGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
      // Navigation is handled by useEffect
    } catch (err: any) {
      console.error("Erro detalhado do Google Login:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado. Por favor, tente novamente.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`URGENTE: O Firebase está bloqueando este site. Adicione este texto exato lá no Firebase: ${window.location.hostname}`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login com Google não está ativado no Firebase. Por favor, ative-o no Console do Firebase.');
      } else {
        setError(`Erro ao fazer login com Google: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      <LegalConsent 
        isOpen={showLegal} 
        onClose={() => setShowLegal(false)}
        onAccept={() => {
          localStorage.setItem('fitai_lgpd_consent', 'true');
          setShowLegal(false);
          if (pendingAuthAction) {
            pendingAuthAction();
            setPendingAuthAction(null);
          }
        }}
      />
      {(authLoading || isRedirecting) && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
              />
              <Logo className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white mb-1">Entrando...</p>
              <p className="text-gray-400 text-sm">Preparando seu treino personalizado</p>
            </div>
            {user && (
              <button 
                onClick={() => {
                  const targetPath = role === 'trainer' ? '/trainer' : 
                                     role === 'nutritionist' ? '/nutritionist' :
                                     (!profile || !plan) ? '/onboarding' : '/dashboard';
                  navigate(targetPath);
                }}
                className="mt-4 bg-white text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
              >
                Prosseguir
              </button>
            )}
          </div>
        </motion.div>
      )}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] -z-10" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-3">
        <Logo className="w-12 h-12" />
        <span className="text-3xl font-black tracking-tight">
          <span className="text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">Fit</span>
          <span className="text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">AI</span>
        </span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl"
      >
        <h2 className="text-3xl font-bold mb-2 text-center">
          {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {isSignUp ? 'Comece sua jornada fitness com IA.' : 'Acesse seu plano de treino e dieta.'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
            <p className="text-center mb-2">{error}</p>
            {!isSignUp && (
              <div className="flex justify-center gap-3 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSuccess(false);
                    setError('');
                    setShowForgotModal(true);
                  }}
                  className="text-purple-400 hover:underline font-medium"
                >
                  Esqueci a senha
                </button>
                <span className="text-white/20">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className="text-purple-400 hover:underline font-medium"
                >
                  Criar nova conta
                </button>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 text-sm text-center">
            {successMessage}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black p-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {isSignUp ? 'Cadastrar com Google' : 'Entrar com Google'}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-gray-500 text-sm">ou</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="flex flex-col items-center mb-6">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors overflow-hidden relative group"
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 group-hover:text-purple-400 transition-colors">
                      <Camera className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Foto</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-400">Senha</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSuccess(false);
                    setError('');
                    setSuccessMessage('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Criar conta' : 'Entrar'} <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMessage('');
              }} 
              className="text-purple-400 hover:text-purple-300 font-medium ml-2"
            >
              {isSignUp ? 'Entrar' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h3>
            <p className="text-gray-400 text-sm mb-6">
              Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha com segurança.
            </p>

            {resetSuccess ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
                  Link de recuperação enviado com sucesso para <strong className="text-white">{resetEmail || email}</strong>! Verifique sua caixa de entrada e spam.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSuccess(false);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-xl transition-colors"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Seu E-mail</label>
                  <input 
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-gray-300 font-bold p-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Link'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      <div className="absolute bottom-8 text-center text-gray-500 text-sm">
        <p>Desenvolvido por NVM Project Management</p>
      </div>
    </div>
  );
}
