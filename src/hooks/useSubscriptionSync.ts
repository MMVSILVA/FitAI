import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PlanType } from '../types';

export interface SubscriptionStatus {
  isChecking: boolean;
  isSubscribed: boolean;
  planType: PlanType;
  subscriptionEndsAt: string | null;
  message: string | null;
  syncSuccess: boolean;
}

/**
 * Hook to verify and sync user subscription status in Firestore after Stripe Checkout return
 * or on-demand, ensuring automatic unlock of Trainer/Nutritionist/Pro features.
 */
export function useSubscriptionSync() {
  const { user, planType, role, subscriptionEndsAt } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isChecking: false,
    isSubscribed: planType === 'PRO' || planType === 'PREMIUM' || planType === 'PROFISSIONAL',
    planType,
    subscriptionEndsAt,
    message: null,
    syncSuccess: false
  });

  const paymentSuccess = searchParams.get('success') === 'true';
  const sessionId = searchParams.get('session_id');

  const syncSubscription = useCallback(async (forcedPlan?: PlanType) => {
    if (!user) return;

    setStatus(prev => ({ ...prev, isChecking: true, message: 'Verificando status da assinatura...' }));

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        let currentPlan: PlanType = userData.planType || 'FREE';
        let isPremium = userData.isPremium || false;
        let endsAt = userData.subscriptionEndsAt || null;

        // If returned from Stripe with success flag and Firestore is still on FREE (webhook propagation delay)
        if (paymentSuccess || forcedPlan) {
          const targetPlan: PlanType = forcedPlan || (searchParams.get('plan')?.toUpperCase() as PlanType) || 'PRO';
          
          if (currentPlan === 'FREE') {
            console.log(`[SubscriptionSync] Auto-activating plan ${targetPlan} after successful Stripe checkout return...`);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            
            const updates: any = {
              planType: targetPlan,
              isPremium: true,
              subscriptionEndsAt: futureDate.toISOString(),
              updatedAt: new Date().toISOString()
            };

            // If professional plan, grant access to professional dashboards
            if (targetPlan === 'PROFISSIONAL') {
              updates.role = 'trainer';
            }

            await updateDoc(userRef, updates);
            currentPlan = targetPlan;
            isPremium = true;
            endsAt = futureDate.toISOString();
          }
        }

        setStatus({
          isChecking: false,
          isSubscribed: isPremium || currentPlan !== 'FREE',
          planType: currentPlan,
          subscriptionEndsAt: endsAt,
          message: isPremium ? 'Assinatura ativa e verificada com sucesso!' : 'Plano gratuito ativo.',
          syncSuccess: true
        });
      }
    } catch (error: any) {
      console.error('[SubscriptionSync] Error verifying subscription:', error);
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        message: 'Erro ao verificar assinatura. Tentaremos novamente em segundo plano.'
      }));
    }
  }, [user, paymentSuccess, searchParams]);

  // Handle return from Stripe checkout
  useEffect(() => {
    if (paymentSuccess && user) {
      syncSubscription();

      // Clean up URL parameter cleanly
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('success');
      if (sessionId) newParams.delete('session_id');
      setSearchParams(newParams, { replace: true });
    }
  }, [paymentSuccess, sessionId, user, syncSubscription, searchParams, setSearchParams]);

  return {
    ...status,
    syncSubscription
  };
}
