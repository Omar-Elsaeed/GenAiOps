

import React, { useState } from 'react';
import type { ABTest, RegisteredPrompt, ABTestVariant } from '../types';
import { ABTestReportModal } from './ABTestReportModal';

interface ABTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (test: ABTest) => void;
    prompts: RegisteredPrompt[];
}

const ABTestModal: React.FC<ABTestModalProps> = ({ isOpen, onClose, onSave, prompts }) => {
    const [name, setName] = useState('');
    const [variantA, setVariantA] = useState<string>('');
    const [variantB, setVariantB] = useState<string>('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim() || !variantA || !variantB) {
            setError('Test name and both variants are required.');
            return;
        }
        if (variantA === variantB) {
            setError('Variants A and B cannot be the same prompt.');
            return;
        }

        const promptA = prompts.find(p => p.id === variantA);
        const promptB = prompts.find(p => p.id === variantB);
        if (!promptA || !promptB) {
             setError('Selected prompts not found.');
             return;
        }

        const newTest: ABTest = {
            id: `ab-${Date.now()}`,
            name,
            status: 'running',
            createdAt: new Date().toISOString().split('T')[0],
            winner: null,
            variants: [
                { id: 'A', promptId: promptA.id, promptVersion: promptA.version },
                { id: 'B', promptId: promptB.id, promptVersion: promptB.version },
            ],
        };

        onSave(newTest);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-charcoal-dark text-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl m-4 border border-slate-700" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold">Create New A/B Test</h2>
                </header>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="test-name" className="block text-sm font-medium text-slate-300">Test Name</label>
                        <input type="text" id="test-name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="variant-a" className="block text-sm font-medium text-slate-300">Variant A</label>
                            <select id="variant-a" value={variantA} onChange={e => setVariantA(e.target.value)} className="mt-1 block w-full p-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm">
                                <option value="">Select a prompt</option>
                                {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="variant-b" className="block text-sm font-medium text-slate-300">Variant B</label>
                            <select id="variant-b" value={variantB} onChange={e => setVariantB(e.target.value)} className="mt-1 block w-full p-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm">
                                <option value="">Select a prompt</option>
                                {prompts.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>)}
                            </select>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
                <footer className="p-4 border-t border-slate-700 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg">Start Test</button>
                </footer>
            </div>
        </div>
    );
};

const TestStatusBadge: React.FC<{ status: ABTest['status'] }> = ({ status }) => {
    const statusClasses = {
        running: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
        completed: 'bg-green-900/50 text-green-300 border border-green-500/30',
        draft: 'bg-slate-700 text-slate-300 border border-slate-600',
    };
    const statusDotClasses = {
        running: 'bg-blue-400 animate-pulse',
        completed: 'bg-green-400',
        draft: 'bg-slate-400',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusClasses[status]}`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${statusDotClasses[status]}`}></span>
            {status}
        </span>
    );
};

const ABTestCard: React.FC<{ test: ABTest; prompts: RegisteredPrompt[]; onViewReport: (test: ABTest) => void; }> = ({ test, prompts, onViewReport }) => {
  return (
    <div className="bg-charcoal p-6 rounded-xl border border-slate-800 hover:border-primary/50 transition-colors duration-300 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{test.name}</h3>
          <p className="text-sm text-slate-400">Created: {test.createdAt}</p>
        </div>
        <TestStatusBadge status={test.status} />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {test.variants.map(variant => (
          <div key={variant.id} className={`p-4 rounded-lg border-2 ${test.winner === variant.id ? 'border-secondary bg-cyan-900/20' : 'border-slate-700'}`}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-100">Prompt {variant.id}</h4>
              {test.winner === variant.id && <span className="text-xs font-bold text-secondary-light">WINNER</span>}
            </div>
             <p className="text-xs text-slate-400 mt-1">{prompts.find(p=>p.id === variant.promptId)?.name} (v{variant.promptVersion})</p>
            <div className="mt-2 text-sm space-y-1 text-slate-300">
                {test.status === 'completed' ? (
                    <>
                        <p><strong>Quality Score:</strong> {variant.qualityScore}/10</p>
                        <p><strong>Avg. Latency:</strong> {variant.avgLatency}ms</p>
                        <p><strong>Cost/Response:</strong> ${variant.costPerResponse}</p>
                    </>
                ) : (
                    <p className="text-xs text-slate-500 italic">Results will be available once the test is complete.</p>
                )}
            </div>
          </div>
        ))}
      </div>
       <div className="text-right mt-4">
          <button onClick={() => onViewReport(test)} className="text-primary hover:text-primary-light transition-colors text-sm font-medium">View Full Report</button>
       </div>
    </div>
  );
};

interface ABTestingViewProps {
  tests: ABTest[];
  prompts: RegisteredPrompt[];
  onSaveTest: (test: ABTest) => void;
}

export const ABTestingView: React.FC<ABTestingViewProps> = ({ tests, prompts, onSaveTest }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  const filteredTests = tests.filter(test => {
    if (statusFilter === 'all') return true;
    return test.status === statusFilter;
  });

  const handleSaveTest = (test: ABTest) => {
      onSaveTest(test);
  };
  
  const handleViewReport = (test: ABTest) => {
      setSelectedTest(test);
      setIsReportModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <h2 className="text-2xl font-bold text-slate-100">A/B Prompt Testing</h2>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="relative">
                <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'running' | 'completed')}
                    className="appearance-none bg-charcoal border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-3 pr-10 py-2"
                >
                    <option value="all">All Statuses</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={prompts.length < 2}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200 disabled:bg-slate-500 disabled:cursor-not-allowed"
              title={prompts.length < 2 ? "You need at least two prompts in the registry to create a test." : "Create a new A/B test"}
            >
              <span>Create New Test</span>
            </button>
        </div>
      </div>
      <div className="space-y-4">
        {filteredTests.length > 0 ? (
            filteredTests.map(test => (
            <ABTestCard key={test.id} test={test} prompts={prompts} onViewReport={handleViewReport} />
            ))
        ) : (
            <div className="text-center py-16 bg-charcoal rounded-xl border border-slate-800 shadow-sm">
                <p className="text-lg font-medium text-slate-300">No A/B Tests Found</p>
                <p className="text-slate-400 mt-2">
                    {statusFilter === 'all' ? 'Create your first A/B test to compare prompt performance.' : `No tests found with the status "${statusFilter}".`}
                </p>
            </div>
        )}
      </div>
      <ABTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTest}
        prompts={prompts}
      />
       <ABTestReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        test={selectedTest}
        prompts={prompts}
      />
    </div>
  );
};
