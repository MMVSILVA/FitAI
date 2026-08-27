import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updatePlanForUser: (targetUid: string, newPlan: WorkoutPlan) => Promise<void>;
  linkClient: (email: string) => Promise<{ success: boolean; message: string }>;
  linkNutritionist: (email: string) => Promise<{ success: boolean; message: string }>;
  setRole: (role: UserRole) => void;
  setRoleForUser: (targetUid: string, newRole: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  calculateIMC: () => { value: string; category: string } | null;
  resetAccount: () => Promise<void>;
  resetSimulation: () => Promise<{ success: boolean; message: string }>;
  saveWorkoutSession: (session: { exerciseName?: string; durationSeconds: number; mode: 'countdown' | 'stopwatch'; laps?: number[]; isPartial?: boolean; notes?: string }) => Promise<{ success: boolean; message: string }>;
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
  addExerciseToDay: (dayIndex: number, exercise: { 
    name: string; 
    series: string; 
    reps: string; 
    weight: string; 
    rest: string;
    tips?: string;
    breathing?: string;
    cadence?: string;
    technicalDescription?: string;
  }) => Promise<void>;
  removeExerciseFromDay: (dayIndex: number, exerciseIndex: number) => Promise<void>;
  addWorkoutDay: (dayData: { day: string; focus: string; exercises: any[] }) => Promise<void>;
  removeWorkoutDay: (dayIndex: number) => Promise<void>;
  updateWorkoutDay: (dayIndex: number, dayData: { day?: string; focus?: string }) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  leaveChallenge: (challengeId: string) => Promise<void>;
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
      const isMasterAdmin = user.email === 'vinidoctor@gmail.com';
      if (isMasterAdmin) {
        setIsAdmin(true);
      }

      user.getIdToken().then(token => {
        fetch(`/api/auth/admin-check?email=${encodeURIComponent(user.email!)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(r => r.json())
          .then(data => {
            if (data.isAdmin) {
              setIsAdmin(true);
            } else if (!isMasterAdmin) {
              setIsAdmin(false);
            }
          })
          .catch(() => {
            if (!isMasterAdmin) setIsAdmin(false);
          });
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    // Gentle probe to warm up Firestore connection
    const testConnection = async () => {
      try {
        await getDoc(doc(db, 'test', 'connection'));
      } catch (error: any) {
        // Suppress initial offline/unavailable warnings during startup probe
        if (error?.code !== 'unavailable' && !error?.message?.includes('offline')) {
          console.log("Firestore connection probe note:", error?.code || error?.message);
        }
      }
    };
    testConnection();

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
        
        let snapshotReceived = false;
        let isFirstUpdate = true;

        // Restore fast loading if we have cache
        if (hasCache) {
          setAuthLoading(false);
        }

        // Setup snapshot listener
        import('firebase/firestore').then(({ onSnapshot }) => {
          unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            snapshotReceived = true;

            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // Sync auth metadata to Firestore
              const authUpdates: any = {};
              if (!data.displayName && loggedUser.displayName) authUpdates.displayName = loggedUser.displayName;
              if (!data.photoURL && loggedUser.photoURL) authUpdates.photoURL = loggedUser.photoURL;
              if (!data.email && loggedUser.email) authUpdates.email = loggedUser.email;
              
              const isMasterAdmin = loggedUser.email === 'vinidoctor@gmail.com';
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];

              // --- RESET LOGIC ---
              // If it's a new week (specifically Monday or if last reset was > 7 days ago)
              // We reset the "completedExercises" and plan day checks
              const lastResetDate = data.lastWeeklyReset || data.createdAt || '';
              const lastReset = new Date(lastResetDate);
              
              // Check if we are in a different week or if it's Monday and we haven't reset today
              const isMonday = today.getDay() === 1;
              const diffTime = today.getTime() - lastReset.getTime();
              const diffDays = diffTime / (1000 * 60 * 60 * 24);

              if ((isMonday && lastResetDate !== todayStr) || diffDays >= 7) {
                console.log("Weekly reset triggered for:", loggedUser.email);
                authUpdates.completedExercises = [];
                authUpdates.lastWeeklyReset = todayStr;
                
                // Also reset isCompleted in the plan if it exists
                if (data.plan && data.plan.days) {
                  const updatedPlan = { ...data.plan };
                  updatedPlan.days = updatedPlan.days.map((day: any) => ({
                    ...day,
                    isCompleted: false
                  }));
                  authUpdates.plan = updatedPlan;
                }
              }

              // Apply requested check-ins and role for master user
              if (isMasterAdmin) {
                const currentCheckins = data.checkInDates || [];
                const requested = ['2026-05-04', '2026-05-05', '2026-05-07'];
                const missing = requested.filter(d => !currentCheckins.includes(d));
                if (missing.length > 0) {
                  authUpdates.checkInDates = [...currentCheckins, ...missing];
                }
                // Force role to user as requested
                if (data.role !== 'user') authUpdates.role = 'user';
              }

              if (Object.keys(authUpdates).length > 0) {
                updateDoc(docRef, authUpdates).catch(() => {});
              }

              // Merge data carefully (Root properties should take precedence in SaaS model)
              // But we also check for legacy 'profile' sub-object
              const profileData = data.profile || {};
              const mergedProfile = { 
                ...profileData, 
                ...data,
                // Ensure check-ins are normalized from multiple possible legacy fields
                checkInDates: data.checkInDates || profileData.checkInDates || data.checkins || []
              };
              
              setProfileState(mergedProfile as UserProfile);
              localStorage.setItem(`fitai_profile_${loggedUser.uid}`, JSON.stringify(mergedProfile));

              if (data.plan || profileData.plan) {
                const finalPlan = data.plan || profileData.plan;
                setPlanState(finalPlan);
                localStorage.setItem(`fitai_plan_${loggedUser.uid}`, JSON.stringify(finalPlan));
              } else {
                setPlanState(null);
                localStorage.removeItem(`fitai_plan_${loggedUser.uid}`);
              }

              const masterRole = isMasterAdmin ? 'user' : (data.role as UserRole);
              if (masterRole) {
                setRoleState(masterRole);
                if (masterRole === 'admin') setIsAdmin(true);
              } else if (isMasterAdmin) {
                setRoleState('user' as UserRole);
              }
              // If it's the master user and isAdmin is true, it means they have administrative powers but are seen as a student
              if (isMasterAdmin) setIsAdmin(true); 

              // Admin Auto-Fix: Ensure admin appears in ranking if not explicitly false
              if ((data.role === 'admin') && data.showInRanking === undefined) {
                updateDoc(docRef, { showInRanking: true }).catch(() => {});
              }

              if (data.clients) setClients(data.clients);
              if (data.trainerClients) setTrainerClients(data.trainerClients);
              if (data.nutritionistClients) setNutritionistClients(data.nutritionistClients);

              // Migration logic for existing clients (for legacy support)
              if (data.clients && data.clients.length > 0) {
                if (data.role === 'trainer' && (!data.trainerClients || data.trainerClients.length === 0)) {
                  updateDoc(docRef, { trainerClients: data.clients }).catch(() => {});
                }
                if (data.role === 'nutritionist' && (!data.nutritionistClients || data.nutritionistClients.length === 0)) {
                  updateDoc(docRef, { nutritionistClients: data.clients }).catch(() => {});
                }
              }

              if (data.linkedTrainerId) setLinkedTrainerId(data.linkedTrainerId);
              if (data.linkedNutritionistId) setLinkedNutritionistId(data.linkedNutritionistId);
              if (data.favorites) setFavorites(data.favorites);
              if (data.theme) {
                setThemeState(data.theme);
                document.documentElement.classList.toggle('dark', data.theme === 'dark');
              }
              if (data.planType) setPlanType(data.planType as PlanType);
              if (data.trialEndsAt) setTrialEndsAt(data.trialEndsAt);
              if (data.subscriptionEndsAt) setSubscriptionEndsAt(data.subscriptionEndsAt);
              
              if (isFirstUpdate) {
                setAuthLoading(false);
                isFirstUpdate = false;
              }
            } else {
              // Document doesn't exist for this UID. Let's try to search by email
              // as requested by user to ensure "puxar treino a partir do email".
              (async () => {
                try {
                  const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
                  const usersRef = collection(db, 'users');
                  
                  // Try multiple common legacy patterns
                  const emailQueries = [
                    query(usersRef, where('email', '==', loggedUser.email), limit(1)),
                    query(usersRef, where('email', '==', loggedUser.email?.toLowerCase()), limit(1))
                  ];

                  let oldData: any = null;
                  
                  // 1. Check if the doc ID is the email (legacy pattern)
                  const emailDocSnap = await getDoc(doc(db, 'users', loggedUser.email!));
                  if (emailDocSnap.exists()) {
                    oldData = emailDocSnap.data();
                  }

                  // 2. Search by email field if not found
                  if (!oldData) {
                    for (const q of emailQueries) {
                      const querySnap = await getDocs(q);
                      if (!querySnap.empty) {
                        oldData = querySnap.docs[0].data();
                        break;
                      }
                    }
                  }

                  if (oldData) {
                    console.log("Found existing profile by email. Migrating to new UID:", loggedUser.uid);
                    
                    // Duplicate the data to the new UID to ensure stable persistence
                    // Use a merge set to avoid overwriting auth sync that might have happened
                    await setDoc(docRef, {
                      ...oldData,
                      uid: loggedUser.uid,
                      email: loggedUser.email,
                      migratedAt: new Date().toISOString()
                    }, { merge: true });
                    
                    // Snapshot will trigger and set authLoading(false)
                  } else {
                    // Truly new user - let background init handle the first doc creation
                    // which will then trigger onSnapshot and setAuthLoading(false)
                  }
                } catch (err) {
                  console.error("Error searching by email fallback:", err);
                  setAuthLoading(false);
                }
              })();
            }
          }, (error) => {
            console.error("Firestore snapshot error:", error);
            if (isFirstUpdate) {
              setAuthLoading(false);
              isFirstUpdate = false;
            }
          });
        });

        // Initialize status tracking
        updateDoc(docRef, { 
          onlineStatus: 'online',
          lastSeen: new Date().toISOString()
        }).catch(() => {});

        const statusInterval = setInterval(() => {
          updateDoc(docRef, { 
            lastSeen: new Date().toISOString() 
          }).catch(() => {});
        }, 60000);

        // Safety timeout: reduced to 2.5s
        setTimeout(() => {
          if (!snapshotReceived && !hasCache) {
            console.log("Startup safety timeout reached");
            setAuthLoading(false);
          }
        }, 2500);

        // Background initialization
        (async () => {
          try {
            // Wait a small bit to allow email migration to win the race if needed
            await new Promise(resolve => setTimeout(resolve, 800));

            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              console.log("Creating new user profile doc...");
              const initialData: any = {
                uid: loggedUser.uid,
                email: loggedUser.email,
                role: 'user',
                planType: isAdmin ? 'PROFISSIONAL' : 'FREE',
                createdAt: new Date().toISOString()
              };
              
              // Pending guest logic...
              const { doc: getPendingDoc, getDoc: fetchPendingDoc, deleteDoc } = await import('firebase/firestore');
              const pendingRef = getPendingDoc(db, 'users', `pending_${loggedUser.email}`);
              const pendingSnap = await fetchPendingDoc(pendingRef);
              if (pendingSnap.exists()) {
                const pData = pendingSnap.data();
                Object.assign(initialData, pData);
                await deleteDoc(pendingRef);
              }

              await setDoc(docRef, initialData, { merge: true });
            }
          } catch (e) { console.error("BG Init error:", e); }
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

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    updateDocumentTheme(newTheme);
    setProfile({ theme: newTheme });
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    
    setTheme(newTheme);
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

  const resetSimulation = async () => {
    if (!user) return { success: false, message: 'Usuário não autenticado' };

    // Strict role: admin verification in UserProvider & Firestore
    let hasAdminRole = role === 'admin' || isAdmin;
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        if (d.role === 'admin' || d.isAdmin === true) {
          hasAdminRole = true;
        }
      }
    } catch (err) {
      console.warn("Error verifying Firestore admin role for plan reset:", err);
    }

    const isMasterAdmin = user.email === 'vinidoctor@gmail.com';
    if (!hasAdminRole && !isMasterAdmin) {
      return { 
        success: false, 
        message: 'Acesso negado: Apenas administradores com a permissão (role: admin) no Firestore podem resetar planos.' 
      };
    }

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        planType: 'FREE',
        isPremium: false,
        subscriptionEndsAt: null,
        trialEndsAt: null,
        updatedAt: new Date().toISOString()
      });
      setPlanType('FREE');
      setSubscriptionEndsAt(null);
      setTrialEndsAt(null);
      return { success: true, message: 'Simulação resetada com sucesso! Você agora está no plano FREE.' };
    } catch (error: any) {
      console.error("Error resetting simulation in Firestore:", error);
      // Update local state even if Firestore rules or offline prevents remote write
      setPlanType('FREE');
      setSubscriptionEndsAt(null);
      setTrialEndsAt(null);
      return { success: true, message: 'Simulação resetada localmente para o plano FREE.' };
    }
  };

  const saveWorkoutSession = async (session: { exerciseName?: string; durationSeconds: number; mode: 'countdown' | 'stopwatch'; laps?: number[]; isPartial?: boolean; notes?: string }) => {
    if (!user) return { success: false, message: 'Usuário não autenticado' };
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const sessionData: any = {
        userId: user.uid,
        exerciseName: session.exerciseName || 'Sessão de Treino',
        durationSeconds: Math.max(1, Math.round(session.durationSeconds)),
        mode: session.mode,
        laps: session.laps || [],
        isPartial: session.isPartial !== false,
        completedAt: new Date().toISOString(),
        notes: session.notes || ''
      };

      // 1. Record in workout_sessions Firestore collection
      const sessionsRef = collection(db, 'workout_sessions');
      await addDoc(sessionsRef, sessionData);

      // 2. Append to profile workoutSessions state & persistence
      const newSessionLog: import('../types').WorkoutSessionLog = {
        id: Math.random().toString(36).substring(2, 9),
        ...sessionData
      };

      const currentSessions = profile?.workoutSessions || [];
      const updatedSessions = [newSessionLog, ...currentSessions];
      setProfileState(prev => prev ? { ...prev, workoutSessions: updatedSessions } : prev);

      saveToFirestore({
        workoutSessions: updatedSessions
      });

      return { success: true, message: 'Sessão e dados parciais registrados com sucesso no seu histórico!' };
    } catch (error) {
      console.error("Error saving workout session:", error);
      return { success: false, message: 'Erro ao registrar sessão de treino' };
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

  const addExerciseToDay = async (dayIndex: number, exercise: { 
    name: string; 
    series: string; 
    reps: string; 
    weight: string; 
    rest: string;
    tips?: string;
    breathing?: string;
    cadence?: string;
    technicalDescription?: string;
  }) => {
    if (!plan) return;
    const newPlan = JSON.parse(JSON.stringify(plan)); // Deep clone
    if (!newPlan.days[dayIndex].exercises) newPlan.days[dayIndex].exercises = [];
    
    // Ensure numeric sets
    const sets = parseInt(exercise.series.replace(/[^\d]/g, '')) || 3;
    
    newPlan.days[dayIndex].exercises.push({
      ...exercise,
      sets,
      reps: exercise.reps
    });
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const removeExerciseFromDay = async (dayIndex: number, exerciseIndex: number) => {
    if (!plan) return;
    const newPlan = JSON.parse(JSON.stringify(plan));
    newPlan.days[dayIndex].exercises.splice(exerciseIndex, 1);
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const addWorkoutDay = async (dayData: { day: string; focus: string; exercises: any[] }) => {
    if (!plan) return;
    const newPlan = JSON.parse(JSON.stringify(plan));
    newPlan.days.push({
      ...dayData,
      isCompleted: false,
      workoutReports: []
    });
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const removeWorkoutDay = async (dayIndex: number) => {
    if (!plan) return;
    const newPlan = JSON.parse(JSON.stringify(plan));
    newPlan.days.splice(dayIndex, 1);
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const updateWorkoutDay = async (dayIndex: number, dayData: { day?: string; focus?: string }) => {
    if (!plan) return;
    const newPlan = JSON.parse(JSON.stringify(plan));
    newPlan.days[dayIndex] = { ...newPlan.days[dayIndex], ...dayData };
    setPlanState(newPlan);
    await saveToFirestore({ plan: newPlan });
  };

  const joinChallenge = async (challengeId: string) => {
    if (!profile || !user) return;
    const joinedChallenges = profile.joinedChallenges || [];
    if (joinedChallenges.includes(challengeId)) return;

    const newChallenges = [...joinedChallenges, challengeId];
    setProfile({ joinedChallenges: newChallenges });
  };

  const leaveChallenge = async (challengeId: string) => {
    if (!profile || !user) return;
    const joinedChallenges = profile.joinedChallenges || [];
    const newChallenges = joinedChallenges.filter(id => id !== challengeId);
    setProfile({ joinedChallenges: newChallenges });
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
        isThirdDay: false, 
        totalDays: profile.streak || 0
      };
    }

    const newCheckInDates = isAlreadyCheckedIn ? checkInDates : [...checkInDates, today];
    const newPoints = isAlreadyCheckedIn ? (profile.points || 0) : (profile.points || 0) + 50; 
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    // Streak logic (daily consecutive)
    let newStreak = profile.streak || 0;
    
    // Find the date before today in our list (excluding today if it's already there)
    const previousDates = checkInDates.filter(d => d !== today).sort((a,b) => b.localeCompare(a));
    
    if (previousDates.length > 0) {
      const lastCheckInStr = previousDates[0]; 
      const lastDate = new Date(lastCheckInStr + 'T12:00:00');
      const todayDate = new Date(today + 'T12:00:00');
      
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Continuous streak
        newStreak = isAlreadyCheckedIn ? (profile.streak || 1) : (profile.streak || 0) + 1;
      } else if (diffDays === 0) {
        // Already checked in today logic or double-tap protection
        newStreak = profile.streak || 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Ensure streak is at least 1 if we have a check-in today
    if (newStreak === 0 && newCheckInDates.includes(today)) {
      newStreak = 1;
    }

    // Medal Logic
    const currentMedals = profile.medals || [];
    const totalCheckIns = newCheckInDates.length;
    const newMedals = [...currentMedals];
    
    const medalCriteria = [
      { id: 'm1', name: 'Iniciante Fit', threshold: 1, icon: 'Zap' },
      { id: 'm10', name: 'Atleta de Bronze', threshold: 10, icon: 'Shield' },
      { id: 'm50', name: 'Fera da Academia', threshold: 50, icon: 'Flame' },
      { id: 'm100', name: 'Mestre do Treino', threshold: 100, icon: 'Trophy' },
      { id: 'm200', name: 'Lenda do FitAI', threshold: 200, icon: 'Award' }
    ];

    medalCriteria.forEach(m => {
      if (totalCheckIns >= m.threshold && !newMedals.some(exist => exist.name === m.name)) {
        newMedals.push({ name: m.name, icon: m.icon, earnedAt: new Date().toISOString() });
      }
    });

    const updates = {
      points: newPoints,
      level: newLevel,
      checkInDates: newCheckInDates,
      streak: newStreak,
      medals: newMedals,
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
      toggleFavorite, toggleTheme, setTheme,
      linkClient, linkNutritionist, setRole, setRoleForUser, setPlanTypeForUser, logout, calculateIMC, resetAccount, resetSimulation, saveWorkoutSession,
      addExerciseProgress, getExerciseProgress,
      toggleMealCheck, updateRealMealNotes, toggleWorkoutDayCheck, updateRealWorkoutNotes,
      addWorkoutReport, updateWorkoutReport, deleteWorkoutReport, doCheckIn,
      addExerciseToDay, removeExerciseFromDay, addWorkoutDay, removeWorkoutDay, updateWorkoutDay, joinChallenge, leaveChallenge
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
