/**
 * Pricing View
 *
 * Displays subscription tiers and pricing information.
 * Users can click to subscribe via Stripe checkout.
 */

import React from 'react';
import { Check, Zap, BarChart3, ArrowRight, FlaskConical } from 'lucide-react';

interface PricingViewProps {
  onNavigate?: (view: string) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onNavigate }) => {
  const handleSubscribe = (tier: 'monthly' | 'yearly') => {
    // TODO: Integrate Stripe checkout
    console.log(`Subscribe to ${tier} plan`);
    alert('Stripe integration coming soon! You can add your Stripe keys later.');
  };

  const features = {
    free: [
      { name: '10 standard predictions per week', included: true },
      { name: '3 free detailed forecast trials', included: true },
      { name: '7 days prediction history', included: true },
      { name: 'Basic accuracy tracking', included: true },
      { name: 'Backtesting lab', included: false },
      { name: 'Advanced statistics & charts', included: false },
      { name: 'Export data (CSV/JSON)', included: false },
      { name: 'Unlimited predictions', included: false },
    ],
    pro: [
      { name: '10 standard predictions per week', included: true },
      { name: '3 free detailed forecast trials', included: true },
      { name: '7 days prediction history', included: true },
      { name: 'Basic accuracy tracking', included: true },
      { name: 'UNLIMITED backtesting', included: true },
      { name: 'Advanced statistics & charts', included: true },
      { name: 'Export data (CSV/JSON)', included: true },
      { name: 'UNLIMITED predictions', included: true },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Unlock unlimited AI-powered sports predictions, backtesting, and advanced analytics with ProbablePlay Pro.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
            <p className="text-slate-400">Perfect for trying out the app</p>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-slate-500">/month</span>
          </div>

          <ul className="space-y-4 mb-8">
            {features.free.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  feature.included ? 'bg-green-500/20' : 'bg-slate-700'
                }`}>
                  {feature.included ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  )}
                </div>
                <span className={feature.included ? 'text-slate-300' : 'text-slate-500 line-through'}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onNavigate?.('DASHBOARD')}
            className="w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
          >
            Get Started
          </button>
        </div>

        {/* Pro Tier */}
        <div className="relative bg-gradient-to-b from-orange-500/10 to-red-500/10 rounded-2xl p-8 border border-orange-500/30">
          {/* Popular Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full">
            MOST POPULAR
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Pro</h2>
            </div>
            <p className="text-slate-400">For serious sports bettors and analysts</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">$9</span>
              <span className="text-slate-500">/month</span>
            </div>
            <p className="text-green-400 text-sm mt-1">or $90/year (save $18)</p>
          </div>

          <ul className="space-y-4 mb-8">
            {features.pro.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className={`font-medium ${feature.name.includes('UNLIMITED') || feature.name.includes('UNLIMITED') || feature.name.includes('ADVANCED') ? 'text-orange-400' : 'text-slate-300'}`}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubscribe('monthly')}
            className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
          >
            Upgrade to Pro
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-slate-500 text-xs mt-4">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Unlimited Predictions</h3>
          <p className="text-slate-400 text-sm">
            Get as many predictions as you need. No weekly limits, no restrictions.
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
            <FlaskConical className="w-6 h-6 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Backtesting Lab</h3>
          <p className="text-slate-400 text-sm">
            Test prediction accuracy on historical matches. Refine your strategy.
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
          <p className="text-slate-400 text-sm">
            Track accuracy over time, analyze trends, and export your data.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
            <p className="text-slate-400 text-sm">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-2">How accurate are the predictions?</h3>
            <p className="text-slate-400 text-sm">
              Our AI analyzes team form, head-to-head records, and statistical patterns. Check our backtesting lab for historical accuracy.
            </p>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-2">What sports are covered?</h3>
            <p className="text-slate-400 text-sm">
              We currently cover major football leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) and NBA.
            </p>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-2">Is payment secure?</h3>
            <p className="text-slate-400 text-sm">
              Yes, we use Stripe for secure payment processing. Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingView;
