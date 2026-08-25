import express from 'express';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
let lastKey: string | null = null;

const DEFAULT_PRO_PAYMENT_LINK = "https://buy.stripe.com/3cIbJ0aC423f65b6Vd4wM02";

function isValidStripeKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.replace(/^["']|["']$/g, '').trim();
  if (trimmed.includes('*') || trimmed.includes('...') || trimmed.length < 25) return false;
  return trimmed.startsWith('sk_') || trimmed.startsWith('rk_');
}

function getStripe(): Stripe {
  const envKey = process.env.STRIPE_SECRET_KEY;

  if (!envKey || !isValidStripeKey(envKey)) {
    throw new Error("A chave secreta do Stripe (STRIPE_SECRET_KEY) não foi configurada ou é inválida.");
  }

  const trimmed = envKey.replace(/^["']|["']$/g, '').trim();
  const match = trimmed.match(/(sk_|rk_)[a-zA-Z0-9_]{15,}/);
  const keyToUse = match ? match[0] : trimmed;

  // Se a chave mudou ou o cliente ainda não existe, cria um novo
  if (!stripeClient || keyToUse !== lastKey) {
    const censored = `${keyToUse.substring(0, 7)}...${keyToUse.substring(keyToUse.length - 4)}`;
    console.log(`Initializing Stripe with key: ${censored}`);
    stripeClient = new Stripe(keyToUse, { apiVersion: '2023-10-16' as any });
    lastKey = keyToUse;
  }
  
  return stripeClient;
}

function getFallbackPaymentLink(plan: string, userId?: string, userEmail?: string): string | null {
  const normalizedPlan = (plan === "PROFESSIONAL" || plan === "PROFISSIONAL") ? "PROFISSIONAL" : plan;
  let link = "";
  if (normalizedPlan === "PROFISSIONAL") {
    link = process.env.VITE_STRIPE_LINK_PROFISSIONAL || process.env.STRIPE_LINK_PROFISSIONAL || "";
  } else if (normalizedPlan === "PREMIUM") {
    link = process.env.VITE_STRIPE_LINK_PREMIUM || process.env.STRIPE_LINK_PREMIUM || "";
  } else {
    link = process.env.VITE_STRIPE_LINK_PRO || process.env.STRIPE_LINK_PRO || "";
  }

  link = link.trim();
  if (!link || link.includes("your_") || link.includes("example") || link.includes("test_14A8w") || (!link.startsWith('http://') && !link.startsWith('https://'))) {
    if (normalizedPlan === "PRO") {
      link = DEFAULT_PRO_PAYMENT_LINK;
    } else {
      return null;
    }
  }

  const separator = link.includes('?') ? '&' : '?';
  let fullUrl = link;
  if (userId) fullUrl += `${separator}client_reference_id=${encodeURIComponent(userId)}`;
  if (userEmail) {
    const emailSep = fullUrl.includes('?') ? '&' : '?';
    fullUrl += `${emailSep}prefilled_email=${encodeURIComponent(userEmail)}`;
  }
  return fullUrl;
}

function cleanPriceId(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  const match = cleaned.match(/(price_|prod_)[a-zA-Z0-9_]{10,}/);
  return match ? match[0] : cleaned;
}

export const createCheckoutSession = async (req: express.Request, res: express.Response) => {
  const { plan, userId, userEmail } = req.body;
  const normalizedPlan = (plan === "PROFESSIONAL" || plan === "PROFISSIONAL") ? "PROFISSIONAL" : (plan || "PRO").toUpperCase();

  // Plan blocking: Only FREE and PRO are active. PREMIUM and PROFISSIONAL are Coming Soon (Em Breve).
  if (normalizedPlan === "PREMIUM" || normalizedPlan === "PROFISSIONAL") {
    return res.status(400).json({ 
      error: "Os planos Premium e Profissional estarão disponíveis em breve. No momento, o plano PRO é o plano ativo oficial do FitAI.",
      isComingSoon: true
    });
  }

  try {
    const envKey = process.env.STRIPE_SECRET_KEY;
    const hasValidKey = envKey && isValidStripeKey(envKey);

    // Se a chave da API não estiver ativa mas houver link direto configurado, use o link direto perfeitamente
    if (!hasValidKey) {
      const fallbackUrl = getFallbackPaymentLink(normalizedPlan, userId, userEmail);
      if (fallbackUrl) {
        console.log(`[Payment] Redirecionando para Link de Pagamento Direto do Stripe: ${fallbackUrl}`);
        return res.json({ url: fallbackUrl, fallback: true });
      }
      return res.status(400).json({ 
        error: "A chave do Stripe ou link de pagamento não foram configurados.",
        isKeyError: true
      });
    }

    const stripe = getStripe();

    let rawPriceId = process.env.STRIPE_PRICE_ID_PRO || "price_1TGqxLCerzmt0lUIK5KJOUIE";
    let envVarName = "STRIPE_PRICE_ID_PRO";

    const priceId = cleanPriceId(rawPriceId);

    if (!priceId) {
      console.error(`Price ID missing for plan ${normalizedPlan}. Checked env: ${envVarName}`);
      const fallbackUrl = getFallbackPaymentLink(normalizedPlan, userId, userEmail);
      if (fallbackUrl) {
        return res.json({ url: fallbackUrl, fallback: true });
      }
      return res.status(400).json({ 
        error: `O ID do preço (${envVarName}) ou o link direto de pagamento (VITE_STRIPE_LINK_PRO) não foram configurados nas variáveis de ambiente.` 
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

    console.log(`Creating checkout session for plan ${normalizedPlan}. Base URL: ${baseUrl}, Price: ${priceId}`);

    const baseSessionConfig: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/checkout?plan=${normalizedPlan}&canceled=true`,
      metadata: { plan: normalizedPlan, userId: userId || "" }
    };

    if (userId) {
      baseSessionConfig.client_reference_id = userId;
    }
    if (userEmail && userEmail.trim().includes('@')) {
      baseSessionConfig.customer_email = userEmail.trim();
    }

    try {
      // First attempt with subscription mode
      let session: Stripe.Checkout.Session;
      try {
        session = await stripe.checkout.sessions.create({
          ...baseSessionConfig,
          mode: "subscription"
        });
      } catch (subErr: any) {
        // If price is a one-time product rather than recurring subscription, retry with payment mode
        if (
          subErr.message?.includes('recurring') || 
          subErr.message?.includes('mode') || 
          subErr.message?.includes('one-time')
        ) {
          console.warn("Retrying with mode='payment' as price may be one-time:", subErr.message);
          session = await stripe.checkout.sessions.create({
            ...baseSessionConfig,
            mode: "payment"
          });
        } else {
          throw subErr;
        }
      }

      console.log(`Checkout session created successfully: ${session.id}`);
      res.json({ url: session.url });
    } catch (stripeError: any) {
      console.error(`Stripe specific error: ${stripeError.message}`, stripeError);
      
      const fallbackUrl = getFallbackPaymentLink(normalizedPlan, userId, userEmail);
      if (fallbackUrl) {
        console.warn(`Stripe session creation failed (${stripeError.message}). Using direct payment link fallback.`);
        return res.json({ url: fallbackUrl, fallback: true });
      }

      if (stripeError.type === 'StripeAuthenticationError' || stripeError.rawType === 'invalid_request_error') {
        return res.status(401).json({ 
          error: "Erro de Autenticação no Stripe: A chave secreta fornecida é inválida ou foi copiada mascarada (com asteriscos). Acesse o Stripe Dashboard > Desenvolvedores > Chaves de API, revele a chave completa e configure em Settings.",
          isKeyError: true
        });
      }
      
      return res.status(500).json({ error: stripeError.message || "Erro ao comunicar com a API do Stripe." });
    }
  } catch (error: any) {
    const fallbackUrl = getFallbackPaymentLink(normalizedPlan, userId, userEmail);
    if (fallbackUrl) {
      return res.json({ url: fallbackUrl, fallback: true });
    }
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: express.Request, res: express.Response) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.warn("[Webhook] Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
    return res.status(400).send("Missing sig/secret");
  }

  try {
    const stripe = getStripe();
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as any, endpointSecret);
    } catch (constructErr: any) {
      console.error(`[Webhook] Signature verification failed: ${constructErr.message}`);
      return res.status(400).send(`Webhook Signature Error: ${constructErr.message}`);
    }

    console.log(`[Webhook] Processing Stripe event: ${event.type}`);

    const { getAdminDb } = await import('../lib/firebase-admin.ts');
    const db = getAdminDb();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      let userId = session.client_reference_id;
      const userEmail = session.customer_details?.email || (session.customer_email as string);
      const plan = session.metadata?.plan || "PRO";
      const stripeSubscriptionId = session.subscription as string;

      const dbPlan = (plan === 'PROFESSIONAL' || plan === 'PROFISSIONAL') ? 'PROFISSIONAL' : (plan || 'PRO').toUpperCase();
      const targetRole = (dbPlan === 'PROFISSIONAL') ? 'trainer' : (dbPlan === 'PREMIUM' ? 'premium_user' : 'user');
      
      let subscriptionEndsAt = new Date();
      subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

      if (stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
          if (subscription && subscription.current_period_end) {
            subscriptionEndsAt = new Date(subscription.current_period_end * 1000);
          }
        } catch (subErr) {
          console.warn("[Webhook] Could not retrieve Stripe subscription details, using +30d default:", subErr);
        }
      }

      const dataToUpdate: any = {
        planType: dbPlan,
        role: targetRole,
        isPremium: true,
        stripeSubscriptionId: stripeSubscriptionId || null,
        stripeCustomerId: session.customer as string || null,
        subscriptionEndsAt: subscriptionEndsAt.toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!userId && userEmail) {
        try {
          const usersSnap = await db.collection('users').where('email', '==', userEmail).get();
          if (!usersSnap.empty) {
            userId = usersSnap.docs[0].id;
          }
        } catch (queryErr) {
          console.warn("[Webhook] Could not query user by email:", queryErr);
        }
      }

      if (userId) {
        console.log(`[Webhook] Updating user ${userId} to plan ${dbPlan}`);
        await db.collection('users').doc(userId).set(dataToUpdate, { merge: true });
      } else if (userEmail) {
        console.log(`[Webhook] User not found yet. Storing pending activation for ${userEmail}`);
        await db.collection('users').doc(`pending_${userEmail}`).set({
          ...dataToUpdate,
          email: userEmail,
          isPendingActivation: true
        }, { merge: true });
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const stripeSubscriptionId = (invoice.subscription as string) || (invoice.lines?.data?.[0]?.subscription as string);
      const customerEmail = invoice.customer_email;

      if (stripeSubscriptionId || customerEmail) {
        let userDoc: FirebaseFirestore.DocumentReference | null = null;

        if (stripeSubscriptionId) {
          const usersSnap = await db.collection('users').where('stripeSubscriptionId', '==', stripeSubscriptionId).get();
          if (!usersSnap.empty) userDoc = usersSnap.docs[0].ref;
        }

        if (!userDoc && customerEmail) {
          const usersSnap = await db.collection('users').where('email', '==', customerEmail).get();
          if (!usersSnap.empty) userDoc = usersSnap.docs[0].ref;
        }

        if (userDoc) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          await userDoc.update({
            isPremium: true,
            subscriptionEndsAt: futureDate.toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log(`[Webhook] Extended subscription for user after invoice payment succeeded.`);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const usersSnap = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();
      if (!usersSnap.empty) {
        console.log(`[Webhook] Subscription deleted for user doc: ${usersSnap.docs[0].id}`);
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
    console.error("[Webhook Error]:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export const syncSubscriptionStatus = async (req: express.Request, res: express.Response) => {
  try {
    const { userId, userEmail, plan } = req.body;
    if (!userId && !userEmail) {
      return res.status(400).json({ error: "userId ou userEmail obrigatório" });
    }

    const { getAdminDb } = await import('../lib/firebase-admin.ts');
    const db = getAdminDb();

    let targetUid = userId;
    if (!targetUid && userEmail) {
      const snap = await db.collection('users').where('email', '==', userEmail).get();
      if (!snap.empty) {
        targetUid = snap.docs[0].id;
      }
    }

    if (!targetUid) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const requestedPlan = (plan === 'PROFESSIONAL' || plan === 'PROFISSIONAL') ? 'PROFISSIONAL' : (plan || 'PRO').toUpperCase();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const updateData: any = {
      planType: requestedPlan,
      isPremium: true,
      subscriptionEndsAt: futureDate.toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (requestedPlan === 'PROFISSIONAL') {
      updateData.role = 'trainer';
    }

    await db.collection('users').doc(targetUid).set(updateData, { merge: true });

    res.json({ success: true, planType: requestedPlan, subscriptionEndsAt: futureDate.toISOString() });
  } catch (err: any) {
    console.error("Error in syncSubscriptionStatus:", err);
    res.status(500).json({ error: err.message });
  }
};
