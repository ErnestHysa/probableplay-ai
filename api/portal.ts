/**
 * Vercel Edge Function for Stripe Customer Portal
 *
 * Creates a Stripe Customer Portal session for users to manage their subscriptions.
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

const STRIPE_SECRET_KEY = (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) || '';
const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.SUPABASE_URL ||
                     process.env?.NEXT_PUBLIC_SUPABASE_URL ||
                     process.env?.VITE_SUPABASE_URL) || '';

interface PortalRequest {
  userId: string;
  returnUrl?: string;
}

// Helper to get Stripe API headers
function getStripeHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Stripe-Version': '2023-10-16',
  };
}

// Get Stripe customer ID from user profile
async function getCustomerId(userId: string): Promise<string | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_URL.includes('supabase') ? '' : '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.[0]?.stripe_customer_id || null;
}

// Create customer portal session
async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: getStripeHeaders(),
    body: JSON.stringify({
      customer: params.customerId,
      return_url: params.returnUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create portal session: ${error}`);
  }

  const session = await response.json();
  return {
    url: session.url,
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
    const body: PortalRequest = await request.json();

    if (!body.userId) {
      return Response.json({
        error: 'Invalid request',
        message: 'Missing required field: userId'
      }, { status: 400 });
    }

    // Get Stripe customer ID from user profile
    const customerId = await getCustomerId(body.userId);

    if (!customerId) {
      return Response.json({
        error: 'No subscription found',
        message: 'User does not have an active subscription. Please subscribe first.'
      }, { status: 404 });
    }

    // Set default return URL
    const origin = request.headers.get('origin') || SUPABASE_URL || 'http://localhost:3001';
    const returnUrl = body.returnUrl || `${origin}/profile`;

    // Create portal session
    const session = await createPortalSession({
      customerId,
      returnUrl,
    });

    return Response.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Portal error:', error);

    return Response.json({
      error: 'Portal session creation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Edge function config for Vercel
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East
};
