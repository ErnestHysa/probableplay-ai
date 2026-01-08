import React from 'react';
import { PredictionProbabilities } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProbabilityChartProps {
  probabilities: PredictionProbabilities;
}

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ probabilities }) => {
  // Convert decimals to percentages
  const home = Math.round(probabilities.homeWin * 100);
  const draw = Math.round(probabilities.draw * 100);
  const away = Math.round(probabilities.awayWin * 100);

  // Re-normalize if rounding creates a gap
  const total = home + draw + away;
  
  const data = [
    { name: 'Home Win', value: home, color: '#10b981' }, // Emerald 500
    { name: 'Draw', value: draw, color: '#64748b' },     // Slate 500
    { name: 'Away Win', value: away, color: '#3b82f6' }, // Blue 500
  ].filter(d => d.value > 0);

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
            itemStyle={{ color: '#f1f5f9' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Probabilities</span>
      </div>
      
      {/* Legend */}
      <div className="flex gap-6 mt-2">
        {data.map(item => (
            <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                <div className="text-sm font-medium text-slate-300">
                    {item.name} <span className="text-slate-500 font-mono ml-1">{item.value}%</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
