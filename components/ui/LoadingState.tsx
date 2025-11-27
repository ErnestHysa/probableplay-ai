import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

interface LoadingStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  icon: Icon,
  title = 'Loading...',
  message,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-32',
    md: 'h-64',
    lg: 'h-96'
  };

  const spinnerSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  if (variant === 'minimal') {
    return (
      <div 
        className="flex items-center justify-center gap-3"
        role="status"
        aria-live="polite"
        aria-label={title}
      >
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        {title && <span className="text-slate-400 text-sm">{title}</span>}
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center ${sizeClasses[size]} space-y-4 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {Icon ? (
        <div className="relative">
          <Icon className={`${spinnerSizes[size]} text-emerald-500 animate-pulse`} />
          <div className={`absolute inset-0 ${spinnerSizes[size]} border-4 border-emerald-500 border-t-transparent rounded-full animate-spin`} />
        </div>
      ) : (
        <div className={`${spinnerSizes[size]} border-4 border-emerald-500 border-t-transparent rounded-full animate-spin`} />
      )}
      
      {title && (
        <h3 className={`${titleSizes[size]} font-semibold text-white`}>
          {title}
        </h3>
      )}
      
      {message && (
        <p className="text-slate-400 max-w-md mx-auto text-center px-4">
          {message}
        </p>
      )}
      
      <span className="sr-only">{title}</span>
    </div>
  );
};
