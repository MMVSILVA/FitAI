import express from 'express';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error("STRIPE_SECRET_KEY is undefined in process.env");
      throw new Error("A chave secreta do Stripe (STRIPE_SECRET_KEY) não foi configurada nas variáveis de ambiente do servidor.");
    }
    
    // Validação básica do formato da chave
    if (!key.startsWith('sk_') && !key.startsWith('rk_')) {
      console.error("STRIPE_SECRET_KEY invalid format. Must start with sk_ or rk_");
      throw new Error("A chave do Stripe configurada é inválida. Chaves secretas devem começar com 'sk_' e chaves restritas com 'rk_'. Verifique suas variáveis de ambiente.");
    }

    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' as any });
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

    if (priceId.startsWith('prod_')) {
      console.error(`Product ID provided instead of Price ID: ${priceId}`);
      return res.status(400).json({
        error: `Você forneceu um ID de Produto (${priceId}) em vez de um ID de Preço. No Stripe, chaves que começam com 'prod_' são produtos. Por favor, use o ID do Preço associado (que começa com 'price_').`
      });
    }

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "boleto"],
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
      let userId = session.client_reference_id;
      const userEmail = session.customer_details?.email;
      const plan = session.metadata?.plan;
      const stripeSubscriptionId = session.subscription as string;

      if ((userId || userEmail) && plan && stripeSubscriptionId) {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
        
        const { getAdminDb } = await import('../lib/firebase-admin.ts');
        const db = getAdminDb();
        
        // If userId is missing, try to find user by email
        if (!userId && userEmail) {
          const usersSnap = await db.collection('users').where('email', '==', userEmail).get();
          if (!usersSnap.empty) {
            userId = usersSnap.docs[0].id;
            console.log(`Found user ${userId} by email ${userEmail} for plan activation.`);
          }
        }

        const subscriptionEndsAt = new Date(subscription.current_period_end * 1000);
        const dataToUpdate = {
          planType: plan,
          role: plan === 'PROFESSIONAL' ? 'trainer' : (plan === 'PREMIUM' ? 'premium_user' : 'user'),
          isPremium: true,
          stripeSubscriptionId,
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (userId) {
          await db.collection('users').doc(userId).update(dataToUpdate);
          console.log(`Plan ${plan} activated for existing user ${userId}.`);
        } else if (userEmail) {
          // Create placeholder for guest payment
          await db.collection('users').doc(`pending_${userEmail}`).set({
            ...dataToUpdate,
            email: userEmail,
            isPendingActivation: true
          });
          console.log(`Created placeholder activation for guest ${userEmail}.`);
        }
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
