
import React, { useState, useEffect, useRef } from 'react';
import type { DatasetInfo, DatasetSensitivity } from '../types';

interface NewDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataset: DatasetInfo) => void;
}

const SENSITIVITY_LEVELS: DatasetSensitivity[] = ['Public', 'Internal', 'Confidential', 'PII'];

export const NewDatasetModal: React.FC<NewDatasetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [sensitivity, setSensitivity] = useState<DatasetSensitivity>('Internal');
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setSource('');
      setSensitivity('Internal');
      setError('');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !source.trim()) {
      setError('Dataset Name and Source are required.');
      return;
    }
    const newDataset: DatasetInfo = {
      id: `ds-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      source: source.trim(),
      sensitivity,
      status: 'available',
      recordCount: Math.floor(Math.random() * 50000),
      createdAt: new Date().toISOString().split('T')[0],
      qualityScore: Math.floor(Math.random() * 20) + 75, // Random initial quality score
      schema: [], // Schema would be inferred in a real app
    };
    onSave(newDataset);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-charcoal-dark text-slate-200 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Define New Dataset</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="dataset-name" className="block text-sm font-medium text-slate-300 mb-2">Dataset Name</label>
            <input
              type="text"
              id="dataset-name"
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-slate-800 rounded-md border border-slate-600 focus:ring-primary focus:border-primary"
            />
          </div>
           <div>
            <label htmlFor="dataset-source" className="block text-sm font-medium text-slate-300 mb-2">Source</label>
            <input
              type="text"
              id="dataset-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., BigQuery, S3 Bucket, Zendesk"
              className="w-full p-2 bg-slate-800 rounded-md border border-slate-600 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="dataset-description" className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              id="dataset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 bg-slate-800 rounded-md border border-slate-600 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="dataset-sensitivity" className="block text-sm font-medium text-slate-300 mb-2">Sensitivity Level</label>
            <select
              id="dataset-sensitivity"
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value as DatasetSensitivity)}
              className="w-full p-2 bg-slate-800 rounded-md border border-slate-600 focus:ring-primary focus:border-primary"
            >
              {SENSITIVITY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
        <footer className="flex justify-end items-center p-4 border-t border-slate-700 space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm">Save Dataset</button>
        </footer>
      </div>
    </div>
  );
};
