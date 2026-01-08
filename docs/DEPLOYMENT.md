# Deployment Guide - ProbablePlay AI

This guide covers deploying ProbablePlay AI to production.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment Setup](#post-deployment-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Deployment Overview

ProbablePlay AI is designed as a static React application that can be deployed to any static hosting service. The application uses:

- **Client-side**: React 19 + Vite
- **Backend-as-a-Service**: Supabase (auth + database)
- **Edge Functions**: For Stripe webhooks
- **CDN**: For serving static assets

---

## Vercel Deployment (Recommended)

Vercel is the recommended hosting platform for ProbablePlay AI due to its:

- Automatic deployments from Git
- Built-in Edge Functions support
- Global CDN
- Preview deployments for pull requests
- Zero configuration required

### Prerequisites

1. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Install Vercel CLI: `npm i -g vercel`

2. **Repository**
   - Push code to GitHub/GitLab/Bitbucket
   - Ensure `.env.local` is NOT committed

3. **Prepare Environment Variables**
   - Have all required API keys ready
   - See [Environment Variables](#environment-variables) section

### Step-by-Step Deployment

#### 1. Connect Repository to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

Or via Vercel dashboard:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Vite configuration

#### 2. Configure Project Settings

In Vercel dashboard, go to **Settings > General**:

**Build & Development Settings**:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

#### 3. Add Environment Variables

Go to **Settings > Environment Variables** and add:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Important**:
- Add separate variables for **Production**, **Preview**, and **Development** environments
- Use test keys for Preview/Development
- Use live keys for Production

#### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy if configured)
git push origin main
```

Your app will be live at: `https://your-project.vercel.app`

#### 5. Configure Custom Domain (Optional)

1. Go to **Settings > Domains**
2. Add your custom domain
3. Configure DNS records (CNAME or A record)
4. Wait for SSL certificate provisioning

---

## Manual Deployment

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

**netlify.toml** configuration:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### AWS S3 + CloudFront

```bash
# Build the project
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### GitHub Pages

```bash
# Update vite.config.ts base path
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})

# Build and deploy
npm run build
# Push dist/ folder to gh-pages branch
```

### Traditional Hosting (cPanel, Apache, Nginx)

```bash
# Build
npm run build

# Upload dist/ folder contents to your web server
# Ensure server handles SPA routing (all routes → index.html)
```

**Nginx configuration**:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess)**:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-l
RewriteRule . /index.html [L]
```

---

## Environment Variables

### Production Variables

| Variable | Example | Notes |
|----------|---------|-------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | From Supabase settings |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Use LIVE key for production |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | From Google AI Studio |

### Development/Test Variables

Use separate keys for development:

```bash
# Use test mode Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Use separate Supabase project for testing
VITE_SUPABASE_URL=https://test-project.supabase.co
VITE_SUPABASE_ANON_KEY=test_anon_key
```

### Server-Side Variables (Edge Functions)

For Stripe webhooks in Edge Functions:

```bash
# NOT prefixed with VITE_ (server-side only)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

These should be set in your hosting platform's Edge Function environment, NOT in client code.

---

## Post-Deployment Setup

### 1. Stripe Webhook Configuration

After deploying, you need to configure Stripe webhooks:

1. **Create Stripe Endpoint**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

2. **Get Webhook Secret**
   - Copy the webhook secret: `whsec_...`
   - Add to your Edge Function environment variables

3. **Deploy Edge Function**
   ```typescript
   // api/webhooks/stripe.ts (Vercel Edge Function)
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   import Stripe from 'https://esm.sh/stripe@12.0.0';

   const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
     apiVersion: '2022-11-15',
   });

   serve(async (req) => {
     const signature = req.headers.get('stripe-signature');
     const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

     // Verify webhook signature
     // Handle events
     // Update Supabase profile
   });
   ```

### 2. Supabase Row Level Security (RLS)

Ensure RLS policies are enabled in production:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop any test policies
DROP POLICY IF EXISTS "Allow all" ON profiles;

-- Ensure production policies are in place
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### 3. Set Up Database Backups

In Supabase dashboard:
- Go to Database > Backups
- Enable daily backups
- Configure retention period (7-30 days)

### 4. Configure CORS

If you have a custom API or Edge Functions:

```typescript
// In Edge Functions
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://your-domain.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  },
});
```

### 5. Set Up Monitoring

#### Vercel Analytics
- Enable in Vercel dashboard
- View web vitals and traffic

#### Supabase Logs
- Monitor auth events
- Track database queries
- Set up alerts for errors

#### Custom Error Tracking (Optional)

```typescript
// Initialize error tracking (e.g., Sentry)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Monitoring and Maintenance

### Health Checks

Create a health check endpoint:

```typescript
// api/health.ts
export default function handler(req: Request) {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Performance Monitoring

Monitor these metrics:

- **Web Vitals** (LCP, FID, CLS)
- **API Response Times**
- **Error Rates**
- **Conversion Rates** (free to Pro)

### Key Metrics to Track

1. **User Metrics**
   - Daily active users
   - Prediction accuracy
   - Free vs Pro ratio

2. **Technical Metrics**
   - API error rate (Gemini, TheSportsDB)
   - Page load time
   - Time to Interactive

3. **Business Metrics**
   - Stripe conversion rate
   - Churn rate
   - Revenue per user

### Regular Maintenance Tasks

#### Weekly
- Check error logs
- Review API usage limits
- Monitor prediction accuracy

#### Monthly
- Update dependencies
- Review Stripe payments
- Clean up old predictions (if retention policy)

#### Quarterly
- Security audit
- Performance optimization
- Feature review and planning

---

## Rollback Procedure

If you need to rollback:

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

Or via dashboard:
1. Go to **Deployments**
2. Find previous successful deployment
3. Click "Promote to Production"

### Manual Deployment

```bash
# Rebuild from previous commit
git checkout <previous-commit-hash>
npm run build
# Upload dist/ to server
```

---

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Working
**Problem**: API keys undefined in production
**Solution**:
- Ensure variables are prefixed with `VITE_` for client-side access
- Redeploy after adding environment variables
- Check Vercel logs for variable access

#### 2. Stripe Webhook Failing
**Problem**: Webhook signature verification fails
**Solution**:
- Verify webhook secret is set in Edge Function environment
- Ensure webhook endpoint URL matches Stripe configuration
- Check for whitespace in secret key

#### 3. Supabase RLS Blocking Access
**Problem**: Users can't access their own data
**Solution**:
- Verify RLS policies are correctly configured
- Check user authentication state
- Test policy in Supabase SQL editor

#### 4. Build Failures
**Problem**: Build fails during deployment
**Solution**:
- Check build logs for specific error
- Ensure `npm run build` passes locally
- Verify Node.js version matches (use `.nvmrc`)

#### 5. API Rate Limiting
**Problem**: Gemini API rate limit exceeded
**Solution**:
- Implement request queuing
- Upgrade to paid Gemini tier
- Add caching for repeated requests

---

## Security Checklist

Before going to production:

- [ ] All API keys secured and not exposed
- [ ] Supabase RLS enabled on all tables
- [ ] Stripe webhook signature verification enabled
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Environment variables not in git repository
- [ ] `.env.local` in `.gitignore`
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info
- [ ] Database backups enabled
- [ ] Monitoring and alerts configured

---

## Performance Optimization

### Build Optimization

In `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### Caching Strategy

- Static assets: Cache for 1 year
- HTML: No cache
- API responses: Cache for 5 minutes

---

## Scaling Considerations

### When to Scale Up

1. **Traffic Spikes**
   - Vercel automatically handles scaling
   - Consider upgrading to Pro plan for higher limits

2. **Database Load**
   - Enable Supabase connection pooling
   - Implement Redis caching
   - Archive old predictions

3. **API Costs**
   - Monitor Gemini API usage
   - Implement request batching
   - Use caching to reduce API calls

### Next Steps

When outgrowing serverless architecture:
1. Move to dedicated server (AWS EC2, DigitalOcean)
2. Implement background job processing
3. Add message queue (Redis, RabbitMQ)
4. Implement microservices architecture

---

## Support

For deployment issues:
- Check Vercel deployment logs
- Review Supabase logs
- Test Stripe webhook with CLI: `stripe listen`
- Open an issue on GitHub

---

Last updated: 2025-01-08
