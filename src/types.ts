export type UserRole = 'user' | 'premium_user' | 'trainer' | 'nutritionist' | 'admin';
export type PlanType = 'FREE' | 'PRO' | 'PREMIUM' | 'PROFISSIONAL';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  planType: PlanType;
  age: number;
  gender: string;
  weight: number;
  height: number;
  objective: string[];
  fitnessLevel: 'iniciante' | 'intermediário' | 'avançado';
  daysPerWeek: number;
  workoutTime: number; // in minutes
  location: 'academia' | 'casa' | 'pouco_equipamento';
  equipment: string;
  restrictions: string;
  dietHistory: string;
  sleepQuality: string;
  fitnessHistory: string;
  trainerId?: string;
  nutritionistId?: string;
  linkedTrainerId?: string;
  linkedNutritionistId?: string;
  isPremium: boolean;
  favorites?: string[];
  theme?: 'light' | 'dark' | 'system';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  planGenerationsLeft?: number; // For FREE tier limit
  createdAt: string;
  adherenceLogs?: AdherenceLog[];
  photoURL?: string;
  points?: number;
  level?: number;
  streak?: number;
  checkInDates?: string[];
  badges?: string[];
  joinedChallenges?: string[];
  // Professional fields
  bio?: string;
  specialty?: string;
  license?: string;
  location_city?: string;
  location_state?: string;
  experience?: string;
  consultationPrice?: string;
  clients?: string[];
  trainerClients?: string[];
  nutritionistClients?: string[];
}

export interface Exercise {
  name: string;
  englishName?: string;
  group?: string;
  equipment?: string;
  sets: number;
  reps: string;
  notes?: string;
  weight?: string;
  done?: boolean;
  tips?: string;
  breathing?: string;
  cadence?: string;
  imageKeyword?: string;
  imageUrl?: string;
  technicalDescription: string;
  rest: string;
  loadHistory?: { weight: string; date: string }[];
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
  realWorkoutNotes?: string;
  workoutReports?: { id: string; text: string; date: string }[];
  isCompleted?: boolean;
}

export interface DietPlan {
  calories: string;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
  };
  meals: {
    name: string;
    time: string;
    foods: string[];
    isAdhered?: boolean;
    realMealNotes?: string;
  }[];
  recommendations: string[];
  orientations?: string[]; // Espaço para orientações nutricionais detalhadas
  professionalNotes?: string; // Notas restritas ao profissional ou para o paciente
}

export interface AdherenceLog {
  date: string;
  mealName: string;
  adhered: boolean;
}

export interface WorkoutPlan {
  title: string;
  objective: string;
  structure: string;
  frequency: string;
  duration: string;
  days: WorkoutDay[];
  progression: string;
  consistencyScore: number;
  strategies: string[];
  recommendations?: string[]; // Orientações gerais do Personal
  professionalNotes?: string; // Notas privadas/orientações profissionais
  diet?: DietPlan;
}

export interface ProgressEntry {
  id: string;
  userId: string;
  weight: number;
  bodyFat?: number;
  photos: string[];
  date: string;
}

export interface ExerciseProgress {
  id: string;
  userId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
}
