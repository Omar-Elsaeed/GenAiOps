
import React from 'react';
import type { DatasetInfo } from '../types';

interface DatasetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: DatasetInfo | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase">{label}</h4>
        <p className="text-sm text-slate-200">{value}</p>
    </div>
);

export const DatasetDetailModal: React.FC<DatasetDetailModalProps> = ({ isOpen, onClose, dataset }) => {
  if (!isOpen || !dataset) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-charcoal-dark text-slate-200 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">{dataset.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="p-4 bg-slate-800/50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailItem label="Source" value={dataset.source} />
            <DetailItem label="Records" value={dataset.recordCount.toLocaleString()} />
            <DetailItem label="Created At" value={dataset.createdAt} />
            <DetailItem label="Sensitivity" value={<span className="font-semibold text-primary-light">{dataset.sensitivity}</span>} />
          </div>
          
          {dataset.description && (
             <div>
                <h3 className="text-md font-semibold text-slate-300 mb-2">Description</h3>
                <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-md">{dataset.description}</p>
             </div>
          )}

          {dataset.schema && dataset.schema.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-slate-300 mb-2">Schema</h3>
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Field Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Data Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {dataset.schema.map((field, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-slate-200">{field.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-cyan-400">{field.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
