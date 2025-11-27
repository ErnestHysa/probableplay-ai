import React from 'react';
import { PredictionProbabilities } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, Handshake, Target } from 'lucide-react';

interface ProbabilityChartProps {
  probabilities: PredictionProbabilities;
  showIcons?: boolean;
}

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ probabilities, showIcons = true }) => {
  // Convert decimals to percentages
  const home = Math.round(probabilities.homeWin * 100);
  const draw = Math.round(probabilities.draw * 100);
  const away = Math.round(probabilities.awayWin * 100);

  // Re-normalize if rounding creates a gap
  const total = home + draw + away;
  
  const data = [
    { name: 'Home', value: home, color: '#10b981', icon: Trophy, label: 'Home Win' },
    { name: 'Draw', value: draw, color: '#64748b', icon: Handshake, label: 'Draw' },
    { name: 'Away', value: away, color: '#3b82f6', icon: Target, label: 'Away Win' },
  ].filter(d => d.value > 0);

  // Create gradient definitions
  const createGradientDefs = () => (
    <defs>
      <linearGradient id="grad-home" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="grad-draw" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#475569', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="grad-away" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
  );

  const getGradientUrl = (index: number) => {
    const gradients = ['url(#grad-home)', 'url(#grad-draw)', 'url(#grad-away)'];
    return gradients[index] || gradients[0];
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <div className="w-full h-64 flex flex-col items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {createGradientDefs()}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              animationDuration={500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getGradientUrl(index)} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155', 
                borderRadius: '8px', 
                color: '#f1f5f9',
                padding: '8px 12px'
              }}
              formatter={(value: any) => [`${value}%`, 'Probability']}
              itemStyle={{ color: '#f1f5f9' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest block">Most Likely</span>
            <span className="text-emerald-400 font-bold text-sm mt-1 block">
              {data.length > 0 && data[0].name}
            </span>
          </div>
        </div>
      </div>
      
      {/* Icon-Rich Legend */}
      <div className="w-full grid grid-cols-3 gap-3">
        {data.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.name} 
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon size={16} style={{ color: item.color }} />
                <span className="text-xs font-semibold text-slate-300">{item.name}</span>
              </div>
              <div className="text-lg font-bold" style={{ color: item.color }}>
                {item.value}%
              </div>
              <div className="text-[10px] text-slate-500 text-center">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
