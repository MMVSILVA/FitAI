import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  // 1. Tenta pegar a chave do Vercel (import.meta.env)
  if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // 2. Tenta pegar a chave do AI Studio (process.env)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      // @ts-ignore
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}
  
  return "";
};

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const key = getApiKey();
    if (!key) {
      console.warn("Chave da API do Gemini não encontrada. O serviço de IA pode falhar.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key || "dummy-key-to-prevent-crash" });
  }
  return aiInstance;
};

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  goal: string;
  level: string;
  days: number;
}

export interface WorkoutPlan {
  days: {
    day: string;
    focus: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      rest: string;
    }[];
  }[];
  progression: string;
}

export interface DietPlan {
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
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
  diet: DietPlan;
}

export async function generatePlan(profile: UserProfile): Promise<AIResponse> {
  const prompt = `Você é um personal trainer e nutricionista profissional.

Baseado nos dados:
- Idade: ${profile.age}
- Peso: ${profile.weight}kg
- Altura: ${profile.height}m
- Objetivo: ${profile.goal}
- Experiência: ${profile.level}
- Dias disponíveis: ${profile.days} dias por semana

Gere:
1. Treino semanal estruturado
2. Progressão de carga
3. Plano alimentar com macros
4. Recomendações práticas

Seja específico e técnico. Retorne APENAS o JSON válido.`;

  try {
    console.log("Iniciando geração de plano com IA...");
    
    // Executar a chamada da API
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              workout: {
                type: Type.OBJECT,
                properties: {
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.STRING, description: "Ex: Segunda-feira" },
                        focus: { type: Type.STRING, description: "Ex: Peito e Tríceps" },
                        exercises: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              sets: { type: Type.NUMBER },
                              reps: { type: Type.STRING },
                              rest: { type: Type.STRING }
                            },
                            required: ["name", "sets", "reps", "rest"]
                          }
                        }
                      },
                      required: ["day", "focus", "exercises"]
                    }
                  },
                  progression: { type: Type.STRING, description: "Dicas de progressão de carga" }
                },
                required: ["days", "progression"]
              },
              diet: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER }
                    },
                    required: ["protein", "carbs", "fat"]
                  },
                  meals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Ex: Café da Manhã" },
                        time: { type: Type.STRING },
                        foods: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ["name", "time", "foods"]
                    }
                  },
                  recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["calories", "macros", "meals", "recommendations"]
              }
            },
            required: ["workout", "diet"]
          }
        }
      });

    console.log("Resposta recebida da IA.");
    let text = response.text;
    if (!text) {
      throw new Error("A IA retornou uma resposta vazia.");
    }
    
    // Limpar formatação markdown se houver
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(text) as AIResponse;
  } catch (error: any) {
    console.error("Erro detalhado ao gerar plano:", error);
    
    let errorMessage = error.message || "Falha ao comunicar com a IA.";
    
    // Check if it's an API key error
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
      errorMessage = "Chave da API do Gemini inválida ou não configurada. Se você está no Vercel, adicione a variável VITE_GEMINI_API_KEY nas configurações do projeto.";
    }
    
    throw new Error(errorMessage);
  }
}
