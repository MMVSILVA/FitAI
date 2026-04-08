import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
// If FIREBASE_SERVICE_ACCOUNT_KEY is provided, use it. Otherwise, initialize without credentials (might fail if not in GCP)
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    initializeApp();
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const db = getFirestore();

// Lazy Initialize Stripe
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2024-06-20" as any,
    });
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhook endpoint needs raw body
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).send("Missing signature or secret");
    }

    let event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      
      // Get plan from metadata
      const plan = session.metadata?.plan || "PRO";

      if (userId) {
        try {
          await db.collection("users").doc(userId).set({
            planType: plan,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          console.log(`Successfully updated user ${userId} to plan ${plan}`);
        } catch (error) {
          console.error("Error updating user in Firestore:", error);
        }
      }
    }

    res.json({ received: true });
  });

  // Standard middleware for other routes
  app.use(express.json());

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { plan, userId, email } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const priceId = plan === "PREMIUM" 
        ? process.env.STRIPE_PRICE_ID_PREMIUM 
        : process.env.STRIPE_PRICE_ID_PRO;

      if (!priceId) {
        return res.status(500).json({ error: "Price ID not configured" });
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get("host")}/dashboard?success=true`,
        cancel_url: `${req.protocol}://${req.get("host")}/checkout?plan=${plan}&canceled=true`,
        client_reference_id: userId,
        customer_email: email,
        metadata: {
          plan: plan
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
