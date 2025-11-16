import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PulsingText } from './Spinner';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  analysisResult: string;
  alertTitle: string;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, isLoading, analysisResult, alertTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">AI Root Cause Analysis: <span className="text-primary">{alertTitle}</span></h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <PulsingText text="Gemini is investigating the alert..." />
            </div>
          ) : (
            <div className="prose prose-sm sm:prose-base max-w-none prose-invert text-slate-300">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};