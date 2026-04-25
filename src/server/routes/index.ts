import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.ts';

const router = Router();

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

    // Use only OSS API
    let ossUrl = `https://oss.exercisedb.dev/api/v1/exercises?limit=${limit || 10}`;
    if (name) ossUrl += `&name=${encodeURIComponent(name as string)}`;
    if (cursor) ossUrl += `&cursor=${cursor}`;
    
    console.log(`Fetching from OSS API: ${ossUrl}`);
    const response = await fetch(ossUrl);
    
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
    const response = await fetch('https://oss.exercisedb.dev/api/v1/liveness');
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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

    const response = await fetch(imageUrl, { headers });
    
    if (!response.ok) {
      console.warn(`GIF Proxy Upstream Error [${response.status}] for ${imageUrl}`);
      return res.redirect('https://placehold.co/400x300?text=Exercise+GIF+Not+Found');
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

export default router;
