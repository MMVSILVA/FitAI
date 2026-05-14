import { WorkoutPlan, UserProfile } from '../types';
import { auth, db } from '../firebase';
import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL_NAME = "gemini-3-flash-preview";

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error.message || '';
      const isUnavailable = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
      if (isUnavailable && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function generatePlan(userData: Partial<UserProfile>, userId: string): Promise<AIResponse> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    throw new Error('Usuário não encontrado');
  }
  
  const userDoc = userSnap.data();
  const planType = userDoc.planType || 'FREE';
  const generationsLeft = userDoc.planGenerationsLeft ?? 1;

  if (planType === 'FREE' && generationsLeft <= 0) {
    throw new Error('LIMIT_EXCEEDED');
  }

  const systemInstruction = `Você é um Personal Trainer e Nutricionista de elite. Sua missão é criar um plano de treino e estratégias de consistência rigorosamente baseadas no protocolo FITAI.
  
  REGRAS DE OURO:
  1. Base de dados: Use apenas exercícios conhecidos (Peito: Supino, Costas: Puxada, Pernas: Agachamento, etc).
  2. Idioma: Retorne tudo em Português do Brasil, EXCETO 'englishName' e 'imageKeyword'.
  3. Formato: Siga rigorosamente o schema JSON fornecido.
  4. Suplementação: Sempre inclua dicas técnicas de Whey, Creatina e Multivitamínicos sem citar marcas.`;

  const prompt = `Gere um protocolo completo para:
  Idade: ${userData.age} anos, Sexo: ${userData.gender}, Peso: ${userData.weight}kg, Altura: ${userData.height}cm.
  Objetivos: ${userData.objective?.join(', ')}.
  Nível: ${userData.fitnessLevel}.
  Frequência: ${userData.daysPerWeek} dias/semana, ${userData.workoutTime} min/treino.
  Local: ${userData.location}. Equipamentos: ${userData.equipment || 'padrão'}.
  Restrições: ${userData.restrictions || 'nenhuma'}.`;

  try {
    const { Type } = await import("@google/genai");
    
    const response = await withRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workout: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                objective: { type: Type.STRING },
                structure: { type: Type.STRING },
                frequency: { type: Type.STRING },
                duration: { type: Type.STRING },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.STRING },
                      focus: { type: Type.STRING },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            englishName: { type: Type.STRING },
                            group: { type: Type.STRING },
                            equipment: { type: Type.STRING },
                            sets: { type: Type.NUMBER },
                            reps: { type: Type.STRING },
                            weight: { type: Type.STRING },
                            tips: { type: Type.STRING },
                            breathing: { type: Type.STRING },
                            cadence: { type: Type.STRING },
                            technicalDescription: { type: Type.STRING },
                            imageKeyword: { type: Type.STRING },
                            rest: { type: Type.STRING }
                          },
                          required: ["name", "englishName", "group", "sets", "reps", "weight", "technicalDescription", "imageKeyword", "rest"]
                        }
                      }
                    }
                  }
                },
                progression: { type: Type.STRING },
                consistencyScore: { type: Type.NUMBER },
                strategies: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            diet: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.STRING },
                macros: {
                  type: Type.OBJECT,
                  properties: {
                    protein: { type: Type.STRING },
                    carbs: { type: Type.STRING },
                    fat: { type: Type.STRING }
                  }
                },
                meals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      time: { type: Type.STRING },
                      foods: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }));

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const plan = JSON.parse(text);

    if (planType === 'FREE') {
      await updateDoc(userRef, {
        planGenerationsLeft: Math.max(0, generationsLeft - 1)
      });
    }

    return plan;
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

export async function translateInstructions(instructions: string[]): Promise<string[]> {
  try {
    const textToTranslate = instructions.join('\n');
    
    const response = await withRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: 'user', 
        parts: [{ 
          text: `Traduza estas instruções técnicas de exercícios físicos de Inglês para Português do Brasil.
        Mantenha o tom profissional e instrutivo. 
        Retorne APENAS os passos traduzidos, um por linha.
        Instruções:
        ${textToTranslate}` 
        }]
      }]
    }));

    const translatedText = response.text;
    if (!translatedText) return instructions;

    const translated = translatedText
      .split('\n')
      .map((l: string) => l.replace(/^\d+\.\s*/, '').trim())
      .filter((l: string) => l !== '');

    return translated.length > 0 ? translated : instructions;
  } catch (error) {
    console.error("Translation AI error:", error);
    return instructions;
  }
}
