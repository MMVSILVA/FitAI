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
    link = process.env.VITE_STRIPE_LINK_PRO || process.env.STRIPE_LINK_PRO || DEFAULT_PRO_PAYMENT_LINK;
  }

  link = link.trim();
  if (!link || (!link.startsWith('http://') && !link.startsWith('https://'))) return null;

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
    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (keyErr: any) {
      const fallbackUrl = getFallbackPaymentLink(normalizedPlan, userId, userEmail);
      if (fallbackUrl) {
        console.warn(`Stripe secret key error (${keyErr.message}). Redirecting to configured direct payment link.`);
        return res.json({ url: fallbackUrl, fallback: true });
      }
      return res.status(400).json({ 
        error: keyErr.message || "Erro na chave secreta do Stripe.",
        isKeyError: true
      });
    }

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
        
        const dbPlan = (plan === 'PROFESSIONAL' || plan === 'PROFISSIONAL') ? 'PROFISSIONAL' : plan;
        // Se o plano for PROFISSIONAL, o usuário vira um "trainer" para acessar o Dashboard de Profissional
        const targetRole = (dbPlan === 'PROFISSIONAL') ? 'trainer' : (dbPlan === 'PREMIUM' ? 'premium_user' : 'user');
        
        if (!userId && userEmail) {
          const usersSnap = await db.collection('users').where('email', '==', userEmail).get();
          if (!usersSnap.empty) {
            userId = usersSnap.docs[0].id;
          }
        }

        const subscriptionEndsAt = new Date(subscription.current_period_end * 1000);
        const dataToUpdate = {
          planType: dbPlan,
          role: targetRole,
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
