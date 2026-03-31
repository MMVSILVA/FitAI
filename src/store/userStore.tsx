import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AIResponse } from '../services/aiService';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  plan: AIResponse | null;
  planType: 'FREE' | 'PRO' | 'PREMIUM';
  trialEndsAt: string | null;
  setProfile: (profile: UserProfile) => void;
  setPlan: (plan: AIResponse) => void;
  upgradePlan: (plan: 'PRO' | 'PREMIUM') => void;
  startTrial: () => void;
  logout: () => void;
  calculateIMC: () => { value: string; category: string } | null;
}

const UserContext = createContext<UserState | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [profile, setProfileState] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fitai_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [plan, setPlanState] = useState<AIResponse | null>(() => {
    const saved = localStorage.getItem('fitai_plan');
    return saved ? JSON.parse(saved) : null;
  });

  const [planType, setPlanType] = useState<'FREE' | 'PRO' | 'PREMIUM'>(() => {
    return (localStorage.getItem('fitai_plan_type') as any) || 'FREE';
  });

  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(() => {
    return localStorage.getItem('fitai_trial_ends');
  });

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    localStorage.setItem('fitai_profile', JSON.stringify(newProfile));
  };

  const setPlan = (newPlan: AIResponse) => {
    setPlanState(newPlan);
    localStorage.setItem('fitai_plan', JSON.stringify(newPlan));
  };

  const upgradePlan = (newPlan: 'PRO' | 'PREMIUM') => {
    setPlanType(newPlan);
    localStorage.setItem('fitai_plan_type', newPlan);
  };

  const startTrial = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const dateString = endDate.toISOString();
    setTrialEndsAt(dateString);
    localStorage.setItem('fitai_trial_ends', dateString);
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

  const logout = () => {
    setProfileState(null);
    setPlanState(null);
    setPlanType('FREE');
    setTrialEndsAt(null);
    localStorage.removeItem('fitai_profile');
    localStorage.removeItem('fitai_plan');
    localStorage.removeItem('fitai_plan_type');
    localStorage.removeItem('fitai_trial_ends');
  };

  return (
    <UserContext.Provider value={{ user, profile, plan, planType, trialEndsAt, setProfile, setPlan, upgradePlan, startTrial, logout, calculateIMC }}>
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
