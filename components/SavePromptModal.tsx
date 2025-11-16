import React, { useState, useEffect, useRef } from 'react';
import type { RegisteredPrompt, AIAgent } from '../types';

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promptData: Omit<RegisteredPrompt, 'id' | 'createdAt' | 'versionHistory' | 'version' | 'avgLatency' | 'costPerKTokens' | 'usage24h' | 'errorRate'> & { userPrompt: string }) => void;
  promptToEdit?: { name: string, systemInstruction: string; userPrompt: string; model: AIAgent['model']; } | null;
  availableModels: AIAgent['model'][];
}

export const SavePromptModal: React.FC<SavePromptModalProps> = ({ isOpen, onClose, onSave, promptToEdit, availableModels }) => {
  const [name, setName] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [model, setModel] = useState<AIAgent['model']>(availableModels[0]);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (promptToEdit) {
        setName(promptToEdit.name);
        setSystemInstruction(promptToEdit.systemInstruction);
        setUserPrompt(promptToEdit.userPrompt);
        setModel(promptToEdit.model);
      } else {
        setName('');
        setSystemInstruction('');
        setUserPrompt('');
        setModel(availableModels[0]);
      }
      setError('');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, promptToEdit, availableModels]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError('Prompt name is required.');
      return;
    }
    setError('');
    onSave({ name, systemInstruction, userPrompt, model });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Save to Prompt Registry</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="prompt-name" className="block text-sm font-medium text-gray-600 mb-2">Prompt Name</label>
            <input
              type="text"
              id="prompt-name"
              ref={nameInputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Marketing Email Subject Line Generator"
              className={`w-full p-3 bg-white text-gray-800 rounded-md border ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
           <div>
            <label htmlFor="prompt-model" className="block text-sm font-medium text-gray-600 mb-2">Model</label>
            <select id="prompt-model" value={model} onChange={e => setModel(e.target.value as AIAgent['model'])} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300">
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="prompt-system-instruction" className="block text-sm font-medium text-gray-600 mb-2">System Instruction</label>
            <textarea id="prompt-system-instruction" value={systemInstruction} onChange={e => setSystemInstruction(e.target.value)} rows={3} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 font-mono text-sm" />
          </div>
           <div>
            <label htmlFor="prompt-user-prompt" className="block text-sm font-medium text-gray-600 mb-2">User Prompt</label>
            <textarea id="prompt-user-prompt" value={userPrompt} onChange={e => setUserPrompt(e.target.value)} rows={5} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 font-mono text-sm" />
          </div>
        </div>
        <footer className="flex justify-end items-center p-4 border-t border-gray-200 space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm">Save Prompt</button>
        </footer>
      </div>
    </div>
  );
};
