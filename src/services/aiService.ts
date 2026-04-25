import { WorkoutPlan, UserProfile } from '../types';
import { GoogleGenAI } from "@google/genai";
import { ptToEnSearch } from '../lib/exerciseTranslations';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL_NAME = "gemini-3-flash-preview"; // Switching to Flash for higher quota limits on free tier

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isUnavailable = error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.includes('high demand');
      if (isUnavailable && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.warn(`Gemini API busy, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export interface DietPlan {
  // ... existing ...
}

export interface AIResponse {
  workout: WorkoutPlan;
  diet?: DietPlan;
}

export async function generatePlan(userData: Partial<UserProfile>): Promise<AIResponse> {
  const prompt = `
    Você é um Personal Trainer e Nutricionista de elite. Sua missão é criar um plano de treino e estratégias de consistência rigorosamente baseadas no protocolo FITAI.

    DADOS DO USUÁRIO:
    Idade: ${userData.age}
    Sexo: ${userData.gender}
    Peso: ${userData.weight}kg
    Altura: ${userData.height}cm
    Objetivos: ${Array.isArray(userData.objective) ? userData.objective.join(', ') : userData.objective}
    Nível: ${userData.fitnessLevel}
    Dias por semana: ${userData.daysPerWeek}
    Tempo por treino: ${userData.workoutTime} min
    Local: ${userData.location}
    Equipamentos: ${userData.equipment}
    Restrições: ${userData.restrictions}
    Dieta: ${userData.dietHistory}
    Sono: ${userData.sleepQuality}
    Histórico: ${userData.fitnessHistory}

    PROTOCOLO DE FREQUÊNCIA:
    - Se dias <= 2: FULL BODY
    - Se dias == 3: ABC
    - Se dias entre 4 e 5: DIVISÃO POR GRUPOS MUSCULARES
    - Se dias >= 6: PERIODIZAÇÃO AVANÇADA

    PROTOCOLO DE LOCAL:
    - Se academia: Exercícios completos com máquinas e pesos livres.
    - Se casa: Adaptar para peso corporal e equipamentos simples.
    - Se pouco_equipamento: Priorizar exercícios funcionais + peso corporal.

    ESTILO POR OBJETIVO:
    - Hipertrofia: Volume + sobrecarga progressiva.
    - Emagrecimento: Intensidade + gasto calórico + cardio.
    - Performance: Força + resistência + explosão.

    PROTOCOLO DE SEGURANÇA:
    - Respeitar lesões SEMPRE.
    - Evitar exercícios de risco.
    - Ajustar intensidade ao nível.

    FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):
    {
      "workout": {
        "title": "Protocolo FITAI Personalizado",
        "objective": "Resumo do Objetivo",
        "structure": "FULL BODY | ABC | GRUPOS MUSCULARES | AVANÇADA",
        "frequency": "${userData.daysPerWeek} dias/semana",
        "duration": "${userData.workoutTime} min/sessão",
        "days": [
          {
            "day": "Dia 1",
            "focus": "Músculos Alvo",
            "exercises": [
              { 
                "name": "Nome em Português", 
                "englishName": "Name in English",
                "group": "Grupo Muscular",
                "equipment": "Equipamento Necessário",
                "sets": 3, 
                "reps": "12", 
                "weight": "Moderado - 10 Kg de cada lado", 
                "tips": "Dica curta", 
                "breathing": "Dica respiração", 
                "cadence": "2:0:2", 
                "technicalDescription": "Descrição técnica completa em português.",
                "imageKeyword": "Exact English name for image search", 
                "rest": "60s" 
              }
            ]
          }
        ],
        "progression": "Estratégia de progressão",
        "consistencyScore": 100,
        "strategies": ["Estratégia 1"]
      },
      "diet": {
        "calories": "Valor total diário (Ex: 2400)",
        "macros": {
          "protein": "Valor em gramas",
          "carbs": "Valor em gramas",
          "fat": "Valor em gramas"
        },
        "meals": [
          {
            "name": "Nome da Refeição (Ex: Café da Manhã)",
            "time": "Horário Sugerido (Ex: 08:00)",
            "foods": ["Alimento 1 + Gramagem", "Alimento 2 + Gramagem"]
          }
        ],
        "recommendations": [
            "Dica de Whey Protein: [Dosagem, composição ideal e melhor aplicação/horário]",
            "Dica de Creatina: [Dosagem, saturação e aplicação constante]",
            "Dica de Suplementação: [Outras dicas relevantes como Omega 3, Multivitamínico ou Pré-treinos sem marcas]"
        ]
      }
    }

    BASE DE DADOS DE EXERCÍCIOS (USE ESTA REFERÊNCIA RIGOROSAMENTE):
    - Peito: Supino Reto (imageKeyword: bench press), Supino Inclinado (incline bench press), Supino Declinado (decline bench press), Crucifixo (dumbbell fly), Voador / Peck Deck (pec deck machine), Flexão de Braço (push-up), Crossover (cable crossover)
    - Costas: Puxada Aberta (lat pulldown), Remada Baixa (seated row), Remada Cavalinho (t-bar row), Remada Curvada (bent-over row), Levantamento Terra (deadlift), Remada Unilateral (dumbbell row), Barra Fixa (pull-up), Extensão Lombar (back extension)
    - Ombros: Desenvolvimento de Ombros (shoulder press), Elevação Lateral (lateral raise), Elevação Frontal (front raise), Crucifixo Invertido (rear delt fly), Remada Alta (upright row), Encolhimento (shrugs)
    - Braços: Rosca Direta (barbell curl), Rosca Alternada (dumbbell curl), Rosca Concentrada (concentration curl), Rosca Scott (preacher curl), Tríceps Pulley / Corda (triceps pushdown), Tríceps Testa (skullcrusher), Tríceps Francês (french press), Mergulho (dips)
    - Pernas: Agachamento (squat), Leg Press (leg press machine), Cadeira Extensora (leg extension), Mesa Flexora (leg curl machine), Stiff (romanian deadlift), Avanço / Passada (lunges), Elevação de Panturrilha (calf raises), Agachamento Búlgaro (bulgarian split squat)
    - Core: Crunch (crunch), Prancha (plank), Abdominal Infra (leg raise), Abdominal Supra (upper crunch), Rotação Russa (russian twist)
    - Cárdio: Esteira (treadmill), Bicicleta Ergométrica (stationary bike), Elíptico (elliptical), Simulador de Escada (stairclimber)

    DIRETRIZES DE SAÍDA:
    1. 'name': Deve ser o nome em Português EXATO da lista acima.
    2. 'englishName': O nome em Inglês correspondente.
    3. 'imageKeyword': O termo em Inglês entre parênteses acima (EXATO).
    4. 'group': O grupo muscular (Peito, Costas, etc).
    5. 'equipment': Barra, Haltere, Máquina, Cabo ou Peso Corporal.
    6. 'weight': Seguir RIGOROSAMENTE o formato "Intensidade - Valor sugerido" (Ex: 'Moderado - 10 Kg de cada lado', 'Leve - Peso do Corpo', 'Intenso - 40 kg totais').
    7. 'diet.recommendations': Incluir OBRIGATORIAMENTE dicas de Whey Protein, Creatina e outros suplementos vitais. Focar em dosagens, melhor composição/pureza e aplicação técnica. PROIBIDO CITAR MARCAS COMERCIAIS.
    8. 'technicalDescription': Descrição profissional e detalhada em Português.

    Responda apenas com o JSON puro, sem markdown.
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  }));

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  // Clean potential markdown code blocks
  const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const plan = JSON.parse(jsonString);

  return plan;
}

export async function translateInstructions(instructions: string[]): Promise<string[]> {
  try {
    const textToTranslate = instructions.join('\n');
    const response = await withRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Traduza estas instruções técnicas de exercícios físicos de Inglês para Português do Brasil.
Mantenha o tom profissional e instrutivo. 
Retorne APENAS os passos traduzidos, um por linha.
Não adicione números ou prefixos extras como "Passo 1:". 
Instruções:
${textToTranslate}`,
    }));

    const translatedText = response.text;
    if (!translatedText) return instructions;

    return translatedText
      .split('\n')
      .map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/^Passo\s*\d+:\s*/, '').trim())
      .filter((l: string) => l !== '');
  } catch (error) {
    console.error("Translation AI error:", error);
    throw error;
  }
}
