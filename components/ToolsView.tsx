import React, { useState, useEffect } from 'react';
import { MOCK_INTEGRATION_PROVIDERS, KeyIcon, PencilIcon, TrashIcon } from '../constants';
import type { IntegrationProvider } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  provider: IntegrationProvider | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, provider }) => {
  const [apiKey, setApiKey] = useState('');
  useEffect(() => { if (isOpen) setApiKey(''); }, [isOpen]);
  if (!isOpen || !provider) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Connect to {provider.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>
        <div className="p-6 space-y-4">
          <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`Enter your ${provider.name} API Key`} className="w-full p-3 border rounded-md" />
        </div>
        <footer className="flex justify-end p-4 border-t space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={() => { onSave(apiKey); onClose(); }} className="px-4 py-2 bg-primary text-white rounded-lg">Save</button>
        </footer>
      </div>
    </div>
  );
};

const IntegrationCard: React.FC<{
  provider: IntegrationProvider;
  isConnected: boolean;
  onManage: (provider: IntegrationProvider) => void;
}> = ({ provider, isConnected, onManage }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col text-center items-center">
    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">{provider.logo}</div>
    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
    <p className="text-sm text-gray-500 mt-1 flex-grow">{provider.description}</p>
    <div className="mt-4">
      {isConnected ? (
        <div className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Connected
        </div>
      ) : (
        <div className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 flex items-center">
          <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
          Not Connected
        </div>
      )}
    </div>
    <button onClick={() => onManage(provider)} className="mt-4 text-sm font-medium text-primary hover:text-primary-light">
      {isConnected ? 'Manage' : 'Connect'}
    </button>
  </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        {children}
    </button>
);

const ApiKeyManager: React.FC<{
    connections: Record<string, { apiKey: string | null }>;
    onEdit: (provider: IntegrationProvider) => void;
    onDelete: (providerId: string) => void;
}> = ({ connections, onEdit, onDelete }) => {
    const connectedProviders = MOCK_INTEGRATION_PROVIDERS.filter(
        p => connections[p.id]?.apiKey
    );

    const maskApiKey = (key: string) => {
        if (key.length <= 8) return '********';
        return `${key.substring(0, 4)}****************${key.substring(key.length - 4)}`;
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeyIcon className="w-5 h-5 mr-2 text-gray-400" />
                API Key Management
            </h3>
            {connectedProviders.length > 0 ? (
                <div className="space-y-3">
                    {connectedProviders.map(provider => (
                        <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    {provider.logo}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{provider.name}</p>
                                    <p className="text-xs text-gray-500 font-mono">{maskApiKey(connections[provider.id]!.apiKey!)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => onEdit(provider)} className="text-gray-500 hover:text-primary" title="Edit API Key">
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => onDelete(provider.id)} className="text-gray-500 hover:text-red-500" title="Delete API Key">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                    No API keys saved. Connect to an integration above to manage its key here.
                </p>
            )}
        </div>
    );
};


export const ToolsView: React.FC = () => {
  const [connections, setConnections] = useState<Record<string, { apiKey: string | null }>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [activeTab, setActiveTab] = useState<'pm' | 'data-ml' | 'llm'>('llm');

  const handleManageConnection = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleSaveApiKey = (apiKey: string) => {
    if (selectedProvider) {
      setConnections(prev => ({ ...prev, [selectedProvider.id]: { apiKey: apiKey || null } }));
    }
  };

  const handleDeleteApiKey = (providerId: string) => {
      if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
          setConnections(prev => {
              const newConnections = { ...prev };
              if (newConnections[providerId]) {
                  delete newConnections[providerId];
              }
              return newConnections;
          });
      }
  };
  
  const providers = MOCK_INTEGRATION_PROVIDERS.filter(p => p.category === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tools & Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">Connect to your existing toolchain to create a seamless AI product lifecycle.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-4" aria-label="Tabs">
                <TabButton isActive={activeTab === 'pm'} onClick={() => setActiveTab('pm')}>Product Management</TabButton>
                <TabButton isActive={activeTab === 'data-ml'} onClick={() => setActiveTab('data-ml')}>Data & ML</TabButton>
                <TabButton isActive={activeTab === 'llm'} onClick={() => setActiveTab('llm')}>LLM Providers</TabButton>
            </nav>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map(provider => (
            <IntegrationCard 
              key={provider.id}
              provider={provider}
              isConnected={!!connections[provider.id]?.apiKey}
              onManage={handleManageConnection}
            />
          ))}
        </div>
      </div>

      <ApiKeyManager
        connections={connections}
        onEdit={handleManageConnection}
        onDelete={handleDeleteApiKey}
      />
      
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApiKey}
        provider={selectedProvider}
      />
    </div>
  );
};