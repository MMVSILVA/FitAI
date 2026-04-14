import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AIResponse } from '../services/aiService';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface UserState {
  user: User | null;
  authLoading: boolean;
  profile: UserProfile | null;
  plan: AIResponse | null;
  planType: 'FREE' | 'PRO' | 'PREMIUM';
  trialEndsAt: string | null;
  setProfile: (profile: UserProfile) => void;
  setPlan: (plan: AIResponse) => void;
  upgradePlan: (plan: 'PRO' | 'PREMIUM') => void;
  startTrial: () => void;
  updateExerciseWeight: (dayIndex: number, exerciseIndex: number, weight: string) => void;
  logout: () => void;
  calculateIMC: () => { value: string; category: string } | null;
  resetAccount: () => Promise<void>;
}

const UserContext = createContext<UserState | undefined>(undefined);

const ADMIN_EMAILS = [
  'vinidoctor@gmail.com',
  'nangelicaalcantara@gmail.com'
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [plan, setPlanState] = useState<AIResponse | null>(null);
  const [planType, setPlanType] = useState<'FREE' | 'PRO' | 'PREMIUM'>('FREE');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isAdmin = currentUser.email ? ADMIN_EMAILS.includes(currentUser.email) : false;
        const docRef = doc(db, 'users', currentUser.uid);
        
        // Initial migration check
        try {
          const docSnap = await getDoc(docRef);
          let firestoreData = docSnap.exists() ? docSnap.data() : null;
          
          if (!firestoreData?.profile) {
            const localProfile = localStorage.getItem('fitai_profile');
            const localPlan = localStorage.getItem('fitai_plan');
            const localPlanType = localStorage.getItem('fitai_plan_type');
            const localTrialEnds = localStorage.getItem('fitai_trial_ends');
            
            if (localProfile && localPlan) {
              const migrationData = {
                profile: JSON.parse(localProfile),
                plan: JSON.parse(localPlan),
                planType: isAdmin ? 'PREMIUM' : (localPlanType || 'FREE'),
                trialEndsAt: localTrialEnds || null
              };
              
              await setDoc(docRef, migrationData, { merge: true });
              
              localStorage.removeItem('fitai_profile');
              localStorage.removeItem('fitai_plan');
              localStorage.removeItem('fitai_plan_type');
              localStorage.removeItem('fitai_trial_ends');
            }
          }
        } catch (error) {
          console.error("Error during migration check:", error);
        }

        // Listen for real-time updates (important for Stripe webhooks)
        import('firebase/firestore').then(({ onSnapshot }) => {
          unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.profile) setProfileState(data.profile);
              if (data.plan) setPlanState(data.plan);
              
              if (isAdmin) {
                setPlanType('PREMIUM');
              } else if (data.planType) {
                setPlanType(data.planType);
              } else {
                setPlanType('FREE');
              }
              
              if (data.trialEndsAt) setTrialEndsAt(data.trialEndsAt);
            } else {
              setProfileState(null);
              setPlanState(null);
              setPlanType(isAdmin ? 'PREMIUM' : 'FREE');
              setTrialEndsAt(null);
            }
          }, (error) => {
            console.error("Firestore snapshot error:", error);
          });
        });

      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setProfileState(null);
        setPlanState(null);
        setPlanType('FREE');
        setTrialEndsAt(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const saveToFirestore = async (data: any) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    }
  };

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    saveToFirestore({ profile: newProfile });
  };

  const setPlan = (newPlan: AIResponse) => {
    setPlanState(newPlan);
    saveToFirestore({ plan: newPlan });
  };

  const upgradePlan = (newPlan: 'PRO' | 'PREMIUM') => {
    setPlanType(newPlan);
    saveToFirestore({ planType: newPlan });
  };

  const startTrial = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const dateString = endDate.toISOString();
    setTrialEndsAt(dateString);
    setPlanType('FREE'); // Ensure it starts as FREE
    saveToFirestore({ trialEndsAt: dateString, planType: 'FREE' });
  };

  const updateExerciseWeight = (dayIndex: number, exerciseIndex: number, weight: string) => {
    if (!plan) return;
    
    const newPlan = { ...plan };
    newPlan.workout.days[dayIndex].exercises[exerciseIndex].weight = weight;
    
    setPlanState(newPlan);
    saveToFirestore({ plan: newPlan });
  };

  const calculateIMC = () => {
    if (!profile) return null;
    const heightInMeters = profile.height > 3 ? profile.height / 100 : profile.height;
    const imc = profile.weight / (heightInMeters * heightInMeters);
    let category = '';
    if (imc < 18.5) category = 'Abaixo do peso';
    else if (imc < 24.9) category = 'Peso normal';
    else if (imc < 29.9) category = 'Sobrepeso';
    else category = 'Obesidade';
    
    return { value: imc.toFixed(2).replace('.', ','), category };
  };

  const resetAccount = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        profile: null,
        plan: null,
        planType: 'FREE',
        trialEndsAt: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setProfileState(null);
      setPlanState(null);
      setPlanType('FREE');
      setTrialEndsAt(null);
      
      localStorage.removeItem('fitai_profile');
      localStorage.removeItem('fitai_plan');
      localStorage.removeItem('fitai_plan_type');
      localStorage.removeItem('fitai_trial_ends');
    } catch (error) {
      console.error("Error resetting account:", error);
    }
  };

  const logout = () => {
    setProfileState(null);
    setPlanState(null);
    setPlanType('FREE');
    setTrialEndsAt(null);
  };

  return (
    <UserContext.Provider value={{ user, authLoading, profile, plan, planType, trialEndsAt, setProfile, setPlan, upgradePlan, startTrial, updateExerciseWeight, logout, calculateIMC, resetAccount }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
