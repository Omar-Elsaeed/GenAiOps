import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MOCK_STAKEHOLDER_REPORTS, MOCK_METRICS, LATENCY_CHART_DATA, DocumentDownloadIcon, LightBulbIcon } from '../constants';
import { generateReportSummary, generateReportInsights } from '../services/geminiService';
import { PulsingText } from './Spinner';
import { MetricChart } from './MetricChart';
import type { StakeholderReport, Metric } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: StakeholderReport) => void;
  availableMetrics: Metric[];
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSave, availableMetrics }) => {
    const [title, setTitle] = useState('');
    const [audience, setAudience] = useState<'Executive' | 'Marketing' | 'Technical'>('Executive');
    const [selectedMetricNames, setSelectedMetricNames] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [summary, setSummary] = useState('');
    const [keyInsights, setKeyInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setAudience('Executive');
            setSelectedMetricNames([]);
            setNotes('');
            setSummary('');
            setKeyInsights([]);
            setIsLoading(false);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleMetricToggle = (metricName: string) => {
        setSelectedMetricNames(prev =>
            prev.includes(metricName)
                ? prev.filter(name => name !== metricName)
                : [...prev, metricName]
        );
    };

    const handleGenerateSummary = async () => {
        if (!title.trim()) {
            setError('Report Title is required to generate a summary.');
            return;
        }
        setError('');
        setIsLoading(true);
        setSummary('');
        setKeyInsights([]);
        try {
            const selectedMetrics = availableMetrics.filter(m => selectedMetricNames.includes(m.name));
            const [summaryResult, insightsResult] = await Promise.all([
                generateReportSummary(title, audience, selectedMetrics, notes),
                generateReportInsights(title, audience, selectedMetrics, notes)
            ]);
            setSummary(summaryResult);
            setKeyInsights(insightsResult);
        } catch (err) {
            setSummary('An error occurred while generating the summary. Please try again.');
            setKeyInsights(['Failed to generate insights.']);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveReport = () => {
        if (!title.trim() || !summary.trim()) {
            setError('Title and a generated summary are required to save the report.');
            return;
        }
        const newReport: StakeholderReport = {
            id: `sr-${Date.now()}`,
            title,
            audience,
            summary,
            keyInsights,
            createdAt: new Date().toISOString().split('T')[0],
            metrics: availableMetrics.filter(m => selectedMetricNames.includes(m.name)),
            notes,
        };
        onSave(newReport);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Create Stakeholder Report</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="report-title" className="block text-sm font-medium text-gray-600 mb-2">Report Title</label>
                            <input type="text" id="report-title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="report-audience" className="block text-sm font-medium text-gray-600 mb-2">Target Audience</label>
                            <select id="report-audience" value={audience} onChange={e => setAudience(e.target.value as any)} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary">
                                <option>Executive</option>
                                <option>Marketing</option>
                                <option>Technical</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Include Metrics</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-md border">
                            {availableMetrics.map(metric => (
                                <div key={metric.name} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`metric-${metric.name}`}
                                        checked={selectedMetricNames.includes(metric.name)}
                                        onChange={() => handleMetricToggle(metric.name)}
                                        className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <label htmlFor={`metric-${metric.name}`} className="ml-2 text-sm text-gray-700">{metric.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="report-notes" className="block text-sm font-medium text-gray-600 mb-2">Additional Notes/Context</label>
                        <textarea id="report-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary" placeholder="Provide any extra context for the AI to consider when writing the summary..." />
                    </div>
                    <button onClick={handleGenerateSummary} disabled={isLoading || !title.trim()} className="w-full px-6 py-2 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 disabled:bg-gray-300">
                        {isLoading ? 'Generating...' : 'Generate AI Summary & Insights'}
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Generated Summary</label>
                            <div className="p-4 bg-gray-50 rounded-md border min-h-[150px]">
                                {isLoading && !summary && !keyInsights.length ? <PulsingText text="Generating summary..." /> : <ReactMarkdown className="prose prose-sm max-w-none text-gray-600">{summary}</ReactMarkdown>}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">AI-Generated Key Insights</label>
                            <div className="p-4 bg-blue-50/50 rounded-md border border-blue-200/50 min-h-[150px]">
                                {isLoading && !summary && !keyInsights.length ? (
                                    <PulsingText text="Extracting insights..." />
                                ) : (
                                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                                        {keyInsights.map((insight, index) => <li key={index}>{insight}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <footer className="flex justify-end p-4 border-t space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveReport} disabled={!summary.trim() || !title.trim()} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light disabled:bg-gray-300">Save Report</button>
                </footer>
            </div>
        </div>
    );
};

const ReportDetail: React.FC<{ report: StakeholderReport; onBack: () => void }> = ({ report, onBack }) => {
    const chartMetric = report.metrics.length > 0 ? report.metrics[0] : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                <div>
                    <button onClick={onBack} className="text-sm text-primary hover:underline mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to All Reports
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">{report.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <span>Created: {report.createdAt}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>Audience: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{report.audience}</span></span>
                    </div>
                </div>
                <button 
                    onClick={() => alert('PDF export would be generated here.')}
                    className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light"
                >
                    <DocumentDownloadIcon className="w-5 h-5"/>
                    <span>Export to PDF</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">AI-Generated Summary</h3>
                    <div className="prose prose-sm sm:prose-base max-w-none text-gray-600">
                        <ReactMarkdown>{report.summary}</ReactMarkdown>
                    </div>
                </div>

                <div className="space-y-6">
                    {report.metrics.length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Metrics</h3>
                            <div className="space-y-3">
                                {report.metrics.map(metric => (
                                    <div key={metric.name} className="flex justify-between items-baseline p-3 bg-gray-50 rounded-md">
                                        <h4 className="text-sm font-medium text-gray-500">{metric.name}</h4>
                                        <p className="text-xl font-semibold text-gray-900">{metric.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {report.keyInsights && report.keyInsights.length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500"/>
                                Key Insights
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                                {report.keyInsights.map((insight, index) => <li key={index}>{insight}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {chartMetric && (
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <MetricChart 
                        data={LATENCY_CHART_DATA} 
                        title={`Trend for ${chartMetric.name}`} 
                        color="#3B82F6" 
                    />
                </div>
            )}
        </div>
    );
};

export const StakeholderReportsView: React.FC = () => {
    const [reports, setReports] = useState(MOCK_STAKEHOLDER_REPORTS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    
    const handleSaveReport = (report: StakeholderReport) => {
        setReports(prev => [report, ...prev]);
    };

    const selectedReport = reports.find(r => r.id === selectedReportId);

    if (selectedReport) {
        return <ReportDetail report={selectedReport} onBack={() => setSelectedReportId(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h2 className="text-2xl font-bold text-gray-900">Stakeholder Reports</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 sm:mt-0 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light"
                >
                    Create New Report
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audience</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reports.map(report => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{report.audience}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setSelectedReportId(report.id)} className="text-primary hover:text-primary-light">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <ReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveReport}
                availableMetrics={MOCK_METRICS}
            />
        </div>
    );
};