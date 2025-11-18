import React, { useState, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MOCK_SECURITY_FINDINGS, MOCK_BIAS_FINDINGS, LightBulbIcon, ShieldCheckIcon, KeyIcon, ScaleIcon, ChatBubbleLeftRightIcon } from '../constants';
import { explainResponse, scanForPII, PIIFinding } from '../services/geminiService';
import type { SecurityFinding, BiasFinding, DatasetInfo } from '../types';
import { PulsingText } from './Spinner';
import { SecurityFindingModal } from './SecurityFindingModal';
import EthicalCharter from './EthicalCharter';

const principles = [
    { id: 'ethics', name: 'Ethical AI', icon: LightBulbIcon, description: 'Align AI behavior with human values and ethical guidelines.' },
    { id: 'security', name: 'Secure AI', icon: ShieldCheckIcon, description: 'Protect against adversarial attacks and ensure system integrity.' },
    { id: 'privacy', name: 'Privacy-preserving AI', icon: KeyIcon, description: 'Safeguard user data and ensure responsible information handling.' },
    { id: 'fairness', name: 'Fair AI', icon: ScaleIcon, description: 'Identify and mitigate unintended bias to ensure equitable outcomes.' },
    { id: 'explainability', name: 'Explainable AI (XAI)', icon: ChatBubbleLeftRightIcon, description: 'Understand and interpret the reasoning behind model decisions.' },
];

const MetricDisplayCard: React.FC<{ title: string; value: string; description: string }> = ({ title, value, description }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 transition-all hover:border-primary/50 group relative">
        <h4 className="text-sm font-medium text-slate-400 truncate">{title}</h4>
        <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {description}
        </div>
    </div>
);

const SeverityBadge: React.FC<{ severity: SecurityFinding['severity'] }> = ({ severity }) => {
    const severityClasses = {
        critical: 'bg-red-900/50 text-red-300 border border-red-500/30',
        high: 'bg-orange-900/50 text-orange-300 border border-orange-500/30',
        medium: 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30',
        low: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
    };
    return (
        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${severityClasses[severity]}`}>
            {severity}
        </span>
    );
};

const SecurityTab: React.FC<{ onViewDetails: (finding: SecurityFinding) => void }> = ({ onViewDetails }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-md font-semibold text-slate-200 mb-2">Threat Modeling</h3>
            <p className="text-sm text-slate-400 mb-4">Identify and track mitigations for common AI security threats.</p>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                     <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Threat</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Mitigation Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        <tr>
                            <td className="px-4 py-2 text-sm text-slate-200">Prompt Injection</td>
                            <td className="px-4 py-2 text-sm text-slate-400">User input overrides system instructions.</td>
                            <td className="px-4 py-2 text-sm"><span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300">Mitigated</span></td>
                        </tr>
                         <tr>
                            <td className="px-4 py-2 text-sm text-slate-200">Data Poisoning</td>
                            <td className="px-4 py-2 text-sm text-slate-400">Training data is corrupted to compromise model.</td>
                            <td className="px-4 py-2 text-sm"><span className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300">In Progress</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <h3 className="text-md font-semibold text-slate-200 mt-6 mb-2">Recent Security Findings</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Threat Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Severity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {MOCK_SECURITY_FINDINGS.map(finding => (
                            <tr key={finding.id} className="hover:bg-slate-900/50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-200">{finding.type}</td>
                                <td className="px-4 py-3 text-sm"><SeverityBadge severity={finding.severity} /></td>
                                <td className="px-4 py-3 text-sm text-slate-400 max-w-sm truncate">{finding.details}</td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <button onClick={() => onViewDetails(finding)} className="font-medium text-primary hover:text-primary-light transition-colors">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PIIScanner: React.FC = () => {
    const [text, setText] = useState('My name is John Doe, and my email is john.doe@example.com. Please call me at 123-456-7890.');
    const [result, setResult] = useState<{ original: string; redacted: string; findings: PIIFinding[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleScan = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const { findings } = await scanForPII(text);
            let redactedText = text;
            const sortedFindings = [...findings].sort((a, b) => b.startIndex - a.startIndex);
            sortedFindings.forEach(finding => {
                const replacement = `[${finding.type}]`;
                redactedText = redactedText.slice(0, finding.startIndex) + replacement + redactedText.slice(finding.startIndex + finding.text.length);
            });
            setResult({ original: text, redacted: redactedText, findings });
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const getHighlightedText = () => {
        if (!result || result.findings.length === 0) return text;
        let lastIndex = 0;
        const parts: React.ReactNode[] = [];
        const sortedFindings = [...result.findings].sort((a, b) => a.startIndex - b.startIndex);
        sortedFindings.forEach((finding, i) => {
            if (finding.startIndex > lastIndex) {
                parts.push(text.substring(lastIndex, finding.startIndex));
            }
            parts.push(<mark key={i} className="bg-yellow-400/30 text-yellow-200 px-1 rounded">{finding.text}</mark>);
            lastIndex = finding.startIndex + finding.text.length;
        });
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        return parts;
    };
    
    return (
        <div className="space-y-4">
             <h3 className="text-md font-semibold text-slate-200">PII Scanner</h3>
             <p className="text-sm text-slate-400">Scan text for Personally Identifiable Information (PII) to ensure user privacy is protected.</p>
             <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="w-full p-2 bg-slate-900 rounded-md border border-slate-700 font-mono text-sm"/>
             <button onClick={handleScan} disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold disabled:bg-slate-500">
                 {isLoading ? "Scanning..." : "Scan for PII"}
            </button>
            {isLoading && <PulsingText text="Analyzing text for PII..." />}
            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Original with Highlights ({result.findings.length} found)</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{getHighlightedText()}</p>
                    </div>
                     <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Redacted Version</h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-mono">{result.redacted}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExplainabilityTool: React.FC = () => {
    const [prompt, setPrompt] = useState('Write a short poem about the moon.');
    const [response, setResponse] = useState('Silver orb in velvet night,\nA silent watchman, bathed in light.\nCasting shadows, soft and long,\nWhispering a cosmic song.');
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleExplain = async () => {
        setIsLoading(true);
        setExplanation('');
        try {
            const result = await explainResponse('', prompt, response);
            setExplanation(result);
        } catch (e) {
            setExplanation('Failed to generate explanation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-md font-semibold text-slate-200">Model Decision Explanation</h3>
            <p className="text-sm text-slate-400">Generate a plain-language explanation for why a model produced a specific output for a given input.</p>
            <div>
                <label className="text-xs font-semibold text-slate-400">User Prompt</label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} className="w-full p-2 bg-slate-900 rounded-md border border-slate-700 text-sm"/>
            </div>
             <div>
                <label className="text-xs font-semibold text-slate-400">Model Response</label>
                <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3} className="w-full p-2 bg-slate-900 rounded-md border border-slate-700 text-sm"/>
            </div>
            <button onClick={handleExplain} disabled={isLoading || !prompt || !response} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold disabled:bg-slate-500">
                {isLoading ? "Generating..." : "Generate Explanation"}
            </button>
            {isLoading && <PulsingText text="Analyzing model response..." />}
            {explanation && (
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <h4 className="font-semibold text-slate-100 mb-2">Explanation</h4>
                    <ReactMarkdown className="prose prose-sm max-w-none prose-invert text-slate-300">{explanation}</ReactMarkdown>
                </div>
            )}
        </div>
    );
};

const MetricChartCard: React.FC<{ title: string; value: number; description: string; domain: [number, number]; target: 'high' | 'low' }> = ({ title, value, description, domain, target }) => {
    const data = [{ name: title, value }];
    const targetColor = target === 'high' ? '#22C55E' : '#F97316';
    
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 transition-all hover:border-primary/50 group relative">
            <h4 className="text-sm font-medium text-slate-400 truncate">{title}</h4>
            <div className="flex items-baseline space-x-2 mt-1">
                 <p className="text-3xl font-bold text-slate-100">{value.toFixed(2)}</p>
                 <div className="h-8 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                             <XAxis type="number" hide domain={domain} />
                             <YAxis type="category" dataKey="name" hide />
                             <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                formatter={(val: number) => val.toFixed(2)}
                             />
                             <Bar dataKey="value" fill={targetColor} background={{ fill: 'rgba(71, 85, 105, 0.4)', radius: 4 }} radius={[4, 4, 4, 4]} barSize={8}/>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                {description}
            </div>
        </div>
    )
};

type BiasMetric = 'Demographic Parity' | 'Equalized Odds' | 'Predictive Equality';

interface BiasAnalysisResult {
    'Demographic Parity': { findings: BiasFinding[], score: number };
    'Equalized Odds': { findings: BiasFinding[], score: number };
    'Predictive Equality': { findings: BiasFinding[], score: number };
}

const FairnessTab: React.FC<{ datasets: DatasetInfo[]; onSaveDataset: (dataset: DatasetInfo) => void; }> = ({ datasets, onSaveDataset }) => {
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || '');
    const [selectedMetric, setSelectedMetric] = useState<BiasMetric>('Demographic Parity');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<BiasAnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newDataset: DatasetInfo = {
                id: `ds-upload-${Date.now()}`,
                name: file.name,
                source: 'Local Upload',
                description: `Uploaded on ${new Date().toLocaleDateString()}`,
                status: 'available',
                recordCount: Math.floor(Math.random() * 10000) + 1000,
                createdAt: new Date().toISOString().split('T')[0],
                sensitivity: 'Confidential',
            };
            onSaveDataset(newDataset);
            setSelectedDatasetId(newDataset.id);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleAnalyze = () => {
        if (!selectedDatasetId) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setTimeout(() => {
            const parityFindings: BiasFinding[] = MOCK_BIAS_FINDINGS.map(f => ({ ...f, metric: 'Selection Rate', value: Math.random() * 0.2 + 0.45, threshold: 0.5 }));
            const oddsFindings: BiasFinding[] = MOCK_BIAS_FINDINGS.map(f => ({ ...f, metric: 'False Positive Rate', value: Math.random() * 0.1 + 0.05, threshold: 0.1 }));
            const equalityFindings: BiasFinding[] = MOCK_BIAS_FINDINGS.map(f => ({ ...f, metric: 'Positive Predictive Value', value: Math.random() * 0.15 + 0.8, threshold: 0.85 }));

            const newResult: BiasAnalysisResult = {
                'Demographic Parity': { findings: parityFindings, score: 0.92 },
                'Equalized Odds': { findings: oddsFindings, score: 0.88 },
                'Predictive Equality': { findings: equalityFindings, score: 0.95 },
            };
            setAnalysisResult(newResult);
            setIsAnalyzing(false);
        }, 1500);
    };

    const displayedAnalysis = useMemo(() => {
        if (!analysisResult) return null;

        const metricData = analysisResult[selectedMetric];
        const chartDataKey = metricData.findings[0]?.metric || '';
        
        const chartData = metricData.findings.map(finding => ({
            name: finding.demographic,
            [chartDataKey]: finding.value,
            threshold: finding.threshold,
        }));

        const descriptions: Record<BiasMetric, string> = {
            'Demographic Parity': 'Measures if positive outcomes are equal across groups. Closer to 1.0 is better.',
            'Equalized Odds': 'Checks if model performs equally well (true/false positives) for all groups. Closer to 1.0 is better.',
            'Predictive Equality': 'Ensures model predictions are equally precise for all groups. Closer to 1.0 is better.',
        };

        return {
            findings: metricData.findings,
            score: metricData.score,
            chartData,
            chartDataKey,
            title: `Fairness Score (${selectedMetric})`,
            description: descriptions[selectedMetric]
        };
    }, [analysisResult, selectedMetric]);

    return (
        <div className="space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept=".csv,.json" />
            <div>
                <h3 className="text-md font-semibold text-slate-200 mb-2">Bias Detection Tool</h3>
                <p className="text-sm text-slate-400 mb-4">Select a dataset and fairness metric to analyze for potential bias across demographic groups.</p>
                <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dataset-select" className="block text-xs font-semibold text-slate-400 mb-1">Select Dataset</label>
                            <select
                                id="dataset-select"
                                value={selectedDatasetId}
                                onChange={(e) => setSelectedDatasetId(e.target.value)}
                                className="w-full p-2 bg-slate-900 rounded-md border border-slate-600 text-sm"
                            >
                                {datasets.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="metric-select" className="block text-xs font-semibold text-slate-400 mb-1">Select Metric</label>
                            <select
                                id="metric-select"
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value as BiasMetric)}
                                className="w-full p-2 bg-slate-900 rounded-md border border-slate-600 text-sm"
                            >
                                <option value="Demographic Parity">Demographic Parity</option>
                                <option value="Equalized Odds">Equalized Odds</option>
                                <option value="Predictive Equality">Predictive Equality</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold bg-slate-700 rounded-md hover:bg-slate-600">Upload Dataset</button>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !selectedDatasetId}
                            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold disabled:bg-slate-500 flex-grow"
                        >
                            {isAnalyzing ? "Analyzing..." : "Analyze for Bias"}
                        </button>
                    </div>
                </div>
            </div>

            {isAnalyzing && <PulsingText text="Analyzing dataset for bias..." />}
            
            {displayedAnalysis && (
                 <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MetricChartCard title={displayedAnalysis.title} value={displayedAnalysis.score} description={displayedAnalysis.description} domain={[0, 1]} target="high" />
                        <MetricChartCard title="Toxicity Score" value={0.08} description="Average toxicity in generated responses. Lower is better." domain={[0, 1]} target="low" />
                     </div>
                     
                     <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-4">{displayedAnalysis.chartDataKey} by Demographic</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={displayedAnalysis.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey={displayedAnalysis.chartDataKey} fill="#F97316" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     </div>

                    <div className="overflow-x-auto">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Detailed Findings</h4>
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Demographic</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Metric</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Value</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Threshold</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {displayedAnalysis.findings.map(finding => (
                                    <tr key={finding.id}>
                                        <td className="px-4 py-2 text-sm text-slate-200">{finding.demographic}</td>
                                        <td className="px-4 py-2 text-sm text-slate-400">{finding.metric}</td>
                                        <td className="px-4 py-2 text-sm text-slate-200">{finding.value.toFixed(3)}</td>
                                        <td className="px-4 py-2 text-sm text-slate-400">{finding.threshold}</td>
                                        <td className="px-4 py-2 text-sm">{finding.isBiased ? <span className="text-red-400 font-semibold">Bias Detected</span> : <span className="text-green-400">Passed</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const PrincipleCard: React.FC<{
  principle: typeof principles[0];
  children: React.ReactNode;
}> = ({ principle, children }) => {
  const [isOpen, setIsOpen] = useState(principle.id === 'ethics'); // Default open Ethical AI
  return (
    <div className="bg-charcoal p-6 rounded-xl border border-slate-800 shadow-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <principle.icon className="w-8 h-8 text-primary-light" />
            <div>
              <h3 className="text-xl font-semibold text-slate-100">{principle.name}</h3>
              <p className="text-sm text-slate-400">{principle.description}</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>
      {isOpen && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
};

interface ResponsibleAIViewProps {
    datasets: DatasetInfo[];
    onSaveDataset: (dataset: DatasetInfo) => void;
}

export const ResponsibleAIView: React.FC<ResponsibleAIViewProps> = ({ datasets, onSaveDataset }) => {
    const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
    const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);

    const handleViewFindingDetails = (finding: SecurityFinding) => {
        setSelectedFinding(finding);
        setIsFindingModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">Responsible AI Dashboard</h2>
            
            <div className="bg-charcoal p-6 rounded-xl border border-slate-800 shadow-lg">
                <h3 className="text-xl font-semibold text-slate-100 mb-4">Key AI Health Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricDisplayCard title="Toxicity Score" value="0.08" description="Average toxicity score in generated responses across adversarial tests. Lower is better." />
                    <MetricDisplayCard title="Explainability Score" value="8.5/10" description="Average user rating on the clarity and helpfulness of model explanations (XAI)." />
                </div>
            </div>

            <div className="space-y-4">
                <PrincipleCard principle={principles[0]}>
                    <EthicalCharter />
                </PrincipleCard>
                <PrincipleCard principle={principles[1]}><SecurityTab onViewDetails={handleViewFindingDetails} /></PrincipleCard>
                <PrincipleCard principle={principles[2]}><PIIScanner /></PrincipleCard>
                <PrincipleCard principle={principles[3]}><FairnessTab datasets={datasets} onSaveDataset={onSaveDataset} /></PrincipleCard>
                <PrincipleCard principle={principles[4]}><ExplainabilityTool /></PrincipleCard>
            </div>

            <SecurityFindingModal
                isOpen={isFindingModalOpen}
                onClose={() => setIsFindingModalOpen(false)}
                finding={selectedFinding}
            />
        </div>
    );
};