import express from 'express';
import * as paymentController from '../controllers/paymentController.ts';
import * as aiController from '../controllers/aiController.ts';
import { isAdminEmail } from '../config/admins.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = express.Router({
  caseSensitive: false,
  mergeParams: true
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

// AI Routes
router.post('/ai/generate-plan', authMiddleware, aiController.generatePlan);
router.post('/ai/translate', authMiddleware, aiController.translateExercise);

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
    const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json', {
      signal: AbortSignal.timeout(15000)
    });
    if (response.ok) {
      const data = await response.json();
      fullExerciseDb = Array.isArray(data) ? data : [];
      lastDbFetch = Date.now();
      console.log(`Successfully cached ${fullExerciseDb.length} exercises from GitHub.`);
      return fullExerciseDb;
    }
  } catch (e) {
    console.error("Failed to fetch full DB from GitHub:", e);
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
    
    // Quick translation for common terms
    const ptToEn: Record<string, string> = {
      'peito': 'chest',
      'costas': 'back',
      'perna': 'leg',
      'ombro': 'shoulder',
      'ombras': 'shoulder',
      'braço': 'arm',
      'braços': 'arm',
      'abdominal': 'abs',
      'abdominais': 'abs',
      'bíceps': 'biceps',
      'tríceps': 'triceps',
      'glúteo': 'glute',
      'glúteos': 'glute',
      'panturrilha': 'calf'
    };
    
    if (name && typeof name === 'string') {
      const lower = name.toLowerCase().trim();
      if (ptToEn[lower]) {
        console.log(`Translating search: ${name} -> ${ptToEn[lower]}`);
        name = ptToEn[lower];
      }
    }

    const cacheKey = `search-${name}-${limit}-${cursor}`;

    // Check cache
    const cached = exerciseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Serving from cache: ${cacheKey}`);
      return res.json(cached.data);
    }

    const mirrors = [
      'https://exercisedblist.vercel.app/api/v1/exercises',
      'https://oss.exercisedb.dev/api/v1/exercises',
      'https://v2.exercisedb.io/api/v1/exercises',
      'https://v1.exercisedb.io/api/v1/exercises',
      'https://db.exercisedb.io/api/v1/exercises'
    ];

    let finalData = null;
    let lastError = null;

    for (const base of mirrors) {
      try {
        const searchStrategies = [];
        
        // Strategy 1: Path based /name/{name}
        if (name) {
          searchStrategies.push(`${base}/name/${encodeURIComponent(name as string)}`);
        }
        
        // Strategy 2: Query param based ?name={name}
        const params = new URLSearchParams();
        params.append('limit', limitNum.toString());
        if (cursor) params.append('cursor', cursor as string);
        if (name) params.append('name', name as string);
        searchStrategies.push(`${base}?${params.toString()}`);
        
        if (!name) {
          searchStrategies.push(`${base}?limit=${limitNum}${cursor ? `&cursor=${cursor}` : ''}`);
        }

        for (const ossUrl of searchStrategies) {
          console.log(`Trying strategy: ${ossUrl}`);
          try {
            const response = await fetch(ossUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FitnessApp/1.0',
                'Accept': 'application/json',
                'Referer': 'https://exercisedb.io/'
              },
              signal: AbortSignal.timeout(8000)
            });

            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
              const textData = await response.text();
              try {
                const data = JSON.parse(textData);
                const rawData = data.success ? (data.data || []) : (Array.isArray(data) ? data : []);
                
                if (rawData.length > 0 || (!name && Array.isArray(rawData))) { 
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
                  break;
                }
              } catch (parseError) {
                console.warn(`Failed to parse JSON from ${ossUrl}:`, textData.substring(0, 100));
              }
            } else {
              console.warn(`Mirror strategy ${ossUrl} failed or returned non-JSON. Status: ${response.status}, Content-Type: ${contentType}`);
            }
          } catch (strategyError) {
            console.warn(`Strategy failed: ${ossUrl}`, (strategyError as any).message);
          }
        }
        
        if (finalData) break;
      } catch (e: any) {
        lastError = e;
        console.warn(`Mirror ${base} failed entirely:`, e.message);
      }
    }

    // MEGA FALLBACK: Local Filtering of GitHub Dump
    if (!finalData) {
      console.log("All mirrors failed. Using Mega Fallback (GitHub Dump)...");
      const allExercises = await getFullDbFromGithub();
      if (allExercises && allExercises.length > 0) {
        let filtered = allExercises;
        if (name) {
          const searchLower = (name as string).toLowerCase();
          filtered = allExercises.filter(ex => 
            ex.name?.toLowerCase().includes(searchLower) || 
            ex.bodyPart?.toLowerCase().includes(searchLower) ||
            ex.target?.toLowerCase().includes(searchLower) ||
            ex.equipment?.toLowerCase().includes(searchLower) ||
            (Array.isArray(ex.bodyParts) && ex.bodyParts.some((p: string) => p.toLowerCase().includes(searchLower)))
          );
        }

        // Handle pagination locally
        const startIndex = cursor ? parseInt(cursor as string) : 0;
        const pageData = filtered.slice(startIndex, startIndex + limitNum);
        
        const normalizedData = pageData.map((item: any) => ({
          exerciseId: item.id || item.exerciseId || `ex-${Math.random().toString(36).substr(2, 9)}`,
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
          meta: { 
            hasNextPage: startIndex + limitNum < filtered.length, 
            nextCursor: (startIndex + limitNum < filtered.length) ? (startIndex + limitNum).toString() : null 
          }
        };
      }
    }

    if (!finalData) {
      if (lastError) throw lastError;
      return res.status(503).json({ success: false, error: 'All exercise mirrors are unavailable' });
    }

    // Save to cache
    exerciseCache.set(cacheKey, { data: finalData, timestamp: Date.now() });
    res.json(finalData);
  } catch (error: any) {
    console.error("Exercise Search Error:", error);
    res.status(500).json({ success: false, error: error.message });
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

// GIF Proxy
router.get('/exercises/proxy-gif', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL provided');
    
    const imageUrl = url as string;
    console.log(`Proxying GIF: ${imageUrl}`);
    
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    let response = await fetch(imageUrl, { headers });
    
    // If it's an ExerciseDB-style URL, try common mirrors
    if (imageUrl.includes('exercisedb') || imageUrl.includes('media') || !response.ok) {
      const fileName = imageUrl.split('/').pop();
      if (fileName && fileName.endsWith('.gif')) {
        const mirrors = [
          `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${fileName}`,
          `https://v2.exercisedb.io/media/${fileName}`,
          `https://db.exercisedb.io/media/${fileName}`,
          `https://oss.exercisedb.dev/media/${fileName}`,
          `https://fitness-program-api.herokuapp.com/media/${fileName}`,
        ].filter(m => m !== imageUrl);

        for (const mirrorUrl of mirrors) {
          console.log(`Trying alternate mirror: ${mirrorUrl}`);
          try {
            // Increase timeout slightly to 5s and add more specific headers
            const mirrorResponse = await fetch(mirrorUrl, { 
              headers: {
                ...headers,
                'Referer': 'https://exercisedb.io/'
              }, 
              signal: AbortSignal.timeout(5000) 
            });
            
            if (mirrorResponse.ok) {
              const mContentType = mirrorResponse.headers.get('Content-Type');
              if (mContentType && mContentType.includes('image')) {
                response = mirrorResponse;
                console.log(`Success with mirror: ${mirrorUrl}`);
                break;
              }
            }
          } catch (e) {
            console.warn(`Mirror failed or timed out: ${mirrorUrl}`);
          }
        }
      }
    }
    
    // Check if the resulting response is actually an image/gif
    const contentType = response.headers.get('Content-Type');
    if (!response.ok || (contentType && !contentType.includes('image'))) {
      console.warn(`GIF Proxy Final Error [${response.status}] for ${imageUrl}. Content-Type: ${contentType}`);
      
      // Ultra-fallback: try searching by ID on Bodybuilding.com or similar if we can parse it
      // But for now, let's just use a better placeholder
      return res.redirect('https://placehold.co/400x400/000000/666666?text=Imagem+Nao+Disponivel');
    }
    
    const buffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error("GIF Proxy Error:", error);
    res.status(500).send(error.message);
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
