



import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import type { ProjectPhase, ProjectPhaseStatus } from '../types';

interface PhaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  phase: ProjectPhase;
  onUpdate: (updatedPhase: ProjectPhase) => void;
}

const STATUS_OPTIONS: ProjectPhaseStatus[] = ['Not Started', 'In Progress', 'Completed'];

const QUILL_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link'],
        ['clean']
    ],
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export const PhaseDetailModal: React.FC<PhaseDetailModalProps> = ({ isOpen, onClose, phase, onUpdate }) => {
  const [content, setContent] = useState(phase.content);
  const [status, setStatus] = useState(phase.status);
  const isInitialMount = useRef(true);

  const debouncedContent = useDebounce(content, 750);

  useEffect(() => {
    setContent(phase.content);
    setStatus(phase.status);
    isInitialMount.current = true;
  }, [phase]);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    onUpdate({ ...phase, content: debouncedContent, status });
  }, [debouncedContent, status, onUpdate, phase]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{phase.name}</h2>
            <p className="text-sm text-gray-500">{phase.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="mb-4">
            <label htmlFor="phase-status" className="block text-sm font-medium text-gray-600 mb-2">Status</label>
            <select
              id="phase-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectPhaseStatus)}
              className="p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Notes & Content</label>
            <div className="bg-white rounded-md border border-gray-300">
                <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    className="h-96"
                    modules={QUILL_MODULES}
                />
            </div>
          </div>
        </div>
        <footer className="flex justify-end items-center p-4 border-t border-gray-200 flex-shrink-0">
            <p className="text-xs text-gray-400">Your changes are saved automatically.</p>
        </footer>
      </div>
    </div>
  );
};