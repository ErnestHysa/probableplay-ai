/**
 * Vercel Edge Function for Stripe Webhooks
 *
 * Handles Stripe webhook events to update user subscriptions in Supabase.
 *
 * Environment Variables Required:
 * - STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret (whsec_...)
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (for admin operations)
 */

import { createHmac } from 'crypto';

const STRIPE_WEBHOOK_SECRET = (typeof process !== 'undefined' && process.env?.STRIPE_WEBHOOK_SECRET) || '';
const STRIPE_SECRET_KEY = (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) || '';
const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.SUPABASE_URL ||
                     process.env?.NEXT_PUBLIC_SUPABASE_URL ||
                     process.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';

// Helper to verify Stripe webhook signature
function verifyStripeSignature(payload: string, signature: string): boolean {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured, skipping verification');
    return true; // Allow in development if not configured
  }

  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
  const signatures = elements.filter(e => e.startsWith('v1='));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Check timestamp is within tolerance (5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Verify signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  return signatures.some(s => s.slice(3) === expectedSignature);
}

// Helper to get Stripe API headers
function getStripeHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

// Helper to update Supabase profile
async function updateSupabaseProfile(userId: string, updates: Record<string, unknown>): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      ...updates,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Supabase profile: ${error}`);
  }
}

// Helper to get user ID from Stripe customer
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    method: 'GET',
    headers: getStripeHeaders(),
  });

  if (!response.ok) {
    return null;
  }

  const customer = await response.json();
  return customer.metadata?.supabase_user_id || null;
}

// Handle checkout.session.completed
async function handleCheckoutCompleted(session: any): Promise<void> {
  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer;

  if (!userId) {
    // Try to get userId from customer metadata
    if (customerId) {
      const retrievedUserId = await getUserIdFromCustomer(customerId);
      if (retrievedUserId) {
        await updateSupabaseProfile(retrievedUserId, {
          subscription_tier: 'pro',
          subscription_status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: session.subscription,
        });
        return;
      }
    }
    console.error('No user ID found in checkout session');
    return;
  }

  await updateSupabaseProfile(userId, {
    subscription_tier: 'pro',
    subscription_status: 'active',
    stripe_customer_id: customerId,
    stripe_subscription_id: session.subscription,
  });
}

// Handle customer.subscription.updated
async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  const customerId = subscription.customer;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error('No user ID found for customer:', customerId);
    return;
  }

  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  await updateSupabaseProfile(userId, {
    subscription_status: cancelAtPeriodEnd ? 'canceled' : status,
    updated_at: new Date().toISOString(),
  });
}

// Handle customer.subscription.deleted
async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  const customerId = subscription.customer;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error('No user ID found for customer:', customerId);
    return;
  }

  await updateSupabaseProfile(userId, {
    subscription_tier: 'free',
    subscription_status: 'canceled',
    stripe_subscription_id: null,
    updated_at: new Date().toISOString(),
  });
}

// Handle invoice.payment_succeeded (for renewals)
async function handlePaymentSucceeded(invoice: any): Promise<void> {
  const subscription = invoice.subscription;
  if (!subscription) return;

  const customerId = invoice.customer;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error('No user ID found for customer:', customerId);
    return;
  }

  // Reactivate if it was past due
  await updateSupabaseProfile(userId, {
    subscription_status: 'active',
    updated_at: new Date().toISOString(),
  });
}

// Handle invoice.payment_failed (for failed payments)
async function handlePaymentFailed(invoice: any): Promise<void> {
  const subscription = invoice.subscription;
  if (!subscription) return;

  const customerId = invoice.customer;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error('No user ID found for customer:', customerId);
    return;
  }

  await updateSupabaseProfile(userId, {
    subscription_status: 'past_due',
    updated_at: new Date().toISOString(),
  });
}

// Main handler
export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
      },
    });
  }

  if (request.method !== 'POST') {
    return Response.json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    }, { status: 405 });
  }

  try {
    const signature = request.headers.get('Stripe-Signature');
    const payload = await request.text();

    // Verify webhook signature
    if (!verifyStripeSignature(payload, signature || '')) {
      return Response.json({
        error: 'Invalid signature'
      }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const eventType = event.type;

    console.log('Processing Stripe webhook:', eventType);

    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);

    return Response.json({
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Edge function config for Vercel
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East
};
