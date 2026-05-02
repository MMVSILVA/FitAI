import express from 'express';
import { GoogleGenAI } from "@google/genai";
import { getAdminDb } from '../lib/firebase-admin.ts';
import { AuthRequest } from '../middleware/auth.ts';

// Initialize Gemini with server-side key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL_NAME = "gemini-flash-latest"; // Using stable alias from skill

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

export const generatePlan = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.uid;
    if (!userId) return res.status(401).json({ error: 'User ID required from authentication' });

    const db = getAdminDb();
    const userSnap = await db.collection('users').doc(userId).get();
    
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    
    const userDoc = userSnap.data()!;
    const userProfile = userDoc.profile || {};
    const planType = userDoc.planType || 'FREE';
    const generationsLeft = userDoc.planGenerationsLeft ?? 1;

    // Check limits for FREE plan
    if (planType === 'FREE' && generationsLeft <= 0) {
      return res.status(403).json({ 
        error: 'Limite de geração atingido.',
        code: 'LIMIT_EXCEEDED'
      });
    }

    const prompt = `
      Você é um Personal Trainer e Nutricionista de elite. Sua missão é criar um plano de treino e estratégias de consistência rigorosamente baseadas no protocolo FITAI.

      DADOS DO USUÁRIO:
      Idade: ${userProfile.age || 'Não informada'}
      Sexo: ${userProfile.gender || 'Não informado'}
      Peso: ${userProfile.weight || '0'}kg
      Altura: ${userProfile.height || '0'}cm
      Objetivos: ${Array.isArray(userProfile.objective) ? userProfile.objective.join(', ') : (userProfile.objective || 'Fitness geral')}
      Nível: ${userProfile.fitnessLevel || 'iniciante'}
      Dias por semana: ${userProfile.daysPerWeek || '3'}
      Tempo por treino: ${userProfile.workoutTime || '60'} min
      Local: ${userProfile.location || 'academia'}
      Equipamentos: ${userProfile.equipment || 'completo'}
      Restrições: ${userProfile.restrictions || 'nenhuma'}
      Dieta: ${userProfile.dietHistory || 'equilibrada'}
      Sono: ${userProfile.sleepQuality || 'normal'}
      Histórico: ${userProfile.fitnessHistory || 'nenhum'}

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
          "frequency": "${userProfile.daysPerWeek || '3'} dias/semana",
          "duration": "${userProfile.workoutTime || '60'} min/sessão",
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
            "protein": "Valor numérico (Ex: 180)",
            "carbs": "Valor numérico (Ex: 300)",
            "fat": "Valor numérico (Ex: 70)"
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
      7. 'diet.macros': Retornar APENAS o número. Não adicionar "g" ou "gramas" no valor, pois o sistema adicionará automaticamente.
      8. 'diet.recommendations': Incluir OBRIGATORIAMENTE dicas de Whey Protein, Creatina e outros suplementos vitais. Focar em dosagens, melhor composição/pureza e aplicação técnica. PROIBIDO CITAR MARCAS COMERCIAIS.
      9. 'technicalDescription': Descrição profissional e detalhada em Português.

      Responda apenas com o JSON puro, sem markdown.
    `;
    
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const result = await withRetry(() => model.generateContent(prompt));

    const response = await result.response;
    const text = response.text();
    if (!text) throw new Error("No response from AI");

    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(jsonString);

    // Decrement generations for FREE tier
    if (planType === 'FREE') {
      await db.collection('users').doc(userId).update({
        planGenerationsLeft: Math.max(0, generationsLeft - 1)
      });
    }

    res.json(plan);
  } catch (error: any) {
    console.error("AI Generate Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const translateExercise = async (req: AuthRequest, res: express.Response) => {
  try {
    const { instructions } = req.body;
    const textToTranslate = instructions.join('\n');
    
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const result = await withRetry(() => model.generateContent(`Traduza estas instruções técnicas de exercícios físicos de Inglês para Português do Brasil.
        Mantenha o tom profissional e instrutivo. 
        Retorne APENAS os passos traduzidos, um por linha.
        Instruções:
        ${textToTranslate}`));

    const response = await result.response;
    const translatedText = response.text();
    if (!translatedText) return res.json({ instructions });

    const translated = translatedText
      .split('\n')
      .map((l: string) => l.replace(/^\d+\.\s*/, '').trim())
      .filter((l: string) => l !== '');

    res.json({ instructions: translated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
