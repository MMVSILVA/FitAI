import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import * as paymentController from '../controllers/paymentController.ts';
import { isAdminEmail } from '../config/admins.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';
import { APP_VERSION, BUILD_DATE } from '../../constants.ts';

const router = express.Router({
  caseSensitive: false,
  mergeParams: true
});

// App Version and Health sync route
router.get('/version', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    timestamp: new Date().toISOString(),
    name: 'FitAI'
  });
});

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Exercise Generation Route
router.post('/exercises/generate-details', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { exerciseName } = req.body;
    if (!exerciseName) {
      return res.status(400).json({ error: 'Nome do exercício é obrigatório' });
    }

    console.log(`Generating details for exercise: ${exerciseName}`);

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Gere detalhes técnicos profissionais para o exercício: ${exerciseName}.
      O retorno deve ser em português e focado em um personal trainer de alto nível.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["execution", "tip", "breathing", "cadence", "cadenceDetails"],
          properties: {
            execution: {
              type: Type.STRING,
              description: "Instrução curta e clara de como executar o movimento (máximo 150 caracteres).",
            },
            tip: {
              type: Type.STRING,
              description: "Uma dica chave para segurança ou performance.",
            },
            breathing: {
              type: Type.STRING,
              description: "Instrução de quando inspirar e expirar.",
            },
            cadence: {
              type: Type.STRING,
              description: "Cadência recomendada no formato X:Y:Z (ex: 2:0:2).",
            },
            cadenceDetails: {
              type: Type.STRING,
              description: "Explicação da cadência (ex: 2s desc | 0s isom | 2s sub).",
            }
          }
        },
      },
    });

    const details = JSON.parse(response.text || '{}');
    res.json(details);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: 'Erro ao gerar detalhes com IA', details: error.message });
  }
});

// AI Recipe Generation Route based on User Macronutrient Goals
router.post('/recipes/generate', async (req, res) => {
  try {
    const { 
      mealType = "Almoço",
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      dietaryPreference = "Equilibrada",
      availableIngredients = "",
      prepTimeMax = "30",
      userGoal = "Hipertrofia"
    } = req.body;

    console.log(`[Recipe Gen] Generating recipe for ${mealType} | Targets: ${targetCalories}kcal, ${targetProtein}g P, ${targetCarbs}g C, ${targetFat}g F | Pref: ${dietaryPreference}`);

    const prompt = `Você é um nutricionista esportivo e chef profissional de alta performance da FitAI.
Crie uma receita saudável, prática, saborosa e de alto valor biológico com base nas seguintes metas e restrições:
- Tipo de Refeição: ${mealType}
- Objetivo do Usuário: ${userGoal}
- Meta Calórica da Refeição: Aproximadamente ${targetCalories || '450'} kcal
- Meta de Proteínas: Aproximadamente ${targetProtein || '35'}g
- Meta de Carboidratos: Aproximadamente ${targetCarbs || '40'}g
- Meta de Gorduras: Aproximadamente ${targetFat || '15'}g
- Preferência/Restrição Alimentar: ${dietaryPreference}
- Ingredientes disponíveis / Destaques: ${availableIngredients ? availableIngredients : 'Ingredientes comuns e acessíveis no Brasil'}
- Tempo máximo de preparo: ${prepTimeMax} minutos

A receita DEVE conter ingredientes reais com quantidades precisas (gramas/colheres/xícaras), modo de preparo passo a passo detalhado, tabela de macronutrientes calculada e uma dica do chef para otimização da absorção e sabor.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "title", 
            "description", 
            "mealType", 
            "prepTimeMinutes", 
            "cookTimeMinutes", 
            "servings", 
            "difficulty", 
            "macros", 
            "ingredients", 
            "instructions", 
            "chefTip",
            "tags"
          ],
          properties: {
            title: {
              type: Type.STRING,
              description: "Nome atraente da receita (ex: Bowl Fit de Frango com Batata Doce e Abacate).",
            },
            description: {
              type: Type.STRING,
              description: "Breve explicação sobre os benefícios nutricionais e por que atende as metas de macros.",
            },
            mealType: {
              type: Type.STRING,
              description: "Tipo de refeição (ex: Café da Manhã, Almoço, Jantar, Pós-treino).",
            },
            prepTimeMinutes: {
              type: Type.NUMBER,
              description: "Tempo de preparo em minutos.",
            },
            cookTimeMinutes: {
              type: Type.NUMBER,
              description: "Tempo de cozimento em minutos.",
            },
            servings: {
              type: Type.NUMBER,
              description: "Número de porções geradas.",
            },
            difficulty: {
              type: Type.STRING,
              description: "Fácil, Médio ou Avançado.",
            },
            macros: {
              type: Type.OBJECT,
              required: ["calories", "protein", "carbs", "fats", "fiber"],
              properties: {
                calories: { type: Type.NUMBER, description: "Calorias totais por porção (kcal)" },
                protein: { type: Type.NUMBER, description: "Gramas de proteína por porção" },
                carbs: { type: Type.NUMBER, description: "Gramas de carboidrato por porção" },
                fats: { type: Type.NUMBER, description: "Gramas de gordura por porção" },
                fiber: { type: Type.NUMBER, description: "Gramas de fibra alimentar por porção" },
              }
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["item", "amount", "category"],
                properties: {
                  item: { type: Type.STRING, description: "Nome do ingrediente" },
                  amount: { type: Type.STRING, description: "Quantidade e unidade de medida (ex: 150g, 2 colheres de sopa, 1 unidade)" },
                  category: { type: Type.STRING, description: "Proteína, Carboidrato, Gordura Boa, Vegetal ou Tempero" }
                }
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Passos ordenados do modo de preparo."
            },
            chefTip: {
              type: Type.STRING,
              description: "Dica secreta do Chef Nutricionista para sabor, digestibilidade ou preparo em marmita."
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Tags rápidas (ex: ['Hiperproteico', 'Rápido', 'Sem Lactose', 'Gluten Free'])"
            }
          }
        }
      }
    });

    const recipeData = JSON.parse(response.text || '{}');
    res.json({ success: true, recipe: recipeData });
  } catch (error: any) {
    console.error("Gemini Recipe Generation Error:", error);
    
    // Fallback inteligente caso a API falhe ou a chave não esteja disponível
    const fallbackCalories = Number(req.body.targetCalories) || 480;
    const fallbackProtein = Number(req.body.targetProtein) || 38;
    const fallbackCarbs = Number(req.body.targetCarbs) || 45;
    const fallbackFat = Number(req.body.targetFat) || 14;

    const fallbackRecipe = {
      title: req.body.mealType === 'Café da Manhã' ? 'Omelete Proteico com Aveia e Queijo Branco' : 'Bowl Anabólico de Frango Grelhado com Arroz Integral e Brócolis',
      description: 'Uma refeição perfeitamente balanceada para apoiar sua recuperação muscular e energia diária com base nos seus macros.',
      mealType: req.body.mealType || 'Almoço',
      prepTimeMinutes: 15,
      cookTimeMinutes: 15,
      servings: 1,
      difficulty: 'Fácil',
      macros: {
        calories: fallbackCalories,
        protein: fallbackProtein,
        carbs: fallbackCarbs,
        fats: fallbackFat,
        fiber: 6
      },
      ingredients: [
        { item: 'Peito de frango em cubos', amount: `${Math.round(fallbackProtein * 3.5)}g`, category: 'Proteína' },
        { item: 'Arroz integral cozido ou batata doce', amount: `${Math.round(fallbackCarbs * 2.8)}g`, category: 'Carboidrato' },
        { item: 'Brócolis e legumes no vapor', amount: '100g', category: 'Vegetal' },
        { item: 'Azeite de oliva extravirgem', amount: '1 colher de sopa (10ml)', category: 'Gordura Boa' },
        { item: 'Cúrcuma, alho, orégano e sal a gosto', amount: '1 pitada', category: 'Tempero' }
      ],
      instructions: [
        'Tempere o peito de frango com alho, cúrcuma, sal e pimenta.',
        'Aqueça uma frigideira antiaderente com um fio de azeite e doure o frango por 6 a 8 minutos até ficar suculento.',
        'Cozinhe o brócolis no vapor por 4 minutos para manter a cor e os micronutrientes.',
        'Monte o prato com o arroz integral, o frango grelhado e o brócolis.',
        'Finalize regando o azeite de oliva e polvilhando sementes de gergelim ou orégano.'
      ],
      chefTip: 'Para frango sempre suculento, sele em fogo médio-alto e deixe descansar por 2 minutos antes de cortar.',
      tags: ['Hiperproteico', 'Fácil', 'Equilibrado', 'Meal Prep']
    };

    res.json({ success: true, recipe: fallbackRecipe, isFallback: true });
  }
});

// Debug middleware for the router
router.use((req, res, next) => {
  console.log(`[ROUTER DEBUG] Match attempt for: ${req.url} (method: ${req.method})`);
  next();
});

// Admin Check
router.get('/auth/admin-check', authMiddleware, (req: AuthRequest, res) => {
  // Use the email from the verified token, or use the provided email if it matches the token's email
  const queryEmail = req.query.email as string;
  const verifiedEmail = req.userEmail;

  if (queryEmail && verifiedEmail && queryEmail.toLowerCase() !== verifiedEmail.toLowerCase()) {
    return res.status(403).json({ error: 'Token email does not match requested email' });
  }

  const emailToCheck = verifiedEmail || queryEmail;
  res.json({ isAdmin: isAdminEmail(emailToCheck) });
});

// Admin Broadcast Update
router.post('/admin/broadcast-update', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const verifiedEmail = req.userEmail;
    if (!isAdminEmail(verifiedEmail)) {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores podem enviar atualizações' });
    }

    const { latestVersion, updateMessage } = req.body;
    if (!updateMessage) {
      return res.status(400).json({ error: 'Mensagem de atualização obrigatória' });
    }

    const { getAdminDb } = await import('../lib/firebase-admin.ts');
    const adminDb = getAdminDb();
    await adminDb.collection('system').doc('config').set({
      latestVersion: latestVersion || '1.0.0',
      updateMessage,
      updatedAt: new Date().toISOString(),
      updatedBy: verifiedEmail || 'admin'
    }, { merge: true });

    res.json({ success: true, message: 'Notificação de atualização transmitida com sucesso' });
  } catch (error: any) {
    console.error('Error in /admin/broadcast-update:', error);
    res.status(500).json({ error: 'Erro ao transmitir atualização', details: error.message });
  }
});

// Subscription Sync Route
router.post('/subscription/sync-status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { syncSubscriptionStatus } = await import('../controllers/paymentController.ts');
    await syncSubscriptionStatus(req, res);
  } catch (error: any) {
    console.error('Error in /subscription/sync-status:', error);
    res.status(500).json({ error: 'Erro ao sincronizar assinatura', details: error.message });
  }
});

// Simple in-memory cache for exercise searches
const exerciseCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Global variable to store the full database if fetched from GitHub
let fullExerciseDb: any[] | null = null;
let lastDbFetch: number = 0;

async function getFullDbFromGithub() {
  if (fullExerciseDb && (Date.now() - lastDbFetch < CACHE_TTL * 24)) {
    return fullExerciseDb;
  }

  try {
    console.log("Fetching full exercise database from GitHub source...");
    const urls = [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json'
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) {
          const data = await response.json();
          fullExerciseDb = Array.isArray(data) ? data : [];
          lastDbFetch = Date.now();
          console.log(`Successfully cached ${fullExerciseDb.length} exercises from ${url}.`);
          return fullExerciseDb;
        }
      } catch (innerErr) {
        console.warn(`Failed to fetch from ${url}:`, innerErr);
      }
    }
  } catch (e) {
    console.error("Failed to fetch full DB from GitHub mirrors:", e);
  }
  return fullExerciseDb || [];
}

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Payment Routes - Handled in server.ts for direct raw body support if needed, but keeping webhook there.
// Webhook is handled in server.ts directly.

// ExerciseDB Proxy (avoids CORS)
router.get('/exercises/search', async (req, res) => {
  try {
    let { name, limit, cursor } = req.query;
    const limitNum = parseInt(limit as string) || 20;
    const rawSearch = (name as string || '').trim();
    
    // Comprehensive dictionary for Portuguese and English anatomical terms
    const muscleSynonyms: Record<string, string[]> = {
      'peito': ['chest', 'pectorals', 'bench', 'fly', 'pushup'],
      'peitoral': ['chest', 'pectorals', 'bench', 'fly', 'pushup'],
      'chest': ['chest', 'pectorals', 'bench', 'fly'],
      'costas': ['back', 'lats', 'middle back', 'lower back', 'traps', 'row', 'pulldown'],
      'dorsal': ['back', 'lats', 'row', 'pulldown'],
      'back': ['back', 'lats', 'middle back', 'lower back', 'traps', 'row'],
      'perna': ['quadriceps', 'hamstrings', 'calves', 'glutes', 'squat', 'leg', 'lunge'],
      'pernas': ['quadriceps', 'hamstrings', 'calves', 'glutes', 'squat', 'leg', 'lunge'],
      'leg': ['quadriceps', 'hamstrings', 'calves', 'glutes', 'squat', 'leg'],
      'legs': ['quadriceps', 'hamstrings', 'calves', 'glutes', 'squat', 'leg'],
      'ombro': ['shoulders', 'delts', 'shoulder', 'raise', 'military'],
      'ombros': ['shoulders', 'delts', 'shoulder', 'raise', 'military'],
      'shoulder': ['shoulders', 'delts', 'shoulder', 'raise'],
      'shoulders': ['shoulders', 'delts', 'shoulder', 'raise'],
      'braço': ['biceps', 'triceps', 'forearms', 'arm', 'curl', 'dip'],
      'braços': ['biceps', 'triceps', 'forearms', 'arm', 'curl', 'dip'],
      'arm': ['biceps', 'triceps', 'forearms', 'arm', 'curl'],
      'arms': ['biceps', 'triceps', 'forearms', 'arm', 'curl'],
      'abdominal': ['abdominals', 'crunch', 'plank', 'waist', 'sit-up', 'core'],
      'abdominais': ['abdominals', 'crunch', 'plank', 'waist', 'sit-up', 'core'],
      'abs': ['abdominals', 'crunch', 'plank', 'waist', 'sit-up', 'core'],
      'biceps': ['biceps', 'curl'],
      'bíceps': ['biceps', 'curl'],
      'triceps': ['triceps', 'dip', 'extension', 'pushdown'],
      'tríceps': ['triceps', 'dip', 'extension', 'pushdown'],
      'glúteo': ['glutes', 'hip', 'bridge'],
      'glúteos': ['glutes', 'hip', 'bridge'],
      'glute': ['glutes', 'hip', 'bridge'],
      'glutes': ['glutes', 'hip', 'bridge'],
      'panturrilha': ['calves', 'calf'],
      'panturrilhas': ['calves', 'calf'],
      'calf': ['calves', 'calf'],
      'agachamento': ['squat'],
      'supino': ['bench press', 'chest press'],
      'rosca': ['curl'],
      'remada': ['row'],
      'puxada': ['pulldown', 'pull-up'],
      'elevação': ['raise'],
      'extensão': ['extension'],
      'flexão': ['pushup', 'curl'],
      'cardio': ['cardio', 'run', 'bike', 'stair']
    };

    const lowerQuery = rawSearch.toLowerCase();
    const synonyms = muscleSynonyms[lowerQuery] || [lowerQuery];
    const primaryTerm = synonyms[0] || '';

    const cacheKey = `search-${rawSearch}-${limit}-${cursor}`;

    // Check cache
    const cached = exerciseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    let finalData = null;

    // Try OSS API first with primary keyword
    if (primaryTerm && primaryTerm !== 'fitness') {
      try {
        const ossUrl = `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(primaryTerm)}&limit=${limitNum}${cursor ? `&cursor=${cursor}` : ''}`;
        const response = await fetch(ossUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FitnessApp/1.0',
            'Accept': 'application/json',
            'Referer': 'https://exercisedb.io/'
          },
          signal: AbortSignal.timeout(3500)
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            const rawData = data.success ? (data.data || []) : (Array.isArray(data) ? data : []);
            if (rawData.length > 0) {
              const normalizedData = rawData.map((item: any) => ({
                exerciseId: item.exerciseId || item.id || `ex-${Math.random().toString(36).substr(2, 9)}`,
                name: item.name,
                gifUrl: item.gifUrl,
                bodyParts: Array.isArray(item.bodyParts) ? item.bodyParts : [item.bodyPart || 'other'],
                equipments: Array.isArray(item.equipments) ? item.equipments : [item.equipment || 'none'],
                targetMuscles: Array.isArray(item.targetMuscles) ? item.targetMuscles : [item.target || 'various'],
                secondaryMuscles: item.secondaryMuscles || [],
                instructions: item.instructions || []
              }));

              finalData = {
                success: true,
                data: normalizedData,
                meta: data.meta || { hasNextPage: normalizedData.length >= limitNum, nextCursor: null }
              };
            }
          }
        }
      } catch (e) {
        // Fallback to local DB
      }
    }

    // MEGA ROBUST FALLBACK: Search complete local/GitHub exercise DB
    if (!finalData) {
      const allExercises = await getFullDbFromGithub();
      if (allExercises && allExercises.length > 0) {
        let filtered = allExercises;
        if (rawSearch) {
          const searchTokens = [lowerQuery, ...synonyms].filter(Boolean);

          filtered = allExercises.filter((ex: any) => {
            const exName = (ex.name || '').toLowerCase();
            const exBodyPart = (ex.bodyPart || '').toLowerCase();
            const exTarget = (ex.target || '').toLowerCase();
            const exCategory = (ex.category || '').toLowerCase();
            const exEquipment = (ex.equipment || '').toLowerCase();
            const exPrimary = Array.isArray(ex.primaryMuscles) 
              ? ex.primaryMuscles.map((m: any) => String(m).toLowerCase()).join(' ') 
              : '';
            const exSecondary = Array.isArray(ex.secondaryMuscles) 
              ? ex.secondaryMuscles.map((m: any) => String(m).toLowerCase()).join(' ') 
              : '';

            return searchTokens.some(token => 
              exName.includes(token) ||
              exPrimary.includes(token) ||
              exSecondary.includes(token) ||
              exBodyPart.includes(token) ||
              exTarget.includes(token) ||
              exCategory.includes(token) ||
              exEquipment.includes(token)
            );
          });

          // Sort by relevance (exact name or primary muscle match first)
          filtered.sort((a: any, b: any) => {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            const aMatchesName = synonyms.some(s => aName.includes(s)) ? 1 : 0;
            const bMatchesName = synonyms.some(s => bName.includes(s)) ? 1 : 0;
            return bMatchesName - aMatchesName;
          });
        }

        const startIndex = cursor ? parseInt(cursor as string) || 0 : 0;
        const pageData = filtered.slice(startIndex, startIndex + limitNum);
        
        const normalizedData = pageData.map((item: any) => ({
          exerciseId: item.id || item.exerciseId || `ex-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          gifUrl: item.gifUrl || (item.images && item.images.length > 0 ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${item.images[0]}` : undefined),
          bodyParts: Array.isArray(item.bodyParts) ? item.bodyParts : (item.primaryMuscles || [item.bodyPart || 'other']),
          equipments: Array.isArray(item.equipments) ? item.equipments : [item.equipment || 'none'],
          targetMuscles: Array.isArray(item.targetMuscles) ? item.targetMuscles : (item.primaryMuscles || [item.target || 'various']),
          secondaryMuscles: item.secondaryMuscles || [],
          instructions: item.instructions || []
        }));

        finalData = {
          success: true,
          data: normalizedData,
          meta: { 
            hasNextPage: startIndex + limitNum < filtered.length, 
            nextCursor: (startIndex + limitNum < filtered.length) ? (startIndex + limitNum).toString() : null 
          }
        };
      }
    }

    // If still no results, return clean empty list (never 404 or 503)
    if (!finalData) {
      finalData = {
        success: true,
        data: [],
        meta: { hasNextPage: false, nextCursor: null }
      };
    }

    // Only save non-empty results to cache
    if (finalData && finalData.data && finalData.data.length > 0) {
      exerciseCache.set(cacheKey, { data: finalData, timestamp: Date.now() });
    }
    return res.json(finalData);
  } catch (error: any) {
    console.error("Exercise Search Error:", error);
    return res.json({
      success: true,
      data: [],
      meta: { hasNextPage: false, nextCursor: null }
    });
  }
});

// OSS Body Parts Route
router.get('/exercises/bodyparts', async (req, res) => {
  try {
    const cacheKey = 'bodyparts';
    const cached = exerciseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 24) {
      return res.json(cached.data);
    }

    // Static list as fallback/default for OSS since it's most stable
    const data = ["back", "cardio", "chest", "lower arms", "lower legs", "neck", "shoulders", "upper arms", "upper legs", "waist"];
    
    exerciseCache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Liveness Check Proxy
router.get('/exercises/liveness', async (req, res) => {
  try {
    const response = await fetch('https://db.exercisedb.io/api/v1/liveness', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug Ping
router.get('/ping', (req, res) => res.json({ message: 'pong', timestamp: Date.now() }));

// Generate clean SVG for exercises with no media
function generateExerciseSvg(name: string): string {
  const title = (name || 'Demonstração de Exercício').slice(0, 32);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'>
    <defs>
      <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='#09090b'/>
        <stop offset='50%' stop-color='#18181b'/>
        <stop offset='100%' stop-color='#09090b'/>
      </linearGradient>
      <linearGradient id='accent' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='#a855f7'/>
        <stop offset='100%' stop-color='#6366f1'/>
      </linearGradient>
    </defs>
    <rect width='600' height='600' fill='url(#bg)' rx='24'/>
    <circle cx='300' cy='240' r='85' fill='#a855f7' fill-opacity='0.08' stroke='#a855f7' stroke-opacity='0.3' stroke-width='2'/>
    <path d='M230 240 L370 240 M260 205 L260 275 M340 205 L340 275 M220 220 L220 260 M380 220 L380 260' stroke='url(#accent)' stroke-width='7' stroke-linecap='round'/>
    <text x='300' y='375' fill='#ffffff' font-family='system-ui, -apple-system, sans-serif' font-size='20' font-weight='800' text-anchor='middle' letter-spacing='0.5'>${title.toUpperCase()}</text>
    <text x='300' y='410' fill='#a855f7' font-family='system-ui, -apple-system, sans-serif' font-size='12' font-weight='700' text-anchor='middle' letter-spacing='2'>GUIA DE MOVIMENTO</text>
  </svg>`;
}

// Smart fallback resolver for exercise media
async function resolveExerciseMedia(exerciseName?: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!exerciseName) return null;

  const ptToEnMap: Record<string, string> = {
    'supino': 'bench press',
    'agachamento': 'squat',
    'levantamento terra': 'deadlift',
    'terra': 'deadlift',
    'desenvolvimento': 'shoulder press',
    'remada': 'row',
    'rosca': 'curl',
    'tríceps': 'triceps dip',
    'triceps': 'triceps dip',
    'bíceps': 'biceps curl',
    'biceps': 'biceps curl',
    'peito': 'chest press',
    'costas': 'back row',
    'ombro': 'shoulder press',
    'perna': 'leg press',
    'panturrilha': 'calf raise',
    'abdominal': 'crunch',
    'abdomen': 'crunch',
    'glúteo': 'glute bridge',
    'gluteo': 'glute bridge',
    'crucifixo': 'chest fly',
    'voador': 'chest fly',
    'elevação': 'raise',
    'extensão': 'extension',
    'flexão': 'pushup',
    'mergulho': 'dip',
    'puxada': 'pulldown'
  };

  let searchName = exerciseName.toLowerCase();
  for (const [pt, en] of Object.entries(ptToEnMap)) {
    if (searchName.includes(pt)) {
      searchName = searchName.replace(pt, en);
    }
  }

  const rawWords = searchName
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['extreme', 'variation', 'low', 'mini', 'micro', 'light', 'between', 'with', 'and', 'the', 'bars', 'high', 'male', 'female'].includes(w));

  if (rawWords.length === 0) return null;

  // 1. Search oss.exercisedb.dev with top 2 keywords
  const primaryQuery = rawWords.slice(0, 2).join(' ');
  try {
    const res = await fetch(`https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(primaryQuery)}&limit=15`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      let candidates = data.data || [];
      candidates = candidates.map((c: any) => {
        const cWords = c.name.toLowerCase().split(/\s+/);
        const score = rawWords.reduce((acc, w) => acc + (cWords.includes(w) ? 3 : (c.name.toLowerCase().includes(w) ? 1 : 0)), 0);
        return { ...c, score };
      }).sort((a: any, b: any) => b.score - a.score);

      for (const item of candidates) {
        if (!item.gifUrl) continue;
        try {
          const checkRes = await fetch(item.gifUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://exercisedb.io/' },
            signal: AbortSignal.timeout(3500)
          });
          if (checkRes.ok) {
            const ct = checkRes.headers.get('Content-Type') || '';
            if (ct.includes('image')) {
              const buf = await checkRes.arrayBuffer();
              return { buffer: Buffer.from(buf), contentType: ct };
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  // 2. Fallback to yuhonas exercise DB
  try {
    const allExercises = await getFullDbFromGithub();
    const match = allExercises.find((ex: any) => 
      rawWords.some(w => ex.name?.toLowerCase().includes(w)) && ex.images && ex.images.length > 0
    );
    if (match && match.images?.[0]) {
      const imgUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${match.images[0]}`;
      const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(4000) });
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        return { buffer: Buffer.from(buf), contentType: 'image/jpeg' };
      }
    }
  } catch (e) {}

  return null;
}

// GIF Proxy
router.get('/exercises/proxy-gif', async (req, res) => {
  try {
    const { url, name } = req.query;
    const imageUrl = (url as string) || '';
    const exerciseName = (name as string) || '';

    if (!imageUrl && !exerciseName) {
      return res.status(400).send('No URL or name provided');
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://exercisedb.io/'
    };

    // 1. Direct fetch if URL provided
    if (imageUrl && imageUrl.startsWith('http')) {
      try {
        const response = await fetch(imageUrl, { headers, signal: AbortSignal.timeout(4000) });
        const contentType = response.headers.get('Content-Type') || '';
        if (response.ok && contentType.includes('image')) {
          const buffer = await response.arrayBuffer();
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(Buffer.from(buffer));
        }
      } catch (e) {
        console.warn(`Direct fetch failed for ${imageUrl}, falling back...`);
      }
    }

    // 2. Try alternate mirrors if URL had a filename
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      if (fileName && (fileName.endsWith('.gif') || fileName.endsWith('.jpg') || fileName.endsWith('.png'))) {
        const mirrors = [
          `https://static.exercisedb.dev/media/${fileName}`,
          `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${fileName}`,
          `https://v2.exercisedb.io/media/${fileName}`,
          `https://db.exercisedb.io/media/${fileName}`,
          `https://oss.exercisedb.dev/media/${fileName}`
        ].filter(m => m !== imageUrl);

        for (const mirrorUrl of mirrors) {
          try {
            const mirrorRes = await fetch(mirrorUrl, { headers, signal: AbortSignal.timeout(3000) });
            const mCt = mirrorRes.headers.get('Content-Type') || '';
            if (mirrorRes.ok && mCt.includes('image')) {
              const buf = await mirrorRes.arrayBuffer();
              res.setHeader('Content-Type', mCt);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              return res.send(Buffer.from(buf));
            }
          } catch (e) {}
        }
      }
    }

    // 3. Smart exercise media resolver by name
    const queryName = exerciseName || imageUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    if (queryName) {
      const resolved = await resolveExerciseMedia(queryName);
      if (resolved) {
        res.setHeader('Content-Type', resolved.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(resolved.buffer);
      }
    }

    // 4. Clean SVG fallback
    const svg = generateExerciseSvg(exerciseName || 'Exercício');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(svg);
  } catch (error: any) {
    console.error("GIF Proxy Error:", error);
    const svg = generateExerciseSvg('Exercício');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }
});

// GIF Proxy by Name
router.get('/exercises/gif-by-name', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      const svg = generateExerciseSvg('Exercício');
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }
    
    const searchName = name as string;
    const resolved = await resolveExerciseMedia(searchName);
    if (resolved) {
      res.setHeader('Content-Type', resolved.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(resolved.buffer);
    }

    // Fallback styled SVG
    const svg = generateExerciseSvg(searchName);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(svg);
  } catch (error: any) {
    console.error("GIF by Name Error:", error);
    const svg = generateExerciseSvg('Exercício');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }
});

// Unsplash Proxy
router.get('/exercises/unsplash-image', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).send('No query provided');

    const cacheKey = `unsplash-${query}`;
    const cached = exerciseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 24) {
      return res.json(cached.data);
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      // Return a curated fallback image if no key is provided
      const fallbacks = [
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600', // gym
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600', // dumbbells
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600', // core
      ];
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ url: randomFallback });
    }

    console.log(`Searching Unsplash for: ${query}`);
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query as string)}&per_page=1&orientation=squarish`, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.results?.[0]?.urls?.regular || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600';
    
    const result = { url: imageUrl };
    exerciseCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    res.json(result);
  } catch (error: any) {
    console.error("Unsplash Search Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// No fallthrough - let server.ts handle it
export default router;
