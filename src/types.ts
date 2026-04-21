export type UserRole = 'user' | 'premium_user' | 'trainer' | 'nutritionist' | 'admin';
export type PlanType = 'FREE' | 'PRO' | 'PREMIUM';

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
  isPremium: boolean;
  trialEndsAt?: string;
  createdAt: string;
}

export interface Exercise {
  name: string;
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
  rest: string;
  loadHistory?: { weight: string; date: string }[];
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
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
}

export interface ProgressEntry {
  id: string;
  userId: string;
  weight: number;
  bodyFat?: number;
  photos: string[];
  date: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
}
