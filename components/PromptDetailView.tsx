import React, { useState, useEffect, useRef } from 'react';
import { MODEL_COSTS } from '../constants';
import { CloudArrowUpIcon } from '../constants';
import { getComplianceSuggestions } from '../services/geminiService';
import { PulsingText } from './Spinner';
import ReactMarkdown from 'react-markdown';
import type { View, RegisteredPrompt, PromptVersion, ComplianceCheckResult, DeployedArtifact, GovernancePolicy } from '../types';
import { NewDeploymentModal } from './NewDeploymentModal';

const SparklesIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L11 15l-4 6h10l-4-6 4.293-4.293a1 1 0 011.414 0L21 8m-5 13l-2.293-2.293a1 1 0 010-1.414L17 14l4-6H7l4 6-4.293 4.293a1 1 0 01-1.414 0L3 16" /></svg> );
const BeakerIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l-2.387-.477a2 2 0 01-.547-1.806l.477-2.387a6 6 0 013.86-.517l.318.158a6 6 0 003.86-.517l2.387.477a2 2 0 011.806.547a2 2 0 01.547 1.806l-.477 2.387a6 6 0 01-3.86.517l-.318-.158a6 6 0 00-3.86.517l-2.387.477a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86" /><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010.43 9.87v-1.284a1 1 0 00-1.43-.894L4.04 10.286a1 1 0 000 1.788l5.96 3.973a1 1 0 001.43-.894v-1.284a1 1 0 00-.571-.906z" /></svg> );

interface PromptDetailViewProps {
  promptId: string;
  prompts: RegisteredPrompt[];
  policies: GovernancePolicy[];
  navigate: (view: View, options?: { promptId?: string, prompt?: RegisteredPrompt }) => void;
  onAddDeployment: (deployment: Omit<DeployedArtifact, 'id' | 'deployedAt'>) => void;
}

const MetricCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <h4 className="text-sm font-medium text-slate-400">{title}</h4>
        <p className="text-2xl font-semibold text-slate-100 mt-1">{value}</p>
    </div>
);

const VersionHistoryTable: React.FC<{ versions: PromptVersion[] }> = ({ versions }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
            <thead>
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Version</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Created At</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
                {versions.map(v => (
                    <tr key={v.version} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-200">v{v.version}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{v.createdAt}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {v.deployed && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-500/30">
                                    <span className="w-2 h-2 mr-1.5 rounded-full bg-green-400"></span>
                                    Deployed
                                </span>
                            )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-primary hover:text-primary-light">Revert</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

interface ConfigurationTabProps {
  prompt: RegisteredPrompt;
}

const ConfigurationTab = React.forwardRef<HTMLTextAreaElement, ConfigurationTabProps>(
  function ConfigurationTab(props, ref) {
    const { prompt } = props;
    const [systemInstruction, setSystemInstruction] = useState(prompt.systemInstruction);
    const [isSaving, setIsSaving] = useState(false);
    const isModified = systemInstruction !== prompt.systemInstruction;

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert('Changes saved successfully! (Note: This is a simulation and will reset on page refresh)');
        }, 1500);
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="system-instruction" className="block text-sm font-medium text-slate-400 mb-1">System Instruction</label>
                <textarea
                    id="system-instruction"
                    ref={ref}
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-slate-900 text-slate-200 rounded-md border border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 font-mono text-sm"
                />
                 {isModified && (
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 disabled:bg-slate-500"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">User Prompt Template</label>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-md border border-slate-700 font-mono text-sm">{prompt.userPrompt}</div>
            </div>
        </div>
    );
});

const ComplianceResultCard: React.FC<{ result: ComplianceCheckResult }> = ({ result }) => {
    const statusInfo = {
        Pass: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-400', bg: 'bg-green-900/20' },
        Fail: { icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-red-400', bg: 'bg-red-900/20' },
        Warning: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    };
    const { icon, color, bg } = statusInfo[result.status];
    return (
        <div className={`p-4 rounded-lg border flex items-start space-x-4 ${bg} border-slate-700`}>
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 flex-shrink-0 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            <div>
                <h4 className="font-semibold text-slate-100">{result.policyName}: <span className={color}>{result.status}</span></h4>
                <p className="text-sm text-slate-300">{result.details}</p>
            </div>
        </div>
    );
};

const ComplianceTab: React.FC<{ prompt: RegisteredPrompt; policies: GovernancePolicy[] }> = ({ prompt, policies }) => {
    const [scanResults, setScanResults] = useState<ComplianceCheckResult[]>([]);
    const [isScanning, setIsScanning] = useState(true);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

    useEffect(() => {
        const runScan = () => {
            setIsScanning(true);
            setSuggestion(null);
            setTimeout(() => {
                const activePolicies = policies.filter(p => p.enabled);
                const results = activePolicies.map(policy => {
                    const result = policy.check(prompt);
                    return { ...result, policyName: policy.name };
                });
                setScanResults(results);
                setIsScanning(false);
            }, 500);
        };
        runScan();
    }, [prompt, policies]);

    const handleGetSuggestion = async () => {
        const failedChecks = scanResults.filter(r => r.status === 'Fail' || r.status === 'Warning');
        if (failedChecks.length === 0) return;
        setIsLoadingSuggestion(true);
        setSuggestion(null);
        try {
            const result = await getComplianceSuggestions(failedChecks, prompt);
            setSuggestion(result);
        } catch (e) {
            setSuggestion("Failed to get suggestions. Please try again.");
        } finally {
            setIsLoadingSuggestion(false);
        }
    };
    
    const failedOrWarningChecks = scanResults.filter(r => r.status !== 'Pass');

    return (
        <div>
            {isScanning ? (
                <PulsingText text="Scanning prompt against active policies..." />
            ) : (
                <div className="space-y-4">
                    {scanResults.map(result => <ComplianceResultCard key={result.policyId} result={result} />)}
                </div>
            )}
             {failedOrWarningChecks.length > 0 && !isScanning && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                     <button
                        onClick={handleGetSuggestion}
                        disabled={isLoadingSuggestion}
                        className="flex items-center space-x-2 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                     >
                        <SparklesIcon className="w-5 h-5"/>
                        <span>{isLoadingSuggestion ? 'Analyzing...' : 'Get AI Suggestion to fix'}</span>
                     </button>
                     {isLoadingSuggestion && <div className="mt-4"><PulsingText text="Gemini is analyzing..." /></div>}
                     {suggestion && (
                         <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                             <h4 className="text-md font-semibold text-slate-100 mb-2">Recommendation</h4>
                             <div className="prose prose-sm max-w-none prose-invert text-slate-300">
                                <ReactMarkdown>{suggestion}</ReactMarkdown>
                             </div>
                         </div>
                     )}
                </div>
            )}
        </div>
    );
};


const TabButton: React.FC<{isActive: boolean, onClick: ()=>void, children: React.ReactNode}> = ({isActive, onClick, children}) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
        {children}
    </button>
);


export const PromptDetailView: React.FC<PromptDetailViewProps> = ({ promptId, prompts, navigate, onAddDeployment, policies }) => {
  const prompt = prompts.find(p => p.id === promptId);
  const [activeTab, setActiveTab] = useState<'config' | 'history' | 'compliance'>('config');
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const configTabRef = useRef<HTMLTextAreaElement>(null);

  if (!prompt) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold">Prompt not found</h2>
        <button onClick={() => navigate('registry')} className="mt-4 text-primary hover:underline">
          Return to Registry
        </button>
      </div>
    );
  }
  
  const handleEdit = () => {
    setActiveTab('config');
    setTimeout(() => {
        configTabRef.current?.focus();
        configTabRef.current?.select();
    }, 0);
  };

  return (
    <>
        <div className="space-y-6">
          <div>
            <button onClick={() => navigate('registry')} className="text-sm text-primary hover:underline mb-2">
                &larr; Back to Registry
            </button>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h2 className="text-2xl font-bold text-slate-100">{prompt.name} (v{prompt.version})</h2>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                     <button
                        onClick={() => navigate('playground', { prompt })}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-slate-100 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-600 transition-colors"
                     >
                        <SparklesIcon className="w-5 h-5"/>
                        <span>Test in Playground</span>
                     </button>
                     <button 
                        onClick={handleEdit}
                        className="px-4 py-2 bg-charcoal border border-slate-700 text-slate-100 text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                     >
                        Edit
                    </button>
                    <button 
                        onClick={() => setIsDeployModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light transition-colors"
                    >
                        <CloudArrowUpIcon className="w-5 h-5"/>
                        <span>Deploy</span>
                    </button>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-charcoal p-6 rounded-xl border border-slate-800 shadow-sm">
                    <div className="border-b border-slate-700 mb-6">
                        <nav className="flex space-x-4" aria-label="Tabs">
                            <TabButton isActive={activeTab === 'config'} onClick={() => setActiveTab('config')}>Configuration</TabButton>
                            <TabButton isActive={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')}>Compliance</TabButton>
                            <TabButton isActive={activeTab === 'history'} onClick={() => setActiveTab('history')}>Version History</TabButton>
                        </nav>
                    </div>
                    <div>
                        {activeTab === 'config' && <ConfigurationTab prompt={prompt} ref={configTabRef} />}
                        {activeTab === 'compliance' && <ComplianceTab prompt={prompt} policies={policies} />}
                        {activeTab === 'history' && <VersionHistoryTable versions={prompt.versionHistory} />}
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                 <div className="bg-charcoal p-6 rounded-xl border border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">Actions</h3>
                     <div className="space-y-3">
                         <button 
                            onClick={() => navigate('ab-testing')}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-accent text-slate-900 font-semibold rounded-lg shadow-sm hover:bg-amber-500 transition-colors"
                         >
                            <BeakerIcon className="w-5 h-5"/>
                            <span>Create A/B Test</span>
                        </button>
                     </div>
                </div>
                <div className="bg-charcoal p-6 rounded-xl border border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">Performance Metrics</h3>
                    <div className="space-y-3">
                        <MetricCard title="Avg. Latency" value={`${prompt.avgLatency}ms`} />
                        <MetricCard title="Cost / 1k Tokens" value={`$${(MODEL_COSTS[prompt.model] || 0).toFixed(5)}`} />
                        <MetricCard title="Usage (24h)" value={prompt.usage24h.toLocaleString()} />
                        <MetricCard title="Error Rate" value={`${prompt.errorRate}%`} />
                    </div>
                </div>
            </div>
          </div>
        </div>
         {isDeployModalOpen && (
             <NewDeploymentModal
                isOpen={isDeployModalOpen}
                onClose={() => setIsDeployModalOpen(false)}
                onSave={(deployment) => {
                    onAddDeployment(deployment);
                    setIsDeployModalOpen(false);
                }}
                agents={[]}
                prompts={[prompt]}
                initialSelection={{ type: 'Prompt', id: prompt.id }}
            />
        )}
    </>
  );
};