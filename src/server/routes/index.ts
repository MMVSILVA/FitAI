import express from 'express';
import * as paymentController from '../controllers/paymentController.ts';

const router = express.Router({
  caseSensitive: false,
  mergeParams: true
});

// Debug middleware for the router
router.use((req, res, next) => {
  console.log(`Router Level Match: ${req.url}`);
  next();
});

// Simple in-memory cache for exercise searches
const exerciseCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Core routes
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// ExerciseDB Proxy (avoids CORS)
router.get('/exercises/search', async (req, res) => {
  try {
    const { name, limit, cursor } = req.query;
    const cacheKey = `search-${name}-${limit}-${cursor}`;

    // Check cache
    const cached = exerciseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Serving from cache: ${cacheKey}`);
      return res.json(cached.data);
    }

    // Use a more stable mirror for OSS API
    let ossUrl = 'https://db.exercisedb.io/api/v1/exercises';
    const params = new URLSearchParams();
    params.append('limit', (limit as string) || '20');
    if (name) params.append('name', name as string);
    if (cursor) params.append('cursor', cursor as string);
    
    ossUrl = `${ossUrl}?${params.toString()}`;
    
    console.log(`Fetching from OSS API: ${ossUrl}`);
    const response = await fetch(ossUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 404) {
      console.warn(`OSS API returned 404 for ${ossUrl}. This usually means no results or wrong endpoint.`);
      // Return empty data instead of erroring out to keep UI clean
      return res.json({ success: true, data: [], meta: { hasNextPage: false, nextCursor: null } });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OSS API Error [${response.status}]:`, errorText);
      throw new Error(`Upstream error: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize data for the frontend interface
    const rawData = data.success ? (data.data || []) : [];
    const normalizedData = rawData.map((item: any) => ({
      exerciseId: item.exerciseId || item.id,
      name: item.name,
      gifUrl: item.gifUrl,
      bodyParts: Array.isArray(item.bodyParts) ? item.bodyParts : [item.bodyPart || 'other'],
      equipments: Array.isArray(item.equipments) ? item.equipments : [item.equipment || 'none'],
      targetMuscles: Array.isArray(item.targetMuscles) ? item.targetMuscles : [item.target || 'various'],
      secondaryMuscles: item.secondaryMuscles || [],
      instructions: item.instructions || []
    }));

    const finalData = {
      success: true,
      data: normalizedData,
      meta: data.meta || {
        hasNextPage: false,
        nextCursor: null
      }
    };

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
    
    // If 404 and it's an ExerciseDB-style URL, try common mirrors
    if (!response.ok && response.status === 404 && (imageUrl.includes('exercisedb') || imageUrl.includes('media'))) {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const mirrors = [
          `https://v2.exercisedb.io/media/${fileName}`,
          `https://oss.exercisedb.dev/media/${fileName}`,
          `https://g.static-all-about-fitness.com/media/${fileName}`,
          `https://db.exercisedb.io/media/${fileName}`,
          `https://verve-static.s3.amazonaws.com/media/${fileName}`,
          `https://edb-static-prod.s3.amazonaws.com/media/exercises/gifs/${fileName}`,
          `https://fitness-program-api.herokuapp.com/media/${fileName}`,
          `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${fileName}`,
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

// Catch-all for /api specifically to debug why it falls through
router.use((req, res) => {
  console.log(`API 404 fallthrough: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: 'API Route not found', 
    requestedPath: req.originalUrl,
    availableRoutes: ['/exercises/search', '/exercises/bodyparts', '/exercises/liveness', '/ping']
  });
});

export default router;
