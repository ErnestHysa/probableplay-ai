import React from 'react';

interface SkeletonCardProps {
  variant?: 'match' | 'prediction' | 'history' | 'stat';
  count?: number;
}

const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-700 animate-pulse rounded ${className}`} />
);

const MatchCardSkeleton: React.FC = () => (
  <div 
    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4"
    role="status"
    aria-label="Loading match card"
  >
    <div className="flex justify-between items-start">
      <SkeletonPulse className="h-6 w-32" />
      <SkeletonPulse className="h-6 w-20" />
    </div>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <SkeletonPulse className="h-5 w-28" />
        <SkeletonPulse className="h-4 w-12" />
      </div>
      <SkeletonPulse className="h-px w-full" />
      <div className="flex justify-between items-center">
        <SkeletonPulse className="h-5 w-32" />
        <SkeletonPulse className="h-4 w-12" />
      </div>
    </div>
    <SkeletonPulse className="h-4 w-24" />
  </div>
);

const PredictionSkeleton: React.FC = () => (
  <div 
    className="space-y-6"
    role="status"
    aria-label="Loading prediction"
  >
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="space-y-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
          <SkeletonPulse className="h-5 w-32" />
          <SkeletonPulse className="h-48 w-full" />
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-3">
          <SkeletonPulse className="h-5 w-24" />
          {[1, 2, 3].map(i => (
            <SkeletonPulse key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      
      {/* Right column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-3">
          <SkeletonPulse className="h-5 w-36" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-3/4" />
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-3">
          <SkeletonPulse className="h-5 w-32" />
          {[1, 2, 3, 4].map(i => (
            <SkeletonPulse key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HistorySkeleton: React.FC = () => (
  <div 
    className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4"
    role="status"
    aria-label="Loading history item"
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <SkeletonPulse className="w-12 h-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <SkeletonPulse className="h-5 w-48" />
          <SkeletonPulse className="h-3 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="space-y-2">
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-3 w-20" />
        </div>
        <SkeletonPulse className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

const StatCardSkeleton: React.FC = () => (
  <div 
    className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-3"
    role="status"
    aria-label="Loading statistic"
  >
    <SkeletonPulse className="h-4 w-24 mx-auto" />
    <SkeletonPulse className="h-8 w-16 mx-auto" />
  </div>
);

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'match', 
  count = 1 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => {
    switch (variant) {
      case 'match':
        return <MatchCardSkeleton key={i} />;
      case 'prediction':
        return <PredictionSkeleton key={i} />;
      case 'history':
        return <HistorySkeleton key={i} />;
      case 'stat':
        return <StatCardSkeleton key={i} />;
      default:
        return <MatchCardSkeleton key={i} />;
    }
  });

  if (variant === 'match') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skeletons}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className="grid grid-cols-3 gap-4">
        {skeletons}
      </div>
    );
  }

  if (variant === 'history') {
    return (
      <div className="space-y-4">
        {skeletons}
      </div>
    );
  }

  return <>{skeletons}</>;
};
