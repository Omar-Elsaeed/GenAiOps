import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { ChartData } from '../types';

interface MetricChartProps {
  data: ChartData[];
  title: React.ReactNode;
  color: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ data, title, color }) => {
  return (
    <div className="bg-charcoal p-6 rounded-lg border border-slate-800 shadow-lg col-span-1 md:col-span-2">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id={`colorGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#131921',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                color: '#e2e8f0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
              }}
              itemStyle={{ color: '#f1f5f9' }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fillOpacity={1} fill={`url(#colorGradient-${color.replace('#', '')})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};