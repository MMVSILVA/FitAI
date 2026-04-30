import express from 'express';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error("STRIPE_SECRET_KEY is undefined in process.env");
      throw new Error("A chave secreta do Stripe (STRIPE_SECRET_KEY) não foi configurada. Verifique as configurações do projeto.");
    }
    stripeClient = new Stripe(key, { apiVersion: '2024-06-20' as any });
  }
  return stripeClient;
}

export const createCheckoutSession = async (req: express.Request, res: express.Response) => {
  try {
    const { plan, userId, userEmail } = req.body;
    const stripe = getStripe();

    let priceId = "";
    if (plan === "PROFESSIONAL") priceId = process.env.STRIPE_PRICE_ID_PROFESSIONAL || "";
    else if (plan === "PREMIUM") priceId = process.env.STRIPE_PRICE_ID_PREMIUM || "";
    else priceId = process.env.STRIPE_PRICE_ID_PRO || "";

    if (!priceId) {
      console.error(`Price ID missing for plan ${plan}. Checked envs: STRIPE_PRICE_ID_PROFESSIONAL, STRIPE_PRICE_ID_PREMIUM, STRIPE_PRICE_ID_PRO`);
      return res.status(500).json({ 
        error: `O ID do preço no Stripe (${plan}) não foi configurado nas variáveis de ambiente do servidor.` 
      });
    }

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/checkout?plan=${plan}&canceled=true`,
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: { plan }
    });

    res.json({ url: session.url });
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
      const userId = session.client_reference_id;
      const plan = session.metadata?.plan;
      const stripeSubscriptionId = session.subscription as string;

      if (userId && plan && stripeSubscriptionId) {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
        
        const { getAdminDb } = await import('../lib/firebase-admin.ts');
        const db = getAdminDb();
        
        // Use Stripe's actual period end
        const subscriptionEndsAt = new Date(subscription.current_period_end * 1000);

        await db.collection('users').doc(userId).update({
          planType: plan,
          role: plan === 'PROFESSIONAL' ? 'trainer' : (plan === 'PREMIUM' ? 'premium_user' : 'user'),
          isPremium: true,
          stripeSubscriptionId,
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Plan ${plan} activated for user ${userId}. Expires at ${subscriptionEndsAt.toISOString()}`);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const { getAdminDb } = await import('../lib/firebase-admin.ts');
      const db = getAdminDb();
      
      const usersSnap = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();
      if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        await userDoc.ref.update({
          planType: 'FREE',
          isPremium: false,
          subscriptionEndsAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`Subscription deleted for user ${userDoc.id}`);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
