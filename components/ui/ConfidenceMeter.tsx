import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

interface ConfidenceMeterProps {
  level: ConfidenceLevel;
  variant?: 'radial' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
}

const confidenceMap = {
  High: { value: 85, colorClass: 'emerald', icon: CheckCircle, colorHex: '#10b981' },
  Medium: { value: 50, colorClass: 'amber', icon: Info, colorHex: '#f59e0b' },
  Low: { value: 25, colorClass: 'red', icon: AlertCircle, colorHex: '#ef4444' }
};

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  level,
  variant = 'radial',
  size = 'md',
  showLabel = true,
  showIcon = true
}) => {
  const config = confidenceMap[level];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizeClasses = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const colorClasses = {
    emerald: { icon: 'text-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-400' },
    amber: { icon: 'text-amber-500', bar: 'bg-amber-500', text: 'text-amber-400' },
    red: { icon: 'text-red-500', bar: 'bg-red-500', text: 'text-red-400' }
  };

  const colors = colorClasses[config.colorClass];

  if (variant === 'horizontal') {
    return (
      <div className="flex items-center gap-4">
        {showIcon && (
          <Icon
            size={iconSizeClasses[size]}
            className={`${colors.icon} shrink-0`}
          />
        )}
        <div className="flex-1">
          {showLabel && (
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">
              Confidence
            </div>
          )}
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`${colors.bar} h-full rounded-full transition-all duration-300`}
              style={{ width: `${config.value}%` }}
            />
          </div>
          {showLabel && (
            <div className={`${colors.text} font-bold mt-1.5 ${labelSizeClasses[size]}`}>
              {level}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Radial (gauge) variant
  const radius = size === 'sm' ? 20 : size === 'md' ? 32 : 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (config.value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <svg width="100%" height="100%" viewBox={`0 0 ${radius * 2 + 20} ${radius * 2 + 20}`}>
          {/* Background circle */}
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke={config.colorHex}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${radius + 10}px ${radius + 10}px`,
              transition: 'stroke-dashoffset 0.3s ease'
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {showIcon && (
            <Icon size={iconSizeClasses[size]} style={{ color: config.colorHex }} />
          )}
          {showLabel && (
            <span className={`font-bold ${colors.text} ${labelSizeClasses[size]}`}>
              {config.value}%
            </span>
          )}
        </div>
      </div>
      {showLabel && (
        <div className={`font-semibold ${colors.text} ${labelSizeClasses[size]} uppercase tracking-wider`}>
          {level}
        </div>
      )}
    </div>
  );
};
