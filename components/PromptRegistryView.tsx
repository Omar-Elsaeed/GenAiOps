import React, { useState } from 'react';
import { PlusIcon } from '../constants';
import type { View, RegisteredPrompt, AIAgent } from '../types';
import { SavePromptModal } from './SavePromptModal';

interface PromptRegistryViewProps {
  prompts: RegisteredPrompt[];
  onSavePrompt: (prompt: Omit<RegisteredPrompt, 'id' | 'createdAt' | 'versionHistory' | 'version' | 'avgLatency' | 'costPerKTokens' | 'usage24h' | 'errorRate'> & { userPrompt: string }) => void;
  navigate: (view: View, options?: { promptId?: string, prompt?: RegisteredPrompt }) => void;
}

export const PromptRegistryView: React.FC<PromptRegistryViewProps> = ({ prompts, onSavePrompt, navigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-900">Prompt Registry</h3>
                <p className="text-sm text-gray-500 mt-1">A centralized repository for managing, versioning, and deploying your production prompts.</p>
            </div>
             <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200"
            >
                <PlusIcon className="w-5 h-5" />
                <span>Create New Prompt</span>
            </button>
        </div>
        
        {prompts.length === 0 ? (
            <div className="text-center py-12">
                <h4 className="text-lg font-medium text-gray-600">No Prompts Found</h4>
                <p className="text-sm text-gray-500 mt-1">Get started by creating your first versioned prompt.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Version</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Usage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost / 1k Tokens</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Daily Cost</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prompts.map((prompt) => {
                    const costPer1k = prompt.costPerKTokens || 0;
                    const dailyCost = (prompt.usage24h / 1000) * costPer1k;

                    return (
                      <tr key={prompt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prompt.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">v{prompt.version}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{prompt.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{prompt.usage24h.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {costPer1k.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 5, maximumFractionDigits: 7 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {dailyCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                              onClick={() => navigate('prompt-detail', { promptId: prompt.id })}
                              className="text-primary hover:text-primary-light transition-colors"
                          >
                              View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        )}
      </div>
      <SavePromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(p) => { onSavePrompt(p); setIsModalOpen(false); }}
        availableModels={['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro-preview-0514', 'imagen-4.0-generate-001', 'gemini-2.5-flash-image', 'claude-3-sonnet-20240229', 'llama3-8b-8192']}
      />
    </div>
  );
};
