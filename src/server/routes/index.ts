import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';

const router = Router();

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Core routes
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// ExerciseDB Proxy (avoids CORS)
router.get('/exercises/search', async (req, res) => {
  try {
    const { name, limit, cursor } = req.query;
    let searchUrl = `https://oss.exercisedb.dev/api/v1/exercises?limit=${limit || 10}`;
    if (name) searchUrl += `&name=${encodeURIComponent(name as string)}`;
    if (cursor) searchUrl += `&cursor=${cursor}`;

    const response = await fetch(searchUrl);
    const data = await response.json();
    
    // Ensure the response follows the format expected by the frontend
    if (data && typeof data === 'object' && !Array.isArray(data) && 'success' in data) {
      res.json(data);
    } else {
      // Format as the expected structure if the upstream API returns something else (like just an array)
      res.json({
        success: true,
        data: Array.isArray(data) ? data : (data.data || []),
        meta: data.meta || {
          hasNextPage: false,
          nextCursor: null
        }
      });
    }
  } catch (error: any) {
    console.error("Exercise Search Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Liveness Check Proxy
router.get('/exercises/liveness', async (req, res) => {
  try {
    const response = await fetch('https://oss.exercisedb.dev/api/v1/liveness');
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
    
    const response = await fetch(url as string);
    const buffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

export default router;
