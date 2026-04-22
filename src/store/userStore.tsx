import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { UserProfile, WorkoutPlan, UserRole, PlanType } from '../types';

interface UserState {
  user: User | null;
  authLoading: boolean;
  profile: UserProfile | null;
  plan: WorkoutPlan | null;
  planType: PlanType;
  role: UserRole;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  clients?: string[];
  linkedTrainerId?: string;
  linkedNutritionistId?: string;
  isAdmin: boolean;
  setProfile: (profile: Partial<UserProfile>) => void;
  setPlan: (plan: WorkoutPlan) => void;
  upgradePlan: (plan: PlanType) => void;
  startTrial: () => void;
  updateExerciseWeight: (dayIndex: number, exerciseIndex: number, weight: string) => void;
  updatePlanForUser: (targetUid: string, newPlan: WorkoutPlan) => Promise<void>;
  linkClient: (email: string) => Promise<{ success: boolean; message: string }>;
  linkNutritionist: (email: string) => Promise<{ success: boolean; message: string }>;
  setRole: (role: UserRole) => void;
  setRoleForUser: (targetUid: string, newRole: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  calculateIMC: () => { value: string; category: string } | null;
  resetAccount: () => Promise<void>;
}

const UserContext = createContext<UserState | undefined>(undefined);

const ADMIN_EMAILS = [
  'vinidoctor@gmail.com',
  'vinisilva02@hotmail.com',
  'nangelicaalcantara@gmail.com'
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [plan, setPlanState] = useState<WorkoutPlan | null>(null);
  const [planType, setPlanType] = useState<PlanType>('FREE');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [role, setRoleState] = useState<UserRole>('user');
  const [clients, setClients] = useState<string[]>([]);
  const [linkedTrainerId, setLinkedTrainerId] = useState<string | undefined>();
  const [linkedNutritionistId, setLinkedNutritionistId] = useState<string | undefined>();

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isAdmin = currentUser.email ? ADMIN_EMAILS.includes(currentUser.email) : false;
        const docRef = doc(db, 'users', currentUser.uid);
        
        // Initial migration check
        try {
          // Validate Connection to Firestore (Test on their own ref)
          try {
            await getDocFromServer(docRef);
          } catch (connError: any) {
            if (connError.message?.includes('the client is offline') || connError.code === 'unavailable') {
              console.warn("Firestore está offline ou o banco '(default)' não foi criado: ", connError.message);
            }
          }

          const docSnap = await getDoc(docRef);
          let firestoreData = docSnap.exists() ? docSnap.data() : null;
          
          if (!docSnap.exists()) {
            // New user initialization
            const initialData = {
              uid: currentUser.uid,
              email: currentUser.email,
              role: 'USER',
              planType: isAdmin ? 'PREMIUM' : 'FREE',
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, initialData);
          }

          if (!firestoreData?.profile && !isAdmin) {
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
              if (data.role) setRoleState(data.role as UserRole);
              if (data.clients) setClients(data.clients);
              if (data.linkedTrainerId) setLinkedTrainerId(data.linkedTrainerId);
              if (data.linkedNutritionistId) setLinkedNutritionistId(data.linkedNutritionistId);
              
              if (isAdmin) {
                setPlanType('PREMIUM');
              } else if (data.planType) {
                setPlanType(data.planType as PlanType);
              } else {
                setPlanType('FREE');
              }
              if (data.trialEndsAt) setTrialEndsAt(data.trialEndsAt);
              if (data.subscriptionEndsAt) setSubscriptionEndsAt(data.subscriptionEndsAt);
            } else {
              setProfileState(null);
              setPlanState(null);
              setRoleState('user');
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
        setRoleState('user');
        setPlanType('FREE');
        setTrialEndsAt(null);
        setClients([]);
        setLinkedTrainerId(undefined);
        setLinkedNutritionistId(undefined);
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

  const setProfile = (newProfile: Partial<UserProfile>) => {
    setProfileState(prev => prev ? { ...prev, ...newProfile } : newProfile as UserProfile);
    saveToFirestore({ profile: newProfile });
  };

  const setPlan = (newPlan: WorkoutPlan) => {
    setPlanState(newPlan);
    saveToFirestore({ plan: newPlan });
  };

  const upgradePlan = (newPlan: PlanType) => {
    setPlanType(newPlan);
    saveToFirestore({ planType: newPlan });
  };

  const startTrial = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const dateString = endDate.toISOString();
    setTrialEndsAt(dateString);
    saveToFirestore({ trialEndsAt: dateString });
  };

  const updateExerciseWeight = (dayIndex: number, exerciseIndex: number, weight: string) => {
    if (!plan) return;
    
    const newPlan = { ...plan };
    newPlan.days[dayIndex].exercises[exerciseIndex].weight = weight;
    
    setPlanState(newPlan);
    saveToFirestore({ plan: newPlan });
  };

  const updatePlanForUser = async (targetUid: string, newPlan: WorkoutPlan) => {
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, { plan: newPlan });
    } catch (error) {
      console.error("Error updating user plan:", error);
    }
  };

  const linkClient = async (email: string) => {
    const trimmedEmail = email.toLowerCase().trim();
    if (trimmedEmail === user?.email) {
      return { success: false, message: "Você não pode se auto-vincular" };
    }

    try {
      const { collection, query, where, getDocs, updateDoc, arrayUnion } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', trimmedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "Usuário não encontrado" };
      }

      const clientDoc = querySnapshot.docs[0];
      const clientUid = clientDoc.id;

      // Update trainer's client list
      const trainerRef = doc(db, 'users', user!.uid);
      await updateDoc(trainerRef, {
        clients: arrayUnion(clientUid)
      });

      // Update client's trainer link
      await updateDoc(clientDoc.ref, {
        trainerId: user!.uid
      });

      return { success: true, message: `Aluno ${trimmedEmail} vinculado com sucesso!` };
    } catch (error) {
      console.error("Link client error:", error);
      return { success: false, message: "Erro ao vincular aluno" };
    }
  };

  const linkNutritionist = async (email: string) => {
    const trimmedEmail = email.toLowerCase().trim();
    if (trimmedEmail === user?.email) {
      return { success: false, message: "Você não pode se auto-vincular" };
    }

    try {
      const { collection, query, where, getDocs, updateDoc, arrayUnion } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', trimmedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "Usuário não encontrado" };
      }

      const clientDoc = querySnapshot.docs[0];
      const clientUid = clientDoc.id;

      // Update current user's (nutritionist) client list
      const nutritionistRef = doc(db, 'users', user!.uid);
      await updateDoc(nutritionistRef, {
        clients: arrayUnion(clientUid)
      });

      // Update client's nutritionist link
      await updateDoc(clientDoc.ref, {
        nutritionistId: user!.uid
      });

      return { success: true, message: `Paciente ${trimmedEmail} vinculado com sucesso!` };
    } catch (error) {
      console.error("Link nutritionist error:", error);
      return { success: false, message: "Erro ao vincular paciente" };
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    saveToFirestore({ role: newRole });
  };

  const setRoleForUser = async (targetUid: string, newRole: UserRole) => {
    if (!isAdmin) return { success: false, message: "Apenas administradores podem fazer isso" };
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, { role: newRole });
      return { success: true, message: `Role atualizado para ${newRole}` };
    } catch (error) {
      console.error("Set role error:", error);
      return { success: false, message: "Erro ao atualizar role" };
    }
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
    setRoleState('user');
    setClients([]);
    setLinkedTrainerId(undefined);
    setLinkedNutritionistId(undefined);
  };

  return (
    <UserContext.Provider value={{ 
      user, authLoading, profile, plan, planType, trialEndsAt, subscriptionEndsAt, role, clients, linkedTrainerId, linkedNutritionistId, isAdmin,
      setProfile, setPlan, upgradePlan, startTrial, updateExerciseWeight, updatePlanForUser, 
      linkClient, linkNutritionist, setRole, setRoleForUser, logout, calculateIMC, resetAccount 
    }}>
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
