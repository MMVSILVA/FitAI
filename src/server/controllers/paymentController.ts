import { Request, Response } from 'express';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY missing");
    stripeClient = new Stripe(key, { apiVersion: '2024-06-20' as any });
  }
  return stripeClient;
}

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { plan, userId, email } = req.body;
    const stripe = getStripe();

    const priceId = plan === "PREMIUM" 
      ? process.env.STRIPE_PRICE_ID_PREMIUM 
      : process.env.STRIPE_PRICE_ID_PRO;

    if (!priceId) return res.status(500).json({ error: "Preço não configurado" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.protocol}://${req.get("host")}/dashboard?success=true`,
      cancel_url: `${req.protocol}://${req.get("host")}/checkout?plan=${plan}&canceled=true`,
      client_reference_id: userId,
      customer_email: email,
      metadata: { plan }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
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

      if (userId && plan) {
        const { getAdminDb } = await import('../lib/firebase-admin');
        const db = getAdminDb();
        
        const subscriptionEndsAt = new Date();
        subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

        await db.collection('users').doc(userId).update({
          planType: plan,
          role: plan === 'PREMIUM' ? 'premium_user' : 'user',
          isPremium: true,
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Plan ${plan} activated for user ${userId}. Expires at ${subscriptionEndsAt.toISOString()}`);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
