/**
 * Upgrade Modal Component
 *
 * Prompts users to upgrade to Pro when they hit free tier limits.
 */

import React from 'react';
import { Zap, X, ArrowRight } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl max-w-md w-full p-8 border border-slate-700 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Zap className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade to Pro
          </h2>
          <p className="text-slate-300">
            {feature || 'This feature is only available for Pro subscribers.'}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {[
            'Unlimited predictions',
            'Detailed AI forecasts',
            'Backtesting lab',
            'Advanced statistics',
            'Export your data',
          ].map((f, idx) => (
            <div key={idx} className="flex items-center gap-3 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm mb-1">Starting from</p>
          <p className="text-4xl font-bold text-white">$9<span className="text-lg text-slate-500">/month</span></p>
          <p className="text-green-400 text-sm">or $90/year (save $18)</p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            onUpgrade();
            onClose();
          }}
          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
        >
          Upgrade Now
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
