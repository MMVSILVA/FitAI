import { WorkoutPlan, UserProfile } from '../types';
import { auth } from '../firebase';

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
  }[];
  recommendations: string[];
}

export interface AIResponse {
  workout: WorkoutPlan;
  diet?: DietPlan;
}

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`
  };
}

export async function generatePlan(userData: Partial<UserProfile>, userId: string): Promise<AIResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/ai/generate-plan', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ userData, userId })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Erro ao gerar plano');
  }

  return await response.json();
}

export async function translateInstructions(instructions: string[]): Promise<string[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ instructions })
    });

    if (!response.ok) return instructions;
    
    const data = await response.json();
    return data.instructions;
  } catch (error) {
    console.error("Translation AI error:", error);
    return instructions;
  }
}
