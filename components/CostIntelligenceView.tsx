import React, { useState, useEffect } from 'react';
import { MetricChart } from './MetricChart';
import { MOCK_COST_BREAKDOWN, MONTHLY_COST_TREND_DATA } from '../constants';
import ReactMarkdown from 'react-markdown';
import type { CostBreakdownItem, ChartData } from '../types';

const LiveIndicator: React.FC = () => (
  <span className="ml-3 flex items-center text-xs font-semibold text-green-600">
    <span className="relative flex h-2 w-2 mr-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
    Live
  </span>
);

const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const CostBreakdownTable: React.FC<{ data: CostBreakdownItem[] }> = ({ data }) => {
    const colorScale = (percentage: number) => {
        if (percentage > 50) return 'bg-primary';
        if (percentage > 25) return 'bg-secondary';
        return 'bg-accent';
    };
    
    return (
        <div className="space-y-4">
            {data.map(item => (
                <div key={item.name}>
                    <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium text-gray-600">{item.name}</span>
                        <span className="text-gray-900 font-semibold">${item.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className={`${colorScale(item.percentage)} h-2.5 rounded-full`} 
                            style={{ width: `${item.percentage}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AiSuggestionCard: React.FC = () => {
    const suggestion = `
Based on your usage patterns, you could save an estimated **$250/month**:
*   **Action:** Transition the 'Customer Support Summarizer' prompt (v3) from \`gemini-2.5-pro\` to \`gemini-2.5-flash\`.
*   **Reasoning:** Our analysis indicates a 98% quality match for this summarization task, with a 60% reduction in cost per call.
*   **Impact:** This change would lower your daily operational costs without a significant impact on performance.
    `;
    return (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
             <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 9.414V12a1 1 0 102 0V9.414l.293.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
                </svg>
                Optimization Suggestion
             </h4>
             <div className="prose prose-sm max-w-none text-gray-600">
                <ReactMarkdown>{suggestion}</ReactMarkdown>
             </div>
        </div>
    );
}

export const CostIntelligenceView: React.FC = () => {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>(MOCK_COST_BREAKDOWN);
  const [monthlyTrend, setMonthlyTrend] = useState<ChartData[]>(MONTHLY_COST_TREND_DATA);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Simulate updating cost breakdown
      setCostBreakdown(prevBreakdown => {
        const newBreakdown = prevBreakdown.map(item => {
          if (item.name === 'gemini-2.5-pro') {
            return { ...item, cost: item.cost + (Math.random() * 5 + 1) };
          }
          if (item.name === 'gemini-2.5-flash') {
            return { ...item, cost: item.cost + (Math.random() * 4 + 0.5) };
          }
          return item;
        });

        const totalCost = newBreakdown.reduce((sum, item) => sum + item.cost, 0);

        return newBreakdown.map(item => ({
          ...item,
          percentage: parseFloat(((item.cost / totalCost) * 100).toFixed(1)),
        }));
      });

      // Simulate updating monthly trend
      setMonthlyTrend(prevTrend => {
        const newTrend = [...prevTrend];
        const lastPoint = newTrend[newTrend.length - 1];
        newTrend[newTrend.length - 1] = { ...lastPoint, value: lastPoint.value + (Math.random() * 20 + 5) };
        return newTrend;
      });

    }, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const handleExportCSV = () => {
    // Create CSV content for Cost Breakdown
    const breakdownHeaders = ['Model', 'Cost ($)', 'Percentage (%)'];
    const breakdownRows = costBreakdown.map(item => 
      [item.name, item.cost.toFixed(2), item.percentage].join(',')
    );
    const breakdownCSV = [breakdownHeaders.join(','), ...breakdownRows].join('\n');

    // Create CSV content for Monthly Trend
    const trendHeaders = ['Month', 'Cost ($)'];
    const trendRows = monthlyTrend.map(item => 
      [item.name, item.value.toFixed(2)].join(',')
    );
    const trendCSV = [trendHeaders.join(','), ...trendRows].join('\n');

    // Combine both sections
    const csvContent = [
        'Cost Breakdown by Model',
        breakdownCSV,
        '', // Add a blank line for spacing
        'Monthly Cost Trend',
        trendCSV
    ].join('\n');
    
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `genaiops_cost_report_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cost Intelligence</h2>
        <button
            onClick={handleExportCSV}
            className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200"
        >
            <DownloadIcon className="w-5 h-5" />
            <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MetricChart data={monthlyTrend} title={
            <div className="flex items-center">
              Monthly Cost Trend
              <LiveIndicator />
            </div>
          } color="#22C55E" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            Cost Breakdown by Model
            <LiveIndicator />
          </h3>
          <CostBreakdownTable data={costBreakdown} />
        </div>
      </div>
      <AiSuggestionCard />
    </div>
  );
};