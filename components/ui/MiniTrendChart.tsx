import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface TrendDataPoint {
  name: string;
  value: number;
  label?: string;
}

interface MiniTrendChartProps {
  data: TrendDataPoint[];
  variant?: 'area' | 'line';
  height?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  color?: string;
  label?: string;
}

export const MiniTrendChart: React.FC<MiniTrendChartProps> = ({
  data,
  variant = 'area',
  height = 100,
  showGrid = false,
  showAxes = false,
  color = '#10b981',
  label = 'Accuracy'
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700"
      >
        <span className="text-slate-500 text-xs italic">Insufficient data</span>
      </div>
    );
  }

  const renderChart = () => {
    if (variant === 'area') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            {showAxes && (
              <>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: '11px' }}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8' }}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '6px',
                color: '#f1f5f9'
              }}
              formatter={(value: any) => [`${value}%`, label]}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
          {showAxes && (
            <>
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '11px' }}
                domain={[0, 100]}
                tick={{ fill: '#94a3b8' }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              color: '#f1f5f9'
            }}
            formatter={(value: any) => [`${value}%`, label]}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="w-full">
      {renderChart()}
    </div>
  );
};
