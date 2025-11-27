import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  action,
  size = 'md'
}) => {
  const containerSizes = {
    sm: 'py-12',
    md: 'py-20',
    lg: 'py-32'
  };

  const iconSizes = {
    sm: 32,
    md: 48,
    lg: 64
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const ActionIcon = action?.icon;

  return (
    <div 
      className={`text-center ${containerSizes[size]} bg-slate-800/30 rounded-xl border border-slate-800`}
      role="status"
      aria-live="polite"
    >
      <Icon 
        size={iconSizes[size]} 
        className="mx-auto text-slate-600 mb-4" 
        aria-hidden="true"
      />
      <h3 className={`text-slate-400 ${titleSizes[size]} font-medium mb-2`}>
        {title}
      </h3>
      {message && (
        <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto px-4">
          {message}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium shadow-md shadow-emerald-900/20"
          aria-label={action.label}
        >
          {ActionIcon && <ActionIcon size={18} />}
          {action.label}
        </button>
      )}
    </div>
  );
};
