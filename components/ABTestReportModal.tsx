
import React from 'react';
import type { ABTest, RegisteredPrompt } from '../types';

interface ABTestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: ABTest | null;
  prompts: RegisteredPrompt[];
}

const TestStatusBadge: React.FC<{ status: ABTest['status'] }> = ({ status }) => {
    const statusClasses = {
        running: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
        completed: 'bg-green-900/50 text-green-300 border border-green-500/30',
        draft: 'bg-slate-700 text-slate-300 border border-slate-600',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusClasses[status]}`}>
            {status}
        </span>
    );
};

export const ABTestReportModal: React.FC<ABTestReportModalProps> = ({ isOpen, onClose, test, prompts }) => {
  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-charcoal rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-start p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">A/B Test Report: <span className="text-primary">{test.name}</span></h2>
            <div className="mt-1 flex items-center space-x-2">
                <TestStatusBadge status={test.status} />
                <span className="text-xs text-slate-500">Created: {test.createdAt}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {test.variants.map(variant => {
              const prompt = prompts.find(p => p.id === variant.promptId);
              const isWinner = test.winner === variant.id;
              return (
                <div key={variant.id} className={`p-4 rounded-lg border-2 ${isWinner ? 'border-secondary bg-cyan-900/20' : 'border-slate-700 bg-slate-800/40'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-100">Variant {variant.id}</h3>
                    {isWinner && <span className="px-3 py-1 text-sm font-bold text-slate-900 bg-secondary rounded-full">WINNER</span>}
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{prompt?.name} (v{variant.promptVersion})</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-600 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase">Performance Metrics</h4>
                    {test.status === 'completed' ? (
                      <>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Quality Score:</span> <span className="font-semibold text-slate-100">{variant.qualityScore}/10</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Avg. Latency:</span> <span className="font-semibold text-slate-100">{variant.avgLatency}ms</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Cost/Response:</span> <span className="font-semibold text-slate-100">${variant.costPerResponse}</span></div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Results will be available once the test is complete.</p>
                    )}
                  </div>
                  
                  {variant.sampleResponses && variant.sampleResponses.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-slate-600 space-y-2">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase">Sample Responses</h4>
                        <div className="space-y-3">
                            {variant.sampleResponses.map((res, i) => (
                                <p key={i} className="text-sm text-slate-300 p-2 bg-slate-700/50 rounded-md border border-slate-600 italic">"{res}"</p>
                            ))}
                        </div>
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
