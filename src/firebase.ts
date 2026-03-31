import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ATENÇÃO: Substitua estas credenciais pelas do seu projeto Firebase!
// Você encontra isso em: https://console.firebase.google.com/
// Configurações do Projeto > Geral > Seus aplicativos
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuNd4Itb3XsuI8727w6otzmtbnoVpLiCw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fitai-1234.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fitai-1234",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fitai-1234.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "124229624628",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:124229624628:web:b1eba90590f868382e7b61"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro no login com Google:", error);
    throw error;
  }
};

export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
};
