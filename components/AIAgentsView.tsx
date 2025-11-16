
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MOCK_AGENT_TEMPLATES, ShieldCheckIcon, TrashIcon, EllipsisVerticalIcon, PencilIcon, DocumentDuplicateIcon, BookmarkSquareIcon } from '../constants';
// FIX: Added TemplateCategory to the import to be used in the SaveTemplateModal
import type { AIAgent, AgentVersion, BenchmarkResult, AgentTemplate, GovernancePolicy, SensitivityLevel, PolicyCategory, TemplateCategory } from '../types';
import { runPrompt, rateResponseQuality } from '../services/geminiService';
import { PulsingText } from './Spinner';
import ReactMarkdown from 'react-markdown';

// Tooltip helper component
const Tooltip: React.FC<{ text: string | React.ReactNode; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute left-0 bottom-full mb-2 w-80 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {text}
      </div>
    </div>
  );
};

const InfoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PolicyCategoryBadge: React.FC<{ category: PolicyCategory }> = ({ category }) => {
    const categoryClasses: Record<PolicyCategory, string> = {
        'Security': 'bg-red-100 text-red-800',
        'Fairness': 'bg-blue-100 text-blue-800',
        'Data Privacy': 'bg-purple-100 text-purple-800',
        'Compliance': 'bg-green-100 text-green-800',
    };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categoryClasses[category]}`}>
            {category}
        </span>
    );
};

const POLICY_CATEGORY_DESCRIPTIONS: Record<PolicyCategory, string> = {
  'Security': "Policies focused on preventing attacks like prompt injection, PII leaks, and generation of harmful content.",
  'Fairness': "Policies aimed at reducing bias and ensuring equitable, inclusive language in model responses.",
  'Data Privacy': "Policies that scan for and prevent the accidental exposure of sensitive user data (e.g., PII).",
  'Compliance': "Policies to help adhere to regulatory requirements like HIPAA or prevent unlicensed financial advice.",
};

const SENSITIVITY_LEVEL_DESCRIPTIONS: Record<SensitivityLevel, string> = {
  'Low': "Minor impact. Violations might result in off-brand tone or non-critical issues. Usually logged without blocking.",
  'Medium': "Moderate impact. Violations could lead to compliance warnings or poor user experience. May require review.",
  'High': "Significant impact. Violations could involve data privacy risks or security vulnerabilities. Often configured to block responses.",
};

// New Modal for saving an agent as a template
interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { templateName: string, category: TemplateCategory }) => void;
  agentName: string;
  existingTemplateNames: string[];
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = ['General', 'Content', 'Code', 'Data', 'E-commerce'];

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onSave, agentName, existingTemplateNames }) => {
    const [templateName, setTemplateName] = useState('');
    const [category, setCategory] = useState<TemplateCategory>('General');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTemplateName(`${agentName} Template`);
            setCategory('General');
            setError('');
        }
    }, [isOpen, agentName]);

    if (!isOpen) return null;

    const handleSave = () => {
        const trimmedName = templateName.trim();
        if (!trimmedName) {
            setError('Template name cannot be empty.');
            return;
        }
        if (existingTemplateNames.map(n => n.toLowerCase()).includes(trimmedName.toLowerCase())) {
            setError('A template with this name already exists.');
            return;
        }
        onSave({ templateName: trimmedName, category });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md flex flex-col m-4"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Save as Template</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="template-name" className="block text-sm font-medium text-gray-600 mb-2">Template Name</label>
                        <input
                            type="text"
                            id="template-name"
                            value={templateName}
                            onChange={(e) => {
                                setTemplateName(e.target.value)
                                if (error) setError('');
                            }}
                            className={`w-full p-3 bg-white text-gray-800 rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm`}
                        />
                         {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                    <div>
                        <label htmlFor="template-category" className="block text-sm font-medium text-gray-600 mb-2">Category</label>
                        <select
                            id="template-category"
                            value={category}
                            onChange={e => setCategory(e.target.value as TemplateCategory)}
                            className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                        >
                            {TEMPLATE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
                <footer className="flex justify-end items-center p-4 border-t border-gray-200 space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors">Save Template</button>
                </footer>
            </div>
        </div>
    );
};


// Modal component for creating/editing agents
interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: AIAgent) => void;
  agent: AIAgent | null;
}

const MODELS: AIAgent['model'][] = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro-preview-0514', 'imagen-4.0-generate-001', 'gemini-2.5-flash-image', 'claude-3-sonnet-20240229', 'llama3-8b-8192'];

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, onSave, agent }) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState<AIAgent['model']>(MODELS[0]);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [status, setStatus] = useState<AIAgent['status']>('development');
  const [errors, setErrors] = useState<{name?: string; instruction?: string}>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        if (agent) { // Editing, Cloning, or Creating from template
          setName(agent.name);
          setModel(agent.model);
          setSystemInstruction(agent.systemInstruction);
          setTemperature(agent.temperature);
          setStatus(agent.status);
          if (!agent.id) { // This indicates a clone or template
            setTimeout(() => nameInputRef.current?.select(), 100);
          }
        } else { // Creating new from scratch
          setName('');
          setModel(MODELS[0]);
          setSystemInstruction('');
          setTemperature(0.7);
          setStatus('development');
          setTimeout(() => nameInputRef.current?.focus(), 100);
        }
        setErrors({});
    }
  }, [agent, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
      const newErrors: {name?: string; instruction?: string} = {};
      if (!name.trim()) {
          newErrors.name = 'Agent name is required.';
      }
      if (!systemInstruction.trim()) {
          newErrors.instruction = 'System instruction is required.';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  }

  const handleSave = () => {
    if (!validate()) {
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // This logic handles both creation and versioning of existing agents.
    const newVersionNumber = (agent && agent.id) ? agent.version + 1 : 1;
    
    const newVersion: AgentVersion = {
        version: newVersionNumber,
        model,
        systemInstruction,
        temperature,
        createdAt: today
    };

    const finalAgent: AIAgent = {
        id: agent?.id || `agent-${Date.now()}`,
        name,
        model,
        systemInstruction,
        temperature,
        status,
        version: newVersionNumber,
        createdAt: agent?.createdAt || today,
        versionHistory: (agent && agent.id) ? [newVersion, ...agent.versionHistory] : [newVersion],
    };

    onSave(finalAgent);
  };
  
  const title = (agent && agent.id) ? `Configure Agent (v${agent.version})` : 'Create New AI Agent';
  const saveButtonText = (agent && agent.id) ? `Save as New Version (v${agent.version + 1})` : 'Create Agent';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="agent-name" className="block text-sm font-medium text-gray-600 mb-2">Agent Name</label>
                  <input
                      type="text"
                      id="agent-name"
                      ref={nameInputRef}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors(prev => ({...prev, name: undefined}));
                      }}
                      placeholder="e.g., Creative Writer Bot"
                      className={`w-full p-3 bg-white text-gray-800 rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
               <div>
                <label htmlFor="agent-status" className="block text-sm font-medium text-gray-600 mb-2">Deployment Status</label>
                <select id="agent-status" value={status} onChange={(e) => setStatus(e.target.value as AIAgent['status'])} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary">
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                </select>
            </div>
            </div>
            
            <div>
                <div className="flex items-center space-x-2 mb-2">
                    <label htmlFor="agent-model" className="block text-sm font-medium text-gray-600">AI Model</label>
                    <Tooltip text={
                        <div className="space-y-3 text-left">
                             <div>
                                <p className="font-bold">gemini-2.5-pro</p>
                                <ul className="list-disc list-inside mt-1 text-gray-300">
                                    <li><strong className="text-green-300">Strengths:</strong> The most capable model, ideal for tasks requiring deep, multi-step reasoning like strategic planning, complex data analysis, or writing sophisticated code.</li>
                                    <li><strong className="text-yellow-300">Cost:</strong> Highest. Best for high-value tasks where quality is paramount.</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold">gemini-2.5-flash</p>
                                <ul className="list-disc list-inside mt-1 text-gray-300">
                                    <li><strong className="text-green-300">Strengths:</strong> Fast and cost-effective. Perfect for high-volume applications like chatbots, summarization, and RAG where speed is critical.</li>
                                     <li><strong className="text-yellow-300">Cost:</strong> Low. Excellent for scaling applications affordably.</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold">gemini-1.5-pro-preview-0514</p>
                                <ul className="list-disc list-inside mt-1 text-gray-300">
                                    <li><strong className="text-green-300">Strengths:</strong> Highly capable multimodal model with a large context window, excellent for complex, long-context reasoning tasks.</li>
                                    <li><strong className="text-yellow-300">Cost:</strong> High. A preview model for advanced use cases.</li>
                                </ul>
                            </div>
                             <div>
                                <p className="font-bold">claude-3-sonnet-20240229</p>
                                <ul className="list-disc list-inside mt-1 text-gray-300">
                                    <li><strong className="text-green-300">Strengths:</strong> A balanced model from Anthropic, offering a strong combination of performance and speed. Ideal for enterprise workloads.</li>
                                    <li><strong className="text-yellow-300">Cost:</strong> Medium. Good for reliable, high-throughput tasks.</li>
                                </ul>
                            </div>
                             <div>
                                <p className="font-bold">llama3-8b-8192</p>
                                <ul className="list-disc list-inside mt-1 text-gray-300">
                                    <li><strong className="text-green-300">Strengths:</strong> An open-source model from Meta, highly capable for its size. Great for general-purpose tasks and fine-tuning.</li>
                                    <li><strong className="text-yellow-300">Cost:</strong> Varies (self-hosted). Can be very cost-effective.</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold">imagen-4.0-generate-001</p>
                                <ul className="list-disc list-inside mt-1 text-gray-300">
                                    <li><strong className="text-green-300">Strengths:</strong> Creates high-fidelity, photorealistic images. Excels at interpreting complex prompts and rendering fine details.</li>
                                     <li><strong className="text-yellow-300">Cost:</strong> High (per image). Priced for professional-grade quality.</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold">gemini-2.5-flash-image</p>
                                <ul className="list-disc list-inside mt-1 text-gray-300">
                                     <li><strong className="text-green-300">Strengths:</strong> Very fast and affordable image generation/editing. Excellent for ideation and simple illustrations.</li>
                                     <li><strong className="text-yellow-300">Cost:</strong> Very Low (per image). Designed for high-volume, low-cost image tasks.</li>
                                </ul>
                            </div>
                        </div>
                    }>
                        <InfoIcon className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                </div>
                <select
                    id="agent-model"
                    value={model}
                    onChange={(e) => { setModel(e.target.value as AIAgent['model']); }}
                    className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                >
                    {MODELS.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            <div>
                 <div className="flex items-center space-x-2 mb-2">
                    <label htmlFor="system-instruction" className="block text-sm font-medium text-gray-600">System Instruction</label>
                     <Tooltip text="Defines the agent's persona and rules. It guides the model's behavior for all prompts. E.g., 'You are a senior SQL developer who only writes efficient, production-ready code.'">
                        <InfoIcon className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                </div>
                <textarea
                    id="system-instruction"
                    value={systemInstruction}
                    onChange={(e) => {
                      setSystemInstruction(e.target.value);
                      if (errors.instruction) setErrors(prev => ({...prev, instruction: undefined}));
                    }}
                    placeholder="e.g., You are a helpful assistant."
                    rows={4}
                    className={`w-full p-3 bg-white text-gray-800 rounded-md border ${errors.instruction ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm`}
                />
                {errors.instruction && <p className="text-red-500 text-xs mt-1">{errors.instruction}</p>}
            </div>

            <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-600 mb-2">Temperature: {temperature}</label>
                <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => { setTemperature(parseFloat(e.target.value)); }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>
        </div>
        <footer className="flex justify-end items-center p-4 border-t border-gray-200 space-x-4">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors"
            >
                {saveButtonText}
            </button>
        </footer>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: AIAgent['status'] }> = ({ status }) => {
    const statusClasses = {
        development: 'bg-gray-100 text-gray-800',
        staging: 'bg-yellow-100 text-yellow-800',
        production: 'bg-green-100 text-green-800',
    };
    const statusDotClasses = {
        development: 'bg-gray-500',
        staging: 'bg-yellow-500',
        production: 'bg-green-500',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClasses[status]}`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${statusDotClasses[status]}`}></span>
            {status}
        </span>
    );
};

const AgentCard: React.FC<{ 
    agent: AIAgent; 
    policies: GovernancePolicy[];
    onConfigure: (agent: AIAgent) => void; 
    onClone: (agent: AIAgent) => void;
    onSaveAsTemplate: (agent: AIAgent) => void;
    onDelete: (agentId: string) => void;
}> = ({ agent, policies, onConfigure, onClone, onSaveAsTemplate, onDelete }) => {
    const activePolicies = policies.filter(p => p.enabled);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/50 transition-colors duration-300 shadow-sm flex flex-col">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{agent.name} <span className="text-sm font-normal text-gray-500">v{agent.version}</span></h3>
                    <StatusBadge status={agent.status} />
                </div>
                <p className="text-xs font-mono px-2 py-1 rounded bg-green-50 text-green-700 inline-block mt-2">{agent.model}</p>
                
                {/* Metrics Section */}
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase flex items-center">
                            Avg. Response Time
                            <span className="relative flex h-2 w-2 ml-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                        </p>
                        <p className="text-xl font-semibold text-gray-800 mt-1">{agent.avgResponseTime ?? 'N/A'}<span className="text-sm font-normal text-gray-500">ms</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase flex items-center">
                            Success Rate
                             <span className="relative flex h-2 w-2 ml-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                        </p>
                        <p className="text-xl font-semibold text-gray-800 mt-1">{agent.successRate ?? 'N/A'}<span className="text-sm font-normal text-gray-500">%</span></p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-semibold uppercase">System Instruction</p>
                    <p className="text-sm text-gray-600 mt-1 font-mono bg-gray-50 p-3 rounded-md h-24 overflow-y-auto">{agent.systemInstruction}</p>
                </div>

                {activePolicies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-400 font-semibold uppercase flex items-center">
                            <ShieldCheckIcon className="w-4 h-4 mr-2 text-gray-400" />
                            Active Guardrails
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {activePolicies.map(policy => (
                                <span key={policy.id} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {policy.name}
                                    {policy.sensitivity && ` (${policy.sensitivity})`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <button 
                    onClick={() => onConfigure(agent)} 
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-primary-light transition-colors"
                >
                    Configure
                </button>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                             <button onClick={() => { onClone(agent); setIsMenuOpen(false); }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <DocumentDuplicateIcon className="w-4 h-4"/>
                                <span>Clone</span>
                             </button>
                             <button onClick={() => { onSaveAsTemplate(agent); setIsMenuOpen(false); }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <BookmarkSquareIcon className="w-4 h-4"/>
                                <span>Save as Template</span>
                             </button>
                             <div className="my-1 h-px bg-gray-100"></div>
                             <button onClick={() => { onDelete(agent.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                 <TrashIcon className="w-4 h-4"/>
                                 <span>Delete</span>
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BenchmarkResultsTable: React.FC<{ results: BenchmarkResult[] }> = ({ results }) => {
    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 5) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (Est.)</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {results.map(result => (
                        <tr key={result.agentId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                                <p className="text-sm font-medium text-gray-900">{result.agentName}</p>
                                <p className="text-xs text-gray-500 font-mono">{result.model}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-md">
                                {result.error ? (
                                    <p className="text-red-500">{result.error}</p>
                                ) : (
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown>{result.response}</ReactMarkdown>
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{result.latency}ms</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <Tooltip text={<p className="text-xs">{result.qualityReasoning}</p>}>
                                    <span className={`font-bold ${getScoreColor(result.qualityScore)} cursor-help`}>{result.qualityScore.toFixed(1)}/10</span>
                                 </Tooltip>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">${result.cost.toFixed(6)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const TemplateCard: React.FC<{ template: AgentTemplate, onCreateFromTemplate: (template: AgentTemplate) => void }> = ({ template, onCreateFromTemplate }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
        <h4 className="font-semibold text-gray-800 flex-grow">{template.name}</h4>
        <p className="text-xs font-mono px-2 py-1 rounded bg-green-50 text-green-700 inline-block my-2">{template.model}</p>
        <p className="text-xs text-gray-500 h-12 overflow-hidden flex-grow">{template.systemInstruction}</p>
        <button 
            onClick={() => onCreateFromTemplate(template)}
            className="w-full mt-3 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-primary-light transition-colors"
        >
            Create from Template
        </button>
    </div>
);

type SortableAgentKeys = 'name' | 'model' | 'status';

const SortableHeader: React.FC<{
    column: SortableAgentKeys;
    title: string;
    sortColumn: SortableAgentKeys | null;
    sortDirection: 'asc' | 'desc';
    onSort: (column: SortableAgentKeys) => void;
}> = ({ column, title, sortColumn, sortDirection, onSort }) => {
    const isSorted = sortColumn === column;
    const directionIndicator = sortDirection === 'asc' ? '▲' : '▼';
    
    return (
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <button onClick={() => onSort(column)} className="flex items-center space-x-1 hover:text-gray-800">
                <span>{title}</span>
                {isSorted && <span className="text-gray-800 text-xs">{directionIndicator}</span>}
            </button>
        </th>
    );
};

interface AIAgentsViewProps {
  agents: AIAgent[];
  onSaveAgent: (agent: AIAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  policies: GovernancePolicy[];
}

export const AIAgentsView: React.FC<AIAgentsViewProps> = ({ agents, onSaveAgent, onDeleteAgent, policies }) => {
  const [liveAgents, setLiveAgents] = useState<AIAgent[]>(agents);
  const [agentTemplates, setAgentTemplates] = useState<AgentTemplate[]>(MOCK_AGENT_TEMPLATES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [agentToTemplate, setAgentToTemplate] = useState<AIAgent | null>(null);
  
  const [testAgentId, setTestAgentId] = useState<string>('');
  const [testModel, setTestModel] = useState<AIAgent['model']>('gemini-2.5-flash');
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState<{ response: string; model: string; temperature: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [benchmarkAgentIds, setBenchmarkAgentIds] = useState<string[]>([]);
  const [benchmarkPrompt, setBenchmarkPrompt] = useState('');
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const [sortColumn, setSortColumn] = useState<SortableAgentKeys>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    setLiveAgents(agents);
  }, [agents]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAgents(prevAgents => 
        prevAgents.map(agent => ({
          ...agent,
          avgResponseTime: Math.max(200, Math.floor((agent.avgResponseTime || 500) + (Math.random() * 50 - 25))),
          successRate: parseFloat(Math.min(100, Math.max(90, (agent.successRate || 98) + (Math.random() * 0.2 - 0.1))).toFixed(1))
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!testAgentId && liveAgents.length > 0) {
      setTestAgentId(liveAgents[0].id);
    }
  }, [liveAgents, testAgentId]);

  useEffect(() => {
    const selectedTestAgent = liveAgents.find(agent => agent.id === testAgentId);
    if (selectedTestAgent) {
      setTestModel(selectedTestAgent.model);
    }
  }, [testAgentId, liveAgents]);

  const handleOpenModal = (agent: AIAgent | null) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAgent(null);
  };
  
  const handleOpenSaveTemplateModal = (agent: AIAgent) => {
    setAgentToTemplate(agent);
    setIsSaveTemplateModalOpen(true);
  };

  const handleCloseSaveTemplateModal = () => {
    setIsSaveTemplateModalOpen(false);
    setAgentToTemplate(null);
  };
  
  const handleSaveTemplate = (details: { templateName: string, category: TemplateCategory }) => {
    if (!agentToTemplate) return;

    const newTemplate: AgentTemplate = {
      id: `template-${Date.now()}`,
      name: details.templateName,
      model: agentToTemplate.model,
      systemInstruction: agentToTemplate.systemInstruction,
      temperature: agentToTemplate.temperature,
      category: details.category,
    };
    
    setAgentTemplates(prev => [newTemplate, ...prev]);
    handleCloseSaveTemplateModal();
  };

  const handleDeleteClick = (agentId: string) => {
    if (window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
        onDeleteAgent(agentId);
    }
  };
  
  const handleCreateFromTemplate = (template: AgentTemplate) => {
    const newAgentFromTemplate: AIAgent = {
      id: '',
      name: `${template.name} Agent`,
      model: template.model,
      systemInstruction: template.systemInstruction,
      temperature: template.temperature,
      createdAt: '',
      status: 'development',
      version: 0,
      versionHistory: [],
    };
    handleOpenModal(newAgentFromTemplate);
  };

  const handleCloneAgent = (agentToClone: AIAgent) => {
    const clonedAgentTemplate: AIAgent = {
        ...agentToClone,
        name: `${agentToClone.name} (Copy)`,
        id: '', 
        createdAt: '',
        version: 0,
        status: 'development',
        versionHistory: [],
    };
    handleOpenModal(clonedAgentTemplate);
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim() || !testAgentId) return;

    const agentToTest = liveAgents.find(a => a.id === testAgentId);
    if (!agentToTest) return;

    const modelForTest = testModel;

    setIsTesting(true);
    setTestResult(null);

    try {
        const response = await runPrompt({
            model: modelForTest,
            systemInstruction: agentToTest.systemInstruction,
            userPrompt: testPrompt,
            temperature: agentToTest.temperature,
        });
        setTestResult({
            response,
            model: modelForTest,
            temperature: agentToTest.temperature,
        });
    } catch (error) {
        console.error("Test run failed:", error);
        setTestResult({
            response: 'An error occurred during the test run. Please check the console.',
            model: modelForTest,
            temperature: agentToTest.temperature,
        });
    } finally {
        setIsTesting(false);
    }
  };

  const calculateMockCost = (model: AIAgent['model'], responseLength: number): number => {
      const COST_PER_CHAR: Record<AIAgent['model'], number> = {
          'gemini-2.5-pro': 0.000015,
          'gemini-2.5-flash': 0.0000015,
          'imagen-4.0-generate-001': 0.02,
          'gemini-2.5-flash-image': 0.0025,
          'gemini-1.5-pro-preview-0514': 0.000020,
          'claude-3-sonnet-20240229': 0.000018,
          'llama3-8b-8192': 0.0000010,
      };
      if (model.includes('image')) return COST_PER_CHAR[model];
      return (responseLength * (COST_PER_CHAR[model] || 0));
  };

  const handleToggleBenchmarkAgent = (agentId: string) => {
    setBenchmarkAgentIds(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };
  
  const handleRunBenchmark = async () => {
    if (!benchmarkPrompt.trim() || benchmarkAgentIds.length === 0) return;

    setIsBenchmarking(true);
    setBenchmarkResults([]);

    const benchmarkPromises = benchmarkAgentIds.map(async (agentId) => {
        const agent = liveAgents.find(a => a.id === agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const startTime = performance.now();
        const response = await runPrompt({
            model: agent.model,
            systemInstruction: agent.systemInstruction,
            userPrompt: benchmarkPrompt,
            temperature: agent.temperature,
        });
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        const quality = await rateResponseQuality(benchmarkPrompt, response);
        const cost = calculateMockCost(agent.model, response.length);
        
        return {
            agentId: agent.id,
            agentName: agent.name,
            model: agent.model,
            response,
            latency,
            qualityScore: quality.score,
            qualityReasoning: quality.reasoning,
            cost,
        };
    });

    const results = await Promise.allSettled(benchmarkPromises);

    const finalResults = results.map((res, index) => {
        if (res.status === 'fulfilled') {
            return res.value;
        } else {
            const agent = liveAgents.find(a => a.id === benchmarkAgentIds[index]);
            return {
                agentId: benchmarkAgentIds[index],
                agentName: agent?.name || 'Unknown',
                model: agent?.model || 'gemini-2.5-flash',
                response: '',
                latency: 0,
                qualityScore: 0,
                qualityReasoning: 'Failed to run benchmark for this agent.',
                cost: 0,
                error: res.reason instanceof Error ? res.reason.message : 'An unknown error occurred'
            };
        }
    });

    setBenchmarkResults(finalResults);
    setIsBenchmarking(false);
  };
  
  const handleSort = (column: SortableAgentKeys) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAgents = useMemo(() => {
    const statusOrder: Record<AIAgent['status'], number> = {
      production: 0,
      staging: 1,
      development: 2,
    };

    return [...liveAgents].sort((a, b) => {
      if (!sortColumn) return 0;

      let valA: string | number;
      let valB: string | number;

      if (sortColumn === 'status') {
        valA = statusOrder[a.status];
        valB = statusOrder[b.status];
      } else {
        valA = a[sortColumn] || '';
        valB = b[sortColumn] || '';
      }

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [liveAgents, sortColumn, sortDirection]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
             <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}`}
                >
                    Grid
                </button>
                <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}`}
                >
                    Table
                </button>
            </div>
            <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200"
            >
            <span>Add New Agent</span>
            </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Agent Templates</h3>
          <p className="text-sm text-gray-500">
              Quickly create new agents from pre-configured templates.
          </p>
          {agentTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
                  {agentTemplates.map(template => (
                      <TemplateCard key={template.id} template={template} onCreateFromTemplate={handleCreateFromTemplate} />
                  ))}
              </div>
          ) : (
              <p className="text-sm text-gray-500 text-center py-4">No templates saved yet. Save an existing agent as a template to get started.</p>
          )}
      </div>

       <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Agent Guardrails</h3>
            <p className="text-sm text-gray-500">
                Define and enable guardrails that will be applied to all agent prompts. These rules help ensure safety and compliance.
            </p>
            <div className="space-y-4 pt-2">
                {policies.map(guardrail => (
                    <div key={guardrail.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 mb-4 sm:mb-0">
                            <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-gray-800">{guardrail.name}</h4>
                                <Tooltip text={POLICY_CATEGORY_DESCRIPTIONS[guardrail.category]}>
                                    <span className="cursor-help">
                                        <PolicyCategoryBadge category={guardrail.category} />
                                    </span>
                                </Tooltip>
                            </div>
                            <p className="text-xs text-gray-500">{guardrail.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Tooltip text={SENSITIVITY_LEVEL_DESCRIPTIONS[guardrail.sensitivity || 'Low']}>
                                <div className="flex-shrink-0 flex items-center space-x-1 cursor-help">
                                    <label htmlFor={`sensitivity-${guardrail.id}`} className="sr-only">Sensitivity</label>
                                    <select
                                        id={`sensitivity-${guardrail.id}`}
                                        value={guardrail.sensitivity}
                                        disabled={true}
                                        className="bg-white text-gray-800 text-sm rounded-md py-1.5 px-2 border border-gray-300 focus:ring-primary focus:border-primary cursor-not-allowed"
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                    <InfoIcon className="w-4 h-4 text-gray-400"/>
                                </div>
                            </Tooltip>
                            <ToggleSwitch enabled={guardrail.enabled} onChange={() => {}} />
                        </div>
                    </div>
                ))}
            </div>
        </div>


      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {liveAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} policies={policies} onConfigure={handleOpenModal} onClone={handleCloneAgent} onSaveAsTemplate={handleOpenSaveTemplateModal} onDelete={handleDeleteClick} />
            ))}
          </div>
      ) : (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="">
                      <tr>
                          <SortableHeader column="name" title="Name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                          <SortableHeader column="status" title="Status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                          <SortableHeader column="model" title="Model" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                           <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Latency</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                          <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {sortedAgents.map(agent => (
                          <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={agent.status} /></td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{agent.model}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">v{agent.version}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.avgResponseTime}ms</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.successRate}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-3">
                                      <button onClick={() => handleOpenModal(agent)} title="Configure" className="text-gray-400 hover:text-primary"><PencilIcon className="w-5 h-5"/></button>
                                      <button onClick={() => handleCloneAgent(agent)} title="Clone" className="text-gray-400 hover:text-primary"><DocumentDuplicateIcon className="w-5 h-5"/></button>
                                      <button onClick={() => handleOpenSaveTemplateModal(agent)} title="Save as Template" className="text-gray-400 hover:text-primary"><BookmarkSquareIcon className="w-5 h-5"/></button>
                                      <button onClick={() => handleDeleteClick(agent.id)} title="Delete" className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}


      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Agent Test Bench</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                 <div>
                    <label htmlFor="test-agent-selector" className="block text-sm font-medium text-gray-600 mb-2">Select Agent to Test</label>
                    <select
                        id="test-agent-selector"
                        value={testAgentId}
                        onChange={(e) => setTestAgentId(e.target.value)}
                        disabled={isTesting || liveAgents.length === 0}
                        className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                    >
                        {liveAgents.length === 0 ? (
                            <option>No agents available</option>
                        ) : (
                            liveAgents.map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name} (v{agent.version})</option>
                            ))
                        )}
                    </select>
                </div>
                <div>
                    <label htmlFor="test-model-selector" className="block text-sm font-medium text-gray-600 mb-2">Model</label>
                    <select
                        id="test-model-selector"
                        value={testModel}
                        onChange={(e) => setTestModel(e.target.value as AIAgent['model'])}
                        disabled={isTesting || !testAgentId}
                        className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                    >
                        {MODELS.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="test-prompt" className="block text-sm font-medium text-gray-600 mb-2">Test Prompt</label>
                    <textarea
                        id="test-prompt"
                        value={testPrompt}
                        onChange={(e) => setTestPrompt(e.target.value)}
                        placeholder="Enter your prompt here to test the selected agent..."
                        rows={5}
                        className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                        disabled={isTesting}
                    />
                </div>
                <button
                    onClick={handleRunTest}
                    disabled={isTesting || !testPrompt.trim() || !testAgentId}
                    className="w-full px-6 py-2 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {isTesting ? 'Running...' : 'Run Test'}
                </button>
            </div>
            <div>
                {(isTesting || testResult) && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Agent Response</h4>
                        {isTesting ? (
                            <PulsingText text="Generating response..." />
                        ) : testResult ? (
                            <div className="space-y-4">
                               <div className="prose prose-sm max-w-none text-gray-600">
                                  <ReactMarkdown>{testResult.response}</ReactMarkdown>
                               </div>
                               <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                   <strong>Model:</strong> {testResult.model} &nbsp;&middot;&nbsp; <strong>Temperature:</strong> {testResult.temperature}
                               </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
      </div>

       <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Agent Benchmarking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Select Agents to Benchmark</label>
                        <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-md border border-gray-300">
                            {liveAgents.map(agent => (
                                <div key={agent.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`bench-${agent.id}`}
                                        checked={benchmarkAgentIds.includes(agent.id)}
                                        onChange={() => handleToggleBenchmarkAgent(agent.id)}
                                        disabled={isBenchmarking}
                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                                    />
                                    <label htmlFor={`bench-${agent.id}`} className="ml-3 text-sm text-gray-700">{agent.name} (v{agent.version})</label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="benchmark-prompt" className="block text-sm font-medium text-gray-600 mb-2">Benchmark Prompt</label>
                        <textarea
                            id="benchmark-prompt"
                            value={benchmarkPrompt}
                            onChange={(e) => setBenchmarkPrompt(e.target.value)}
                            placeholder="Write a short, engaging twitter post about the future of AI..."
                            rows={4}
                            className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                            disabled={isBenchmarking}
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <p className="text-sm text-gray-600">Run a single prompt against multiple agents to compare their performance side-by-side. The quality score is generated by an AI evaluation model.</p>
                     <button
                        onClick={handleRunBenchmark}
                        disabled={isBenchmarking || !benchmarkPrompt.trim() || benchmarkAgentIds.length === 0}
                        className="mt-auto w-full px-6 py-2 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isBenchmarking ? 'Benchmarking...' : `Run Benchmark on ${benchmarkAgentIds.length} Agents`}
                    </button>
                </div>
            </div>

            {(isBenchmarking || benchmarkResults.length > 0) && (
                <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Benchmark Results</h4>
                    {isBenchmarking ? (
                        <div className="flex justify-center items-center py-8">
                            <PulsingText text="Running benchmarks and gathering results..." />
                        </div>
                    ) : (
                        <BenchmarkResultsTable results={benchmarkResults} />
                    )}
                </div>
            )}
        </div>


       <AgentModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={onSaveAgent}
        agent={selectedAgent}
      />
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={handleCloseSaveTemplateModal}
        onSave={handleSaveTemplate}
        agentName={agentToTemplate?.name || ''}
        existingTemplateNames={agentTemplates.map(t => t.name)}
      />
    </div>
  );
};
