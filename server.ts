import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import apiRoutes from "./src/server/routes/index.ts";
import { handleWebhook } from "./src/server/controllers/paymentController.ts";

const app = express();

// Stripe Webhook MUST stay before general JSON middleware to receive raw body
app.post("/api/webhook", express.raw({ type: "application/json" }), handleWebhook);

// direct root health check
app.get("/healthz", (req, res) => res.json({ status: "OK", timestamp: "2026-04-29T17:53", version: "1.0.4" }));

// General Middleware
app.use(express.json());

// API Routes
app.use("/api", (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.url}`);
  next();
}, apiRoutes);

async function startServer() {
  const PORT = process.env.PORT || 3000;

  // Vite integration for dev/prod
  console.log(`Starting FITAI in ${process.env.NODE_ENV || 'development'} mode`);
  
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          port: 3000
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware loaded");
    } catch (viteError) {
      console.error("Failed to load Vite middleware:", viteError);
      // Fallback to static if vite fails but dist exists
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html: ${err.message}`);
          res.status(500).send("Error loading app assets. Please run build.");
        }
      });
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`FITAI Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
