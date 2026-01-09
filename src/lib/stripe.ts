/**
 * Stripe Client Library
 *
 * Handles Stripe checkout and portal operations via edge functions.
 */

import { supabase } from './supabase';

export interface CheckoutSessionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

/**
 * Get Stripe price IDs from environment
 */
export const STRIPE_PRICES = {
  MONTHLY: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || '',
  YEARLY: import.meta.env.VITE_STRIPE_PRICE_YEARLY || '',
};

/**
 * Create a Stripe checkout session for Pro subscription
 */
export async function createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      priceId: params.priceId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Create Stripe customer portal session
 * Allows users to manage their subscription (update payment method, cancel, etc.)
 */
export async function createCustomerPortalSession(returnUrl?: string): Promise<{ url: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch('/api/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      userId: user.id,
      returnUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create portal session');
  }

  return response.json();
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!(STRIPE_PRICES.MONTHLY || STRIPE_PRICES.YEARLY);
}
