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
  trainerClients?: string[];
  nutritionistClients?: string[];
  linkedTrainerId?: string;
  linkedNutritionistId?: string;
  isAdmin: boolean;
  favorites: string[];
  theme: 'light' | 'dark' | 'system';
  setProfile: (profile: Partial<UserProfile>) => void;
  setPlan: (plan: WorkoutPlan) => void;
  upgradePlan: (plan: PlanType) => void;
  startTrial: () => void;
  updateExerciseWeight: (dayIndex: number, exerciseIndex: number, weight: string) => void;
  toggleFavorite: (exerciseId: string) => void;
  toggleTheme: () => void;
  updatePlanForUser: (targetUid: string, newPlan: WorkoutPlan) => Promise<void>;
  linkClient: (email: string) => Promise<{ success: boolean; message: string }>;
  linkNutritionist: (email: string) => Promise<{ success: boolean; message: string }>;
  setRole: (role: UserRole) => void;
  setRoleForUser: (targetUid: string, newRole: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  calculateIMC: () => { value: string; category: string } | null;
  resetAccount: () => Promise<void>;
  addExerciseProgress: (exerciseName: string, weight: number, reps: number) => Promise<void>;
  getExerciseProgress: (exerciseName: string) => Promise<import('../types').ExerciseProgress[]>;
  toggleMealCheck: (mealIndex: number) => Promise<void>;
  updateRealMealNotes: (mealIndex: number, notes: string) => Promise<void>;
  toggleWorkoutDayCheck: (dayIndex: number) => Promise<{ success: boolean; isThirdDay?: boolean; totalDays?: number } | void>;
  updateRealWorkoutNotes: (dayIndex: number, notes: string) => Promise<void>;
  addWorkoutReport: (dayIndex: number, text: string) => Promise<void>;
  updateWorkoutReport: (dayIndex: number, reportId: string, text: string) => Promise<void>;
  deleteWorkoutReport: (dayIndex: number, reportId: string) => Promise<void>;
  doCheckIn: () => Promise<{ success: boolean; isThirdDay?: boolean; totalDays?: number } | void>;
  setPlanTypeForUser: (targetUid: string, newPlanType: PlanType) => Promise<{ success: boolean; message: string }>;
}

const UserContext = createContext<UserState | undefined>(undefined);

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
  const [trainerClients, setTrainerClients] = useState<string[]>([]);
  const [nutritionistClients, setNutritionistClients] = useState<string[]>([]);
  const [linkedTrainerId, setLinkedTrainerId] = useState<string | undefined>();
  const [linkedNutritionistId, setLinkedNutritionistId] = useState<string | undefined>();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    if (user?.email) {
      user.getIdToken().then(token => {
        fetch(`/api/auth/admin-check?email=${encodeURIComponent(user.email!)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(r => r.json())
          .then(data => {
            setIsAdmin(data.isAdmin);
            if (data.isAdmin) {
              setRoleState('admin' as UserRole);
              setPlanType('PROFISSIONAL');
            }
          })
          .catch(() => setIsAdmin(false));
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const checkRedirect = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          setUser(redirectResult.user);
        }
      } catch (redirectError) {
        console.error("UserStore redirect error:", redirectError);
      }
    };

    checkRedirect();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser || auth.currentUser) {
        const loggedUser = currentUser || auth.currentUser;

        // Optimistic Load from Cache
        let hasCache = false;
        try {
          const cachedProfile = localStorage.getItem(`fitai_profile_${loggedUser.uid}`);
          const cachedPlan = localStorage.getItem(`fitai_plan_${loggedUser.uid}`);
          
          if (cachedProfile) {
            setProfileState(JSON.parse(cachedProfile));
            hasCache = true;
          }
          if (cachedPlan) {
            setPlanState(JSON.parse(cachedPlan));
            hasCache = true;
          }
        } catch (e) {
          console.warn("Cached data corrupted:", e);
        }

        const docRef = doc(db, 'users', loggedUser!.uid);
        
        // Update online status
        updateDoc(docRef, { 
          onlineStatus: 'online',
          lastSeen: new Date().toISOString()
        }).catch(err => console.error("Error updating online status:", err));

        const statusInterval = setInterval(() => {
          updateDoc(docRef, { 
            lastSeen: new Date().toISOString()
          }).catch(() => {});
        }, 60000); // Pulse every 60s

        let snapshotReceived = false;

        // Setup snapshot listener immediately (non-blocking)
        import('firebase/firestore').then(({ onSnapshot }) => {
          unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            const isFirstLoad = !snapshotReceived;
            snapshotReceived = true;

            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // SYNC AUTH DATA: Ensure name and photo are in Firestore for ranking
              const authUpdates: any = {};
              if (!data.displayName && loggedUser.displayName) authUpdates.displayName = loggedUser.displayName;
              if (!data.photoURL && loggedUser.photoURL) authUpdates.photoURL = loggedUser.photoURL;
              if (!data.email && loggedUser.email) authUpdates.email = loggedUser.email;
              
              if (Object.keys(authUpdates).length > 0) {
                updateDoc(docRef, authUpdates).catch(() => {});
              }

              // Merge root data with profile sub-object for consistency
              const mergedProfile = { ...data, ...(data.profile || {}) };
              setProfileState(mergedProfile as UserProfile);
              localStorage.setItem(`fitai_profile_${loggedUser.uid}`, JSON.stringify(mergedProfile));

              if (data.plan) {
                setPlanState(data.plan);
                localStorage.setItem(`fitai_plan_${loggedUser.uid}`, JSON.stringify(data.plan));
              } else {
                setPlanState(null);
                localStorage.removeItem(`fitai_plan_${loggedUser.uid}`);
              }
              if (data.role) setRoleState(data.role as UserRole);

              // Admin Auto-Fix: Ensure admin appears in ranking if not explicitly false
              if ((data.role === 'admin' || data.email === 'vinidoctor@gmail.com') && data.showInRanking === undefined) {
                updateDoc(docRef, { showInRanking: true });
              }

              if (data.clients) setClients(data.clients);
              if (data.trainerClients) setTrainerClients(data.trainerClients);
              if (data.nutritionistClients) setNutritionistClients(data.nutritionistClients);

              // Migration logic for existing clients
              if (data.clients && data.clients.length > 0) {
                if (data.role === 'trainer' && (!data.trainerClients || data.trainerClients.length === 0)) {
                  updateDoc(doc(db, 'users', user.uid), { trainerClients: data.clients });
                }
                if (data.role === 'nutritionist' && (!data.nutritionistClients || data.nutritionistClients.length === 0)) {
                  updateDoc(doc(db, 'users', user.uid), { nutritionistClients: data.clients });
                }
              }
              if (data.linkedTrainerId) setLinkedTrainerId(data.linkedTrainerId);
              if (data.linkedNutritionistId) setLinkedNutritionistId(data.linkedNutritionistId);
              if (data.favorites) setFavorites(data.favorites);
              if (data.theme) {
                setThemeState(data.theme);
                document.documentElement.classList.toggle('dark', data.theme === 'dark');
              }
              
              if (data.planType) {
                setPlanType(data.planType as PlanType);
              } else if (isAdmin) {
                setPlanType('PROFISSIONAL');
              } else {
                setPlanType('FREE');
              }
              if (data.trialEndsAt) setTrialEndsAt(data.trialEndsAt);
              if (data.subscriptionEndsAt) setSubscriptionEndsAt(data.subscriptionEndsAt);
            }

            // If it's the first time we get data from server, ensure loader is gone
            if (isFirstLoad) {
              setAuthLoading(false);
            }
          }, (error) => {
            console.error("Firestore snapshot error:", error);
            setAuthLoading(false); // Safety fallback
          });
        });

        // If we have cache, we don't need to wait for snapshot to show the app
        if (hasCache) {
          setAuthLoading(false);
        } else {
          // Safety timeout: if no cache and no snapshot in 3s, just show onboarding
          setTimeout(() => {
            if (!snapshotReceived) {
              setAuthLoading(false);
            }
          }, 3000);
        }

        // Run heavy migration/init stuff in the background
        (async () => {
          try {
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              const initialData: any = {
                uid: loggedUser.uid,
                email: loggedUser.email,
                role: 'user',
                planType: isAdmin ? 'PROFISSIONAL' : 'FREE',
                createdAt: new Date().toISOString()
              };

              // Check for pending guest payment
              try {
                const pendingRef = doc(db, 'users', `pending_${loggedUser.email}`);
                const pendingSnap = await getDoc(pendingRef);
                if (pendingSnap.exists()) {
                  const pendingData = pendingSnap.data();
                  console.log("Merging pending guest payment for:", loggedUser.email);
                  initialData.planType = pendingData.planType;
                  initialData.role = pendingData.role;
                  initialData.isPremium = pendingData.isPremium;
                  initialData.stripeSubscriptionId = pendingData.stripeSubscriptionId;
                  initialData.subscriptionEndsAt = pendingData.subscriptionEndsAt;
                  
                  // Delete placeholder after migration
                  import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(pendingRef));
                }
              } catch (pendingErr) {
                console.error("Error checking pending payment:", pendingErr);
              }

              await setDoc(docRef, initialData);
            } else if (!docSnap.data()?.profile && !isAdmin) {
              // Migration check
              const localProfile = localStorage.getItem('fitai_profile');
              const localPlan = localStorage.getItem('fitai_plan');
              if (localProfile && localPlan) {
                const migrationData = {
                  profile: JSON.parse(localProfile),
                  plan: JSON.parse(localPlan),
                  planType: isAdmin ? 'PROFISSIONAL' : (localStorage.getItem('fitai_plan_type') || 'FREE'),
                  trialEndsAt: localStorage.getItem('fitai_trial_ends') || null
                };
                await setDoc(docRef, migrationData, { merge: true });
                ['fitai_profile', 'fitai_plan', 'fitai_plan_type', 'fitai_trial_ends'].forEach(k => localStorage.removeItem(k));
              }
            }
          } catch (error) {
            console.error("Background initialization error:", error);
          }
        })();

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
        setAuthLoading(false);
      }
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

  const updateDocumentTheme = (themeValue: 'light' | 'dark' | 'system') => {
    if (themeValue === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', themeValue === 'dark');
    }
  };

  useEffect(() => {
    updateDocumentTheme(theme);
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setProfile = (newProfile: Partial<UserProfile>) => {
    setProfileState(prev => prev ? { ...prev, ...newProfile } : newProfile as UserProfile);
    saveToFirestore({ profile: newProfile });
    
    if (newProfile.theme) {
      setThemeState(newProfile.theme);
      updateDocumentTheme(newProfile.theme);
    }
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

  const toggleFavorite = (exerciseId: string) => {
    const newFavorites = favorites.includes(exerciseId)
      ? favorites.filter(id => id !== exerciseId)
      : [...favorites, exerciseId];
    
    setFavorites(newFavorites);
    setProfile({ favorites: newFavorites });
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    
    setThemeState(newTheme);
    updateDocumentTheme(newTheme);
    setProfile({ theme: newTheme });
  };

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

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
        clients: arrayUnion(clientUid),
        trainerClients: arrayUnion(clientUid)
      });

      // Update client's trainer link
      await updateDoc(clientDoc.ref, {
        linkedTrainerId: user!.uid,
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
        clients: arrayUnion(clientUid),
        nutritionistClients: arrayUnion(clientUid)
      });

      // Update client's nutritionist link
      await updateDoc(clientDoc.ref, {
        linkedNutritionistId: user!.uid,
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

  const setPlanTypeForUser = async (targetUid: string, newPlanType: PlanType) => {
    if (!isAdmin) return { success: false, message: "Apenas administradores podem fazer isso" };
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, { 
        planType: newPlanType,
        subscriptionEndsAt: newPlanType !== 'FREE' ? Date.now() + (30 * 24 * 60 * 60 * 1000) : null 
      });
      return { success: true, message: `Plano atualizado para ${newPlanType}` };
    } catch (error) {
      console.error("Set plan type error:", error);
      return { success: false, message: "Erro ao atualizar plano" };
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
    if (!window.confirm("LGPD - DIREITO AO ESQUECIMENTO: Tem certeza que deseja APAGAR permanentemente todos os seus dados? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', user.uid);
      await deleteDoc(docRef);
      
      // Clear cache
      localStorage.removeItem(`fitai_profile_${user.uid}`);
      localStorage.removeItem(`fitai_plan_${user.uid}`);
      ['fitai_profile', 'fitai_plan', 'fitai_plan_type', 'fitai_trial_ends', 'fitai_lgpd_consent'].forEach(k => localStorage.removeItem(k));
      
      await auth.signOut();
    } catch (error) {
      console.error("Error deleting account data:", error);
      alert("Erro ao apagar dados. Tente novamente.");
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

  const addExerciseProgress = async (exerciseName: string, weight: number, reps: number) => {
    if (!user) return;
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const progressRef = collection(db, 'exercise_progress');
      await addDoc(progressRef, {
        userId: user.uid,
        exerciseName,
        weight,
        reps,
        date: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding exercise progress:", error);
    }
  };

  const getExerciseProgress = async (exerciseName: string) => {
    if (!user) return [];
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const progressRef = collection(db, 'exercise_progress');
      
      // Optimized query: multiple WHERE clauses are easier for Firestore to handle without composite indexes
      // if sorting is handled in-memory on the client side.
      const q = query(
        progressRef, 
        where('userId', '==', user.uid),
        where('exerciseName', '==', exerciseName)
      );
      
      const snap = await getDocs(q);
      const progressData = snap.docs.map(d => ({ id: d.id, ...d.data() } as import('../types').ExerciseProgress));
      
      // Client-side sort by date ASC
      return progressData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error("Error getting exercise progress:", error);
      return [];
    }
  };

  const toggleMealCheck = async (mealIndex: number) => {
    if (!plan || !plan.diet) return;
    const newPlan = { ...plan };
    const meal = newPlan.diet.meals[mealIndex];
    meal.isAdhered = !meal.isAdhered;
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const updateRealMealNotes = async (mealIndex: number, notes: string) => {
    if (!plan || !plan.diet) return;
    const newPlan = { ...plan };
    newPlan.diet.meals[mealIndex].realMealNotes = notes;
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const toggleWorkoutDayCheck = async (dayIndex: number) => {
    if (!plan || !user || !profile) return;
    const newPlan = { ...plan };
    const day = newPlan.days[dayIndex];
    const wasCompleted = day.isCompleted;
    day.isCompleted = !wasCompleted;
    
    setPlanState(newPlan);
    
    // Save plan state immediately
    await saveToFirestore({ plan: newPlan });

    // Gamification Sync
    if (!wasCompleted) {
      // Trigger the daily check-in logic if not already done
      return await doCheckIn();
    }
  };

  const updateRealWorkoutNotes = async (dayIndex: number, notes: string) => {
    if (!plan) return;
    const newPlan = { ...plan };
    newPlan.days[dayIndex].realWorkoutNotes = notes;
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const addWorkoutReport = async (dayIndex: number, text: string) => {
    if (!plan || !text.trim()) return;
    const newPlan = { ...plan };
    const day = newPlan.days[dayIndex];
    if (!day.workoutReports) day.workoutReports = [];
    
    day.workoutReports.push({
      id: Math.random().toString(36).substr(2, 9),
      text,
      date: new Date().toISOString()
    });
    
    // Also clear the current temporary note
    day.realWorkoutNotes = '';
    
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const updateWorkoutReport = async (dayIndex: number, reportId: string, text: string) => {
    if (!plan) return;
    const newPlan = { ...plan };
    const day = newPlan.days[dayIndex];
    if (!day.workoutReports) return;

    const reportIdx = day.workoutReports.findIndex(r => r.id === reportId);
    if (reportIdx > -1) {
      day.workoutReports[reportIdx].text = text;
      setPlanState(newPlan);
      await saveToFirestore({ plan: newPlan });
    }
  };

  const deleteWorkoutReport = async (dayIndex: number, reportId: string) => {
    if (!plan) return;
    const newPlan = { ...plan };
    const day = newPlan.days[dayIndex];
    if (!day.workoutReports) return;

    day.workoutReports = day.workoutReports.filter(r => r.id !== reportId);
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const doCheckIn = async () => {
    if (!profile || !user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const checkInDates = profile.checkInDates || [];
    const isAlreadyCheckedIn = checkInDates.includes(today);
    
    // If already checked in today AND streak is already set, just return current stats for UI
    if (isAlreadyCheckedIn && (profile.streak || 0) > 0) {
      const daysThisWeek = checkInDates.filter(d => {
        const dDate = new Date(d);
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        return dDate >= startOfWeek;
      }).length;

      return { 
        success: true, 
        isThirdDay: false, // Don't re-celebrate
        totalDays: profile.streak || 0
      };
    }

    const newCheckInDates = isAlreadyCheckedIn ? checkInDates : [...checkInDates, today];
    const newPoints = isAlreadyCheckedIn ? (profile.points || 0) : (profile.points || 0) + 50; 
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    // Streak logic (daily consecutive)
    let newStreak = profile.streak || 0;
    
    // Find the date before today in our list (excluding today if it's already there)
    const previousDates = checkInDates.filter(d => d !== today);
    
    if (previousDates.length > 0) {
      const lastCheckInStr = previousDates[previousDates.length - 1];
      const lastDate = new Date(lastCheckInStr + 'T12:00:00');
      const todayDate = new Date(today + 'T12:00:00');
      
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Continuous streak
        newStreak = (newStreak || 1) + (isAlreadyCheckedIn ? 0 : 1);
        if (newStreak === 0) newStreak = 1; // Fallback
      } else {
        // Streak broken or just starting
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updates = {
      points: newPoints,
      level: newLevel,
      checkInDates: newCheckInDates,
      streak: newStreak,
      updatedAt: new Date().toISOString()
    };

    setProfileState(prev => prev ? { ...prev, ...updates } : null);
    await saveToFirestore(updates);
    
    // Celebration triggers
    const daysThisWeek = newCheckInDates.filter(d => {
      const dDate = new Date(d);
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      return dDate >= startOfWeek;
    }).length;

    return { 
      success: true, 
      isThirdDay: daysThisWeek % 3 === 0 && daysThisWeek > 0 && !isAlreadyCheckedIn,
      totalDays: newStreak
    };
  };

  return (
    <UserContext.Provider value={{ 
      user, authLoading, profile, plan, planType, trialEndsAt, subscriptionEndsAt, role, 
      clients, trainerClients, nutritionistClients,
      linkedTrainerId, linkedNutritionistId, isAdmin,
      favorites, theme,
      setProfile, setPlan, upgradePlan, startTrial, updateExerciseWeight, updatePlanForUser, 
      toggleFavorite, toggleTheme,
      linkClient, linkNutritionist, setRole, setRoleForUser, setPlanTypeForUser, logout, calculateIMC, resetAccount,
      addExerciseProgress, getExerciseProgress,
      toggleMealCheck, updateRealMealNotes, toggleWorkoutDayCheck, updateRealWorkoutNotes,
      addWorkoutReport, updateWorkoutReport, deleteWorkoutReport, doCheckIn
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
