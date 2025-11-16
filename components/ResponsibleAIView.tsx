

import React, { useState } from 'react';
import { MOCK_SECURITY_FINDINGS, MOCK_BIAS_FINDINGS } from '../constants';
import type { SecurityFinding, BiasFinding } from '../types';
import { SecurityFindingModal } from './SecurityFindingModal';

const SecurityFindingCard: React.FC<{ finding: SecurityFinding; onDetailsClick: (finding: SecurityFinding) => void; }> = ({ finding, onDetailsClick }) => {
    const severityClasses = {
        critical: 'border-red-500/30 bg-red-900/40 text-red-300',
        high: 'border-orange-500/30 bg-orange-900/40 text-orange-300',
        medium: 'border-yellow-500/30 bg-yellow-900/40 text-yellow-300',
        low: 'border-blue-500/30 bg-blue-900/40 text-blue-300'
    };

    return (
        <div className={`p-4 rounded-lg border ${severityClasses[finding.severity]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-slate-100">{finding.type}</h4>
                    <span className="text-xs text-slate-500 capitalize">{finding.severity} Severity &middot; {finding.timestamp}</span>
                </div>
                <button onClick={() => onDetailsClick(finding)} className="text-xs text-primary-light hover:underline">Details</button>
            </div>
            <p className="text-sm text-slate-400 mt-2">{finding.details}</p>
        </div>
    );
}


const SecurityTab: React.FC<{ onDetailsClick: (finding: SecurityFinding) => void; }> = ({ onDetailsClick }) => (
    <div className="space-y-4">
        {MOCK_SECURITY_FINDINGS.map(finding => (
            <SecurityFindingCard key={finding.id} finding={finding} onDetailsClick={onDetailsClick} />
        ))}
    </div>
);

const BiasFairnessTab: React.FC = () => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
            <thead>
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Demographic Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Threshold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
                {MOCK_BIAS_FINDINGS.map((finding) => (
                    <tr key={finding.id} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{finding.demographic}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{finding.metric}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{finding.value.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{finding.threshold.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {finding.isBiased ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-900/50 text-red-300">
                                    <span className="w-2 h-2 mr-1.5 rounded-full bg-red-400"></span>
                                    Bias Detected
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-900/50 text-green-300">
                                    <span className="w-2 h-2 mr-1.5 rounded-full bg-green-400"></span>
                                    Passed
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'
        }`}
    >
        {children}
    </button>
);


export const ResponsibleAIView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bias' | 'security' | 'explainability'>('bias');
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleDetailsClick = (finding: SecurityFinding) => {
    setSelectedFinding(finding);
    setIsFindingModalOpen(true);
  };
  
  const handleRunAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
        setIsScanning(false);
        alert('Scan complete! No new findings detected.');
    }, 2500);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <h2 className="text-2xl font-bold text-slate-100">Responsible AI</h2>
            <button 
                onClick={handleRunAudit}
                disabled={isScanning}
                className="mt-4 sm:mt-0 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light transition duration-200 disabled:bg-slate-500 disabled:cursor-wait"
            >
                {isScanning ? 'Scanning...' : 'Run New Audit'}
            </button>
        </div>
      
      <div className="bg-charcoal p-6 rounded-xl border border-slate-800 shadow-sm">
        <div className="border-b border-slate-700 mb-6">
            <nav className="flex space-x-4" aria-label="Tabs">
                <TabButton isActive={activeTab === 'bias'} onClick={() => setActiveTab('bias')}>Bias & Fairness</TabButton>
                <TabButton isActive={activeTab === 'security'} onClick={() => setActiveTab('security')}>Security</TabButton>
                <TabButton isActive={activeTab === 'explainability'} onClick={() => setActiveTab('explainability')}>Explainability</TabButton>
            </nav>
        </div>

        <div>
            {activeTab === 'bias' && <BiasFairnessTab />}
            {activeTab === 'security' && <SecurityTab onDetailsClick={handleDetailsClick} />}
            {activeTab === 'explainability' && <p className="text-center text-slate-400 py-8">Explainability reports and tools are coming soon.</p>}
        </div>
      </div>
       <SecurityFindingModal
        isOpen={isFindingModalOpen}
        onClose={() => setIsFindingModalOpen(false)}
        finding={selectedFinding}
      />
    </div>
  );
};
