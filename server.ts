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
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
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
