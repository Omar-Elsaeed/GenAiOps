
import React from 'react';
import type { SecurityFinding } from '../types';

interface SecurityFindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: SecurityFinding | null;
}

const SeverityBadge: React.FC<{ severity: SecurityFinding['severity'] }> = ({ severity }) => {
    const severityClasses = {
        critical: 'bg-red-900/50 text-red-300 border border-red-500/30',
        high: 'bg-orange-900/50 text-orange-300 border border-orange-500/30',
        medium: 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30',
        low: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${severityClasses[severity]}`}>
            {severity}
        </span>
    );
};

export const SecurityFindingModal: React.FC<SecurityFindingModalProps> = ({ isOpen, onClose, finding }) => {
  if (!isOpen || !finding) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-charcoal rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Security Finding Details</h2>
            <p className="text-sm text-slate-400">{finding.type}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
            <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Timestamp</span>
                <p className="font-mono text-sm text-slate-200">{finding.timestamp}</p>
            </div>
            <div>
                <span className="text-xs font-semibold text-slate-400 uppercase text-right block">Severity</span>
                <SeverityBadge severity={finding.severity} />
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-slate-200 mb-1">Details</h3>
            <p className="text-slate-300">{finding.details}</p>
          </div>

          <div>
            <h3 className="text-md font-semibold text-slate-200 mb-1">Triggering Prompt</h3>
            <div className="p-3 bg-slate-900 rounded-lg font-mono text-sm text-slate-300 border border-slate-700">
                <pre className="whitespace-pre-wrap"><code>{finding.prompt}</code></pre>
            </div>
          </div>
           <div>
            <h3 className="text-md font-semibold text-slate-200 mb-1">AI Response</h3>
            <div className="p-3 bg-slate-900 rounded-lg font-mono text-sm text-slate-300 border border-slate-700">
                <pre className="whitespace-pre-wrap"><code>{finding.response}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
