import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import * as paymentController from "./src/server/controllers/paymentController.ts";
import apiRoutes from "./src/server/routes/index.ts";

const app = express();

app.use(cors());

// IMPORTANT: Stripe Webhook MUST stay before express.json()
app.post("/api/webhook", express.raw({ type: "application/json" }), paymentController.handleWebhook);

// General Middleware
app.use(express.json());

// API routes logger
app.use("/api", (req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.path} | Query: ${JSON.stringify(req.query)}`);
  next();
});

// Direct payment route to avoid router issues and ensure it's caught
app.post("/api/create-checkout-session", async (req, res) => {
  console.log("MATCHED POST /api/create-checkout-session in server.ts");
  try {
    const { createCheckoutSession } = await import("./src/server/controllers/paymentController.ts");
    await createCheckoutSession(req, res);
  } catch (err: any) {
    console.error("Error in direct payment route:", err);
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", apiRoutes);

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
