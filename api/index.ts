import express from "express";
import Stripe from "stripe";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

// Lazy Initialize Firebase Admin
let dbInstance: FirebaseFirestore.Firestore | null = null;

function getDb() {
  if (!dbInstance) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const serviceAccount = JSON.parse(keyString);
        initializeApp({
          credential: cert(serviceAccount)
        });
      } else {
        initializeApp();
      }
      dbInstance = getFirestore();
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
      throw new Error("Failed to initialize Firebase Admin. Check FIREBASE_SERVICE_ACCOUNT_KEY.");
    }
  }
  return dbInstance;
}

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

const app = express();

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
    const plan = session.metadata?.plan || "PRO";

    if (userId) {
      try {
        const database = getDb();
        await database.collection("users").doc(userId).set({
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
    
    // Use req.headers.origin or host for the redirect URLs
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/checkout?plan=${plan}&canceled=true`,
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

export default app;
