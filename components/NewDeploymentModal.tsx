
import React, { useState, useEffect } from 'react';
import type { DeployedArtifact, AIAgent, RegisteredPrompt } from '../types';

interface NewDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deployment: Omit<DeployedArtifact, 'id' | 'deployedAt'>) => void;
  agents: AIAgent[];
  prompts: RegisteredPrompt[];
  initialSelection?: { type: 'Agent' | 'Prompt', id: string };
}

export const NewDeploymentModal: React.FC<NewDeploymentModalProps> = ({ isOpen, onClose, onSave, agents, prompts, initialSelection }) => {
  const [artifactType, setArtifactType] = useState<'Agent' | 'Prompt'>(initialSelection?.type || 'Agent');
  const [artifactId, setArtifactId] = useState<string>(initialSelection?.id || '');
  const [environment, setEnvironment] = useState<'Staging' | 'Production'>('Staging');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form on open, honoring initial selection
      setArtifactType(initialSelection?.type || 'Agent');
      setArtifactId(initialSelection?.id || '');
      setEnvironment('Staging');
      setError('');
    }
  }, [isOpen, initialSelection]);

  useEffect(() => {
    // Reset selected artifact when type changes, unless it's the initial load
    if (!initialSelection || artifactType !== initialSelection.type) {
        setArtifactId('');
    }
  }, [artifactType]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!artifactId) {
      setError(`Please select a${artifactType === 'Agent' ? 'n agent' : ' prompt'} to deploy.`);
      return;
    }
    setError('');

    const artifactList = artifactType === 'Agent' ? agents : prompts;
    const selectedArtifact = artifactList.find(a => a.id === artifactId);

    if (!selectedArtifact) {
      setError('Selected artifact not found.');
      return;
    }

    const newDeployment: Omit<DeployedArtifact, 'id' | 'deployedAt'> = {
      name: selectedArtifact.name,
      type: artifactType,
      version: selectedArtifact.version,
      environment,
      status: 'Monitoring',
    };

    onSave(newDeployment);
    onClose();
  };

  const artifactOptions = artifactType === 'Agent' ? agents : prompts;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-charcoal-dark text-slate-200 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Create New Deployment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="artifact-type" className="block text-sm font-medium text-slate-300 mb-2">Artifact Type</label>
            <select id="artifact-type" value={artifactType} onChange={e => setArtifactType(e.target.value as 'Agent' | 'Prompt')} className="w-full p-2 bg-slate-800 text-slate-200 rounded-md border border-slate-600">
              <option value="Agent">AI Agent</option>
              <option value="Prompt">Prompt</option>
            </select>
          </div>
          <div>
            <label htmlFor="artifact-id" className="block text-sm font-medium text-slate-300 mb-2">Select {artifactType}</label>
            <select id="artifact-id" value={artifactId} onChange={e => setArtifactId(e.target.value)} className="w-full p-2 bg-slate-800 text-slate-200 rounded-md border border-slate-600">
              <option value="">-- Select an artifact --</option>
              {artifactOptions.map(item => (
                <option key={item.id} value={item.id}>{item.name} (v{item.version})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-slate-300 mb-2">Target Environment</label>
            <select id="environment" value={environment} onChange={e => setEnvironment(e.target.value as 'Staging' | 'Production')} className="w-full p-2 bg-slate-800 text-slate-200 rounded-md border border-slate-600">
              <option value="Staging">Staging</option>
              <option value="Production">Production</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
        <footer className="flex justify-end items-center p-4 border-t border-slate-700 space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm">Deploy</button>
        </footer>
      </div>
    </div>
  );
};
