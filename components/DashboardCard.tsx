import React from 'react';
import type { Metric } from '../types';

interface DashboardCardProps {
  metric: Metric;
}

const ArrowUpIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

const ArrowDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const TrendIcon: React.FC<{ direction: Metric['changeDirection'], type: Metric['changeType'] }> = ({ direction, type }) => {
  if (direction === 'neutral') return null;

  const isPositive = direction === 'positive';
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const Icon = type === 'increase' ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className={`flex items-center text-sm font-semibold ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
    </div>
  );
};

export const DashboardCard: React.FC<DashboardCardProps> = ({ metric }) => {
  const changeColor = metric.changeDirection === 'positive' ? 'text-green-400' : metric.changeDirection === 'negative' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="bg-charcoal p-6 rounded-lg border border-slate-800 transition-all duration-300 hover:-translate-y-1 hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/10">
      <div className="relative">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-400">{metric.name}</h3>
            <TrendIcon direction={metric.changeDirection} type={metric.changeType} />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-slate-100">{metric.value}</p>
            <span className={`text-sm font-semibold ${changeColor}`}>{metric.change}</span>
          </div>
      </div>
    </div>
  );
};