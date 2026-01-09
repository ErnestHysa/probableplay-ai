/**
 * Vercel Edge Function for Stripe Checkout
 *
 * Creates a Stripe checkout session for Pro subscriptions.
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
 * - STRIPE_PRICE_MONTHLY: Price ID for monthly subscription
 * - STRIPE_PRICE_YEARLY: Price ID for yearly subscription
 */

// Stripe price IDs (you'll add these in environment variables)
const STRIPE_SECRET_KEY = (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) || '';
const STRIPE_PRICE_MONTHLY = (typeof process !== 'undefined' && process.env?.STRIPE_PRICE_MONTHLY) || '';
const STRIPE_PRICE_YEARLY = (typeof process !== 'undefined' && process.env?.STRIPE_PRICE_YEARLY) || '';

// Supabase URL for redirect success/cancel
const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL ||
                     process.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                          process.env?.VITE_SUPABASE_ANON_KEY) || '';

interface CheckoutRequest {
  userId: string;
  email: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Helper to get the Stripe API version
function getStripeHeaders(): HeadersInit {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Stripe-Version': '2023-10-16',
  };
}

// Create or get Stripe customer
async function getOrCreateCustomer(email: string, userId: string): Promise<string> {
  // First try to find existing customer by email
  const searchResponse = await fetch('https://api.stripe.com/v1/customers/search', {
    method: 'POST',
    headers: getStripeHeaders(),
    body: JSON.stringify({
      query: `email:'${email}'`,
    }),
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.data && searchData.data.length > 0) {
      return searchData.data[0].id;
    }
  }

  // Create new customer
  const createResponse = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: getStripeHeaders(),
    body: JSON.stringify({
      email,
      metadata: {
        supabase_user_id: userId,
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create Stripe customer: ${error}`);
  }

  const customer = await createResponse.json();
  return customer.id;
}

// Create checkout session
async function createCheckoutSession(params: {
  customerId: string;
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: getStripeHeaders(),
    body: JSON.stringify({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: params.userId,
        },
        trial_period_days: 0, // No trial for Pro subscription
      },
      metadata: {
        supabase_user_id: params.userId,
      },
      allow_promotion_codes: true,
      customer_update: {
        address: 'auto',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create checkout session: ${error}`);
  }

  const session = await response.json();
  return {
    url: session.url,
    sessionId: session.id,
  };
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const body: CheckoutRequest = await request.json();

    if (!body.userId || !body.email || !body.priceId) {
      return Response.json({
        error: 'Invalid request',
        message: 'Missing required fields: userId, email, priceId'
      }, { status: 400 });
    }

    // Validate price ID
    if (body.priceId !== STRIPE_PRICE_MONTHLY && body.priceId !== STRIPE_PRICE_YEARLY) {
      return Response.json({
        error: 'Invalid price ID',
        message: 'The provided price ID is not valid'
      }, { status: 400 });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(body.email, body.userId);

    // Set default URLs
    const baseUrl = SUPABASE_URL || request.headers.get('origin') || 'http://localhost:3001';
    const successUrl = body.successUrl || `${baseUrl}/profile?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${baseUrl}/pricing?canceled=true`;

    // Create checkout session
    const session = await createCheckoutSession({
      customerId,
      userId: body.userId,
      priceId: body.priceId,
      successUrl,
      cancelUrl,
    });

    return Response.json({
      url: session.url,
      sessionId: session.sessionId,
    });

  } catch (error) {
    console.error('Checkout error:', error);

    return Response.json({
      error: 'Checkout failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Edge function config for Vercel
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East
};
