import React, { useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { MetricChart } from './MetricChart';
import { MOCK_METRICS, LATENCY_CHART_DATA, COST_CHART_DATA, MOCK_ALERTS } from '../constants';
import type { Alert } from '../types';
import { AIAnalysisModal } from './AIAnalysisModal';
import { analyzeAlert } from '../services/geminiService';

const AlertCard: React.FC<{alert: Alert, onAnalyze: (alert: Alert) => void}> = ({ alert, onAnalyze }) => {
    const severityClasses = {
        critical: 'border-red-500/30 bg-red-900/40 text-red-300',
        warning: 'border-yellow-500/30 bg-yellow-900/40 text-yellow-300'
    };

    const iconClasses = {
        critical: 'text-red-400',
        warning: 'text-yellow-400'
    }

    const Icon: React.FC<{className?: string}> = ({className}) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );

    return (
        <div className={`p-4 rounded-lg border ${severityClasses[alert.severity]}`}>
            <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 mt-0.5 ${iconClasses[alert.severity]}`}>
                    <Icon className="w-5 h-5"/>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-slate-100 text-sm">{alert.title}</h4>
                    <p className="text-sm text-slate-400">{alert.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{alert.timestamp}</span>
                        {alert.context && (
                            <button 
                                onClick={() => onAnalyze(alert)}
                                className="text-xs font-semibold px-3 py-1 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors"
                            >
                                Analyze with AI
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const DashboardView: React.FC = () => {
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeAlert = async (alert: Alert) => {
    setSelectedAlert(alert);
    setAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
        const result = await analyzeAlert(alert);
        setAnalysisResult(result);
    } catch (error) {
        setAnalysisResult("Failed to get analysis. Please check the console for more details.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleCloseModal = () => {
    setAnalysisModalOpen(false);
    setSelectedAlert(null);
    setAnalysisResult('');
  };

  return (
    <div className="space-y-6">
       <h1 className="text-2xl font-bold text-slate-100">Operations Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_METRICS.map((metric) => (
          <DashboardCard key={metric.name} metric={metric} />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricChart data={LATENCY_CHART_DATA} title="Average Latency (24h)" color="#ff9900" />
            <MetricChart data={COST_CHART_DATA} title="Daily Costs (Last 7 Days)" color="#00a8e1" />
        </div>
        <div className="bg-charcoal p-6 rounded-lg border border-slate-800 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Alerts</h3>
            <div className="space-y-4">
                {MOCK_ALERTS.map(alert => (
                    <AlertCard key={alert.id} alert={alert} onAnalyze={handleAnalyzeAlert} />
                ))}
            </div>
        </div>
      </div>
       {selectedAlert && (
          <AIAnalysisModal 
            isOpen={isAnalysisModalOpen}
            onClose={handleCloseModal}
            isLoading={isAnalyzing}
            analysisResult={analysisResult}
            alertTitle={selectedAlert.title}
          />
      )}
    </div>
  );
};