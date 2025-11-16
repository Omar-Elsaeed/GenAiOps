
import React, { useState, useEffect, useRef } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { name: string; description: string }) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-charcoal-dark text-slate-200 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Create New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
            <input
              type="text"
              id="project-name"
              ref={nameInputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Q3 Marketing Campaign AI Assistant"
              className={`w-full p-3 bg-slate-800 text-slate-200 placeholder-slate-400 rounded-md border ${error ? 'border-red-500' : 'border-slate-600'} focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm`}
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-slate-300 mb-2">Project Description (Optional)</label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the goals and purpose of this project."
              rows={4}
              className="w-full p-3 bg-slate-800 text-slate-200 placeholder-slate-400 rounded-md border border-slate-600 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
            />
          </div>
        </div>
        <footer className="flex justify-end items-center p-4 border-t border-slate-700 space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light transition-all"
          >
            Create Project
          </button>
        </footer>
      </div>
    </div>
  );
};
