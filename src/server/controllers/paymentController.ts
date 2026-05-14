import express from 'express';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  const rawKey = process.env.STRIPE_SECRET_KEY;
  if (!rawKey) {
    console.error("STRIPE_SECRET_KEY is undefined in process.env");
    throw new Error("A chave secreta do Stripe (STRIPE_SECRET_KEY) não foi configurada nas variáveis de ambiente do servidor.");
  }
  
  let key = rawKey.trim();
  
  // Tenta extrair a chave real caso o usuário tenha colado texto extra (ex: "Chave: sk_...")
  const match = key.match(/(sk_|rk_)[a-zA-Z0-9_]{15,}/);
  if (match) {
    key = match[0];
  } else if (key.startsWith('mk_')) {
    key = 'rk_' + key.substring(3);
  }
  
  // Se a chave mudou ou o cliente ainda não existe, cria um novo
  if (!stripeClient) {
    const censored = `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
    console.log(`Initializing Stripe with key: ${censored}`);
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' as any });
  }
  
  return stripeClient;
}

function cleanPriceId(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  const match = cleaned.match(/(price_|prod_)[a-zA-Z0-9_]{10,}/);
  return match ? match[0] : cleaned;
}

export const createCheckoutSession = async (req: express.Request, res: express.Response) => {
  try {
    const { plan, userId, userEmail } = req.body;
    const stripe = getStripe();

    let rawPriceId = "";
    let envVarName = "";
    
    const normalizedPlan = (plan === "PROFESSIONAL" || plan === "PROFISSIONAL") ? "PROFISSIONAL" : plan;

    if (normalizedPlan === "PROFISSIONAL") {
      rawPriceId = process.env.STRIPE_PRICE_ID_PROFISSIONAL || "price_1TRe4MCVEgijuso4xhL6gSpn";
      envVarName = "STRIPE_PRICE_ID_PROFISSIONAL";
    } else if (normalizedPlan === "PREMIUM") {
      rawPriceId = process.env.STRIPE_PRICE_ID_PREMIUM || "price_1TOm3CCVEgijuso4h63UP1b3";
      envVarName = "STRIPE_PRICE_ID_PREMIUM";
    } else {
      rawPriceId = process.env.STRIPE_PRICE_ID_PRO || "price_1TOm2UCVEgijuso4yuRkIuoC";
      envVarName = "STRIPE_PRICE_ID_PRO";
    }

    const priceId = cleanPriceId(rawPriceId);

    if (!priceId) {
      console.error(`Price ID missing for plan ${normalizedPlan}. Checked env: ${envVarName}`);
      return res.status(500).json({ 
        error: `O ID do preço (${envVarName}) não foi configurado nas variáveis de ambiente do servidor.` 
      });
    }

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const referer = req.headers["referer"];
    
    // Preferred base URL from environment or Referer or calculated
    let baseUrl = process.env.CLIENT_URL;
    
    if (!baseUrl && referer) {
        try {
            const refUrl = new URL(referer);
            baseUrl = `${refUrl.protocol}//${refUrl.host}`;
        } catch (e) {
            console.warn("Could not parse Referer for baseUrl:", referer);
        }
    }
    
    if (!baseUrl) {
        baseUrl = `${protocol}://${host}`;
    }

    console.log(`Creating checkout session for plan ${normalizedPlan}. Base URL: ${baseUrl}`);

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "boleto"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${baseUrl}/dashboard?success=true`,
        cancel_url: `${baseUrl}/checkout?plan=${normalizedPlan}&canceled=true`,
        client_reference_id: userId,
        customer_email: userEmail,
        metadata: { plan: normalizedPlan }
      });

      console.log(`Checkout session created successfully: ${session.id}`);
      res.json({ url: session.url });
    } catch (stripeError: any) {
      console.error(`Stripe specific error: ${stripeError.message}`, stripeError);
      throw stripeError;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: express.Request, res: express.Response) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) return res.status(400).send("Missing sig/secret");

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(req.body, sig as any, endpointSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      let userId = session.client_reference_id;
      const userEmail = session.customer_details?.email;
      const plan = session.metadata?.plan;
      const stripeSubscriptionId = session.subscription as string;

      if ((userId || userEmail) && plan && stripeSubscriptionId) {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
        
        const { getAdminDb } = await import('../lib/firebase-admin.ts');
        const db = getAdminDb();
        
        if (!userId && userEmail) {
          const usersSnap = await db.collection('users').where('email', '==', userEmail).get();
          if (!usersSnap.empty) {
            userId = usersSnap.docs[0].id;
          }
        }

        const subscriptionEndsAt = new Date(subscription.current_period_end * 1000);
        const dbPlan = (plan === 'PROFESSIONAL' || plan === 'PROFISSIONAL') ? 'PROFISSIONAL' : plan;
        
        const dataToUpdate = {
          planType: dbPlan,
          role: (dbPlan === 'PROFISSIONAL') ? 'trainer' : (dbPlan === 'PREMIUM' ? 'premium_user' : 'user'),
          isPremium: true,
          stripeSubscriptionId,
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (userId) {
          await db.collection('users').doc(userId).update(dataToUpdate);
        } else if (userEmail) {
          await db.collection('users').doc(`pending_${userEmail}`).set({
            ...dataToUpdate,
            email: userEmail,
            isPendingActivation: true
          });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const { getAdminDb } = await import('../lib/firebase-admin.ts');
      const db = getAdminDb();
      
      const usersSnap = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();
      if (!usersSnap.empty) {
        await usersSnap.docs[0].ref.update({
          planType: 'FREE',
          isPremium: false,
          subscriptionEndsAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
