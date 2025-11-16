import React, { useState, useCallback, useEffect } from 'react';
import { runPrompt, optimizePrompt } from '../services/geminiService';
import { PulsingText } from './Spinner';
import ReactMarkdown from 'react-markdown';
import { MOCK_AI_AGENTS, MODEL_COSTS } from '../constants';
import type { RegisteredPrompt, AIAgent } from '../types';
import { SavePromptModal } from './SavePromptModal';

type LoadingState = 'none' | 'optimizing' | 'running';

interface PlaygroundViewProps {
  initialPrompt: RegisteredPrompt | null;
  clearInitialPrompt: () => void;
  onSavePrompt: (prompt: Omit<RegisteredPrompt, 'id' | 'createdAt' | 'versionHistory' | 'version' | 'avgLatency' | 'costPerKTokens' | 'usage24h' | 'errorRate'> & { userPrompt: string }) => void;
}

const PromptInput: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    rows?: number;
    disabled: boolean;
}> = ({ id, label, value, onChange, placeholder, rows = 3, disabled }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
            disabled={disabled}
        />
    </div>
);

const ResultCard: React.FC<{ title: string; content: string; isLoading: boolean, loadingText: string }> = ({ title, content, isLoading, loadingText }) => {
    if (!content && !isLoading) return null;
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            {isLoading ? (
                <PulsingText text={loadingText} />
            ) : (
                <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ initialPrompt, clearInitialPrompt, onSavePrompt }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(MOCK_AI_AGENTS[0].id);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [userPrompt, setUserPrompt] = useState('');
  const [optimizedResult, setOptimizedResult] = useState('');
  const [runResult, setRunResult] = useState('');
  const [loading, setLoading] = useState<LoadingState>('none');
  const [error, setError] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  const getSelectedModel = useCallback((): AIAgent['model'] => {
    const agent = MOCK_AI_AGENTS.find(a => a.id === selectedAgentId);
    return agent ? agent.model : 'gemini-2.5-flash';
  }, [selectedAgentId]);

  useEffect(() => {
    if (initialPrompt) {
      setSystemInstruction(initialPrompt.systemInstruction);
      setUserPrompt(initialPrompt.userPrompt);
      const matchingAgent = MOCK_AI_AGENTS.find(agent => agent.model === initialPrompt.model);
      setSelectedAgentId(matchingAgent ? matchingAgent.id : '');
      clearInitialPrompt();
    } else if (selectedAgentId) {
        const agent = MOCK_AI_AGENTS.find(a => a.id === selectedAgentId);
        if (agent) {
            setSystemInstruction(agent.systemInstruction);
            setTemperature(agent.temperature);
        }
    }
  }, [selectedAgentId, initialPrompt, clearInitialPrompt]);

  const handleRun = useCallback(async () => {
    if (!userPrompt.trim()) {
        setError('User prompt cannot be empty.');
        return;
    }
    setLoading('running');
    setError('');
    setRunResult('');
    try {
        const result = await runPrompt({
            model: getSelectedModel(),
            systemInstruction,
            userPrompt,
            temperature,
        });
        setRunResult(result);
    } catch (error) {
        console.error("Error running prompt:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(`Failed to run prompt. See output for details.`);
        setRunResult(`**An error occurred:**\n\n\`\`\`\n${errorMessage}\n\`\`\``);
    } finally {
        setLoading('none');
    }
  }, [systemInstruction, userPrompt, temperature, getSelectedModel]);

  const handleOptimize = useCallback(async () => {
    if (!userPrompt.trim()) {
      setError('User prompt cannot be empty.');
      return;
    }
    setError('');
    setLoading('optimizing');
    setOptimizedResult('');
    try {
      const result = await optimizePrompt(systemInstruction, userPrompt);
      setOptimizedResult(result);
    } catch (error) {
        console.error("Error optimizing prompt:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError('Failed to optimize prompt. See suggestion output for details.');
        setOptimizedResult(`**An error occurred during optimization:**\n\n\`\`\`\n${errorMessage}\n\`\`\``);
    } finally {
      setLoading('none');
    }
  }, [systemInstruction, userPrompt]);

  const handleSaveToRegistry = () => {
    setIsSaveModalOpen(true);
  };
  
  const handleConfirmSave = (promptData: Omit<RegisteredPrompt, 'id' | 'createdAt' | 'versionHistory' | 'version' | 'avgLatency' | 'costPerKTokens' | 'usage24h' | 'errorRate'> & { userPrompt: string }) => {
    onSavePrompt(promptData);
    setIsSaveModalOpen(false);
  };

  const isBusy = loading !== 'none';
  
  return (
    <>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Playground & Optimizer</h3>
                
                <div>
                    <label htmlFor="agent-selector" className="block text-sm font-medium text-gray-600 mb-2">Select AI Agent</label>
                    <select id="agent-selector" value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} disabled={isBusy} className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm">
                        <option value="">-- Custom Configuration --</option>
                        {MOCK_AI_AGENTS.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                    </select>
                </div>
                
                <PromptInput id="system-instruction" label="System Instruction" value={systemInstruction} onChange={(e) => { setSystemInstruction(e.target.value); setSelectedAgentId(''); }} placeholder="e.g., You are a Python expert." disabled={isBusy} />

                <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-gray-600 mb-2">Temperature: {temperature}</label>
                    <input id="temperature" type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => { setTemperature(parseFloat(e.target.value)); setSelectedAgentId(''); }} disabled={isBusy} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>

                 <PromptInput id="user-prompt" label="User Prompt" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="e.g., Write a function to reverse a string." rows={5} disabled={isBusy} />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                        onClick={handleRun}
                        disabled={isBusy || !userPrompt.trim()}
                        className="w-full sm:w-auto px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading === 'running' ? 'Running...' : 'Run'}
                    </button>
                    <button
                        onClick={handleOptimize}
                        disabled={isBusy || !userPrompt.trim()}
                        className="w-full sm:w-auto px-6 py-2 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading === 'optimizing' ? 'Optimizing...' : 'Optimize'}
                    </button>
                    <button
                        onClick={handleSaveToRegistry}
                        disabled={isBusy || !userPrompt.trim()}
                        className="w-full sm:w-auto flex-grow sm:flex-grow-0 text-center px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        Save to Registry
                    </button>
                </div>
            </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
            <ResultCard title="Prompt Output" content={runResult} isLoading={loading === 'running'} loadingText="Generating response..." />
            <ResultCard title="Optimization Suggestion" content={optimizedResult} isLoading={loading === 'optimizing'} loadingText="Asking Gemini for suggestions..." />
          </div>
        </div>
        <SavePromptModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleConfirmSave}
            promptToEdit={{
                systemInstruction,
                userPrompt,
                model: getSelectedModel(),
                name: '',
            }}
            availableModels={Object.keys(MODEL_COSTS) as AIAgent['model'][]}
        />
    </>
  );
};