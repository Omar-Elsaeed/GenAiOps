



import React, { useState, useMemo } from 'react';
import { MOCK_DATASETS, MOCK_AI_AGENTS, MOCK_MODEL_EVALUATIONS, MOCK_DEPLOYMENTS, MOCK_ACCESS_RULES, MOCK_RETENTION_POLICIES } from '../constants';
import type { DatasetInfo, DatasetSensitivity, AccessControlRule, UserRole, Permission, RetentionPolicy } from '../types';
import { ChipIcon, DatabaseIcon, ClipboardCheckIcon, CloudArrowUpIcon } from '../constants';


const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        {children}
    </button>
);

const QualityScoreBadge: React.FC<{ score: number | undefined }> = ({ score }) => {
    if (score === undefined || score === null) {
        return <span className="text-gray-500 text-sm">N/A</span>;
    }

    const getScoreInfo = (s: number) => {
        if (s >= 90) return { text: 'Excellent', classes: 'bg-green-100 text-green-800' };
        if (s >= 75) return { text: 'Good', classes: 'bg-blue-100 text-blue-800' };
        if (s >= 50) return { text: 'Fair', classes: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Poor', classes: 'bg-red-100 text-red-800' };
    };

    const { text, classes } = getScoreInfo(score);

    return (
        <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${classes}`}>
                {score}/100
            </span>
            <span className="text-sm text-gray-500 hidden md:inline">{text}</span>
        </div>
    );
};

const DataCatalogTab: React.FC = () => {
    const [datasets, setDatasets] = useState<DatasetInfo[]>(MOCK_DATASETS);
    const [scannedIds, setScannedIds] = useState<Set<string>>(new Set());
    const [scanningQualityId, setScanningQualityId] = useState<string | null>(null);

    const handleSensitivityChange = (id: string, newSensitivity: DatasetSensitivity) => {
        setDatasets(datasets.map(d => d.id === id ? { ...d, sensitivity: newSensitivity } : d));
    };

    const handleScan = (id: string) => {
        setScannedIds(prev => new Set(prev).add(id));
    };
    
    const handleQualityScan = (id: string) => {
        setScanningQualityId(id);
        setTimeout(() => {
            const newScore = Math.floor(Math.random() * 40) + 60;
            setDatasets(prev => prev.map(d => d.id === id ? { ...d, qualityScore: newScore } : d));
            setScanningQualityId(null);
        }, 1500);
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dataset Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sensitivity Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Quality Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PII Scan Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {datasets.map(dataset => (
                        <tr key={dataset.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataset.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dataset.source}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <select 
                                    value={dataset.sensitivity}
                                    onChange={(e) => handleSensitivityChange(dataset.id, e.target.value as DatasetSensitivity)}
                                    className="p-1 bg-white border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                >
                                    <option>Public</option>
                                    <option>Internal</option>
                                    <option>Confidential</option>
                                    <option>PII</option>
                                </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <QualityScoreBadge score={dataset.qualityScore} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {scannedIds.has(dataset.id) ? (
                                    dataset.sensitivity === 'PII' ? 
                                        <span className="text-red-600 font-semibold">PII Found</span> : 
                                        <span className="text-green-600">No PII Found</span>
                                ) : (
                                    <span className="text-gray-500">Not Scanned</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                <button onClick={() => handleScan(dataset.id)} className="text-primary hover:underline disabled:text-gray-400 disabled:no-underline" disabled={scannedIds.has(dataset.id)}>
                                    Scan PII
                                </button>
                                <button onClick={() => handleQualityScan(dataset.id)} className="text-primary hover:underline disabled:text-gray-400" disabled={scanningQualityId === dataset.id}>
                                    {scanningQualityId === dataset.id ? 'Scanning...' : 'Scan Quality'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ROLES: UserRole[] = ['Admin', 'Developer', 'Analyst', 'Guest'];
const PERMISSIONS: Permission[] = ['Read', 'Write', 'Deny'];

const AccessControlTab: React.FC = () => {
    const [permissions, setPermissions] = useState<Record<UserRole, Record<string, Permission>>>(() => {
         const initialPermissions = ROLES.reduce((acc, role) => {
            acc[role] = {};
            MOCK_DATASETS.forEach(dataset => {
                const rule = MOCK_ACCESS_RULES.find(r => r.role === role && r.datasetId === dataset.id);
                acc[role][dataset.id] = rule ? rule.permission : 'Deny';
            });
            return acc;
        }, {} as Record<UserRole, Record<string, Permission>>);
        return initialPermissions;
    });
    
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(ROLES[0]);

    const handlePermissionChange = (datasetId: string, permission: Permission) => {
        if (!selectedRole) return;
        setPermissions(prev => ({
            ...prev,
            [selectedRole]: { ...prev[selectedRole], [datasetId]: permission }
        }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
                <h4 className="font-semibold text-gray-700 mb-4">Select a Role</h4>
                <div className="space-y-2">
                    {ROLES.map(role => (
                        <button 
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left p-3 rounded-md transition-colors ${selectedRole === role ? 'bg-primary text-white font-semibold shadow-sm' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
            <div className="md:col-span-3">
                {selectedRole ? (
                    <div className="p-4 rounded-lg border border-gray-200 bg-white">
                        <h4 className="font-semibold text-gray-700 mb-4">Permissions for <span className="text-primary">{selectedRole}</span></h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dataset</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {MOCK_DATASETS.map(dataset => {
                                        const currentPermission = permissions[selectedRole]?.[dataset.id] || 'Deny';
                                        return (
                                            <tr key={dataset.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataset.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <select
                                                        value={currentPermission}
                                                        onChange={e => handlePermissionChange(dataset.id, e.target.value as Permission)}
                                                        className="p-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                                    >
                                                        {PERMISSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg min-h-[200px] border border-gray-200">
                        <p className="text-gray-500">Select a role to view and edit permissions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const RetentionPoliciesTab: React.FC = () => {
    const [policies, setPolicies] = useState<RetentionPolicy[]>(MOCK_RETENTION_POLICIES);
    const [newPolicySource, setNewPolicySource] = useState('');
    const [newPolicyDays, setNewPolicyDays] = useState<number | ''>(90);
    const [newPolicyAction, setNewPolicyAction] = useState<'Delete' | 'Archive'>('Delete');
    const [error, setError] = useState('');

    const handleAddPolicy = () => {
        if (!newPolicySource.trim() || !newPolicyDays) {
            setError('Dataset Source and Retention days are required.');
            return;
        }
        setError('');
        const newPolicy: RetentionPolicy = {
            id: `rp-${Date.now()}`,
            datasetSource: newPolicySource.trim(),
            retentionDays: newPolicyDays,
            action: newPolicyAction,
        };
        setPolicies(prev => [newPolicy, ...prev]);
        setNewPolicySource('');
        setNewPolicyDays(90);
        setNewPolicyAction('Delete');
    };

    const handleDeletePolicy = (id: string) => {
        setPolicies(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">Add New Retention Policy</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="source-input" className="block text-sm font-medium text-gray-700">Dataset Source</label>
                        <input type="text" id="source-input" value={newPolicySource} onChange={e => setNewPolicySource(e.target.value)} placeholder="e.g., Zendesk" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                    </div>
                     <div>
                        <label htmlFor="days-input" className="block text-sm font-medium text-gray-700">Retention (days)</label>
                        <input type="number" id="days-input" value={newPolicyDays} onChange={e => setNewPolicyDays(e.target.value ? parseInt(e.target.value, 10) : '')} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                    </div>
                    <div>
                        <label htmlFor="action-select" className="block text-sm font-medium text-gray-700">Action</label>
                        <select id="action-select" value={newPolicyAction} onChange={e => setNewPolicyAction(e.target.value as any)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm">
                            <option value="Delete">Delete</option>
                            <option value="Archive">Archive</option>
                        </select>
                    </div>
                    <button onClick={handleAddPolicy} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark">Add Policy</button>
                </div>
                 {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>

            <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dataset Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retention Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {policies.map(policy => (
                            <tr key={policy.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{policy.datasetSource}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{policy.retentionDays} days</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{policy.action}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDeletePolicy(policy.id)} className="text-red-600 hover:text-red-500">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LineageCard: React.FC<{ title: string; items: { name: string; version?: string }[]; icon: React.ReactElement }> = ({ title, items, icon }) => (
    <div className="flex-1">
        <div className="flex items-center space-x-2 mb-4">
            {React.cloneElement(icon, { className: 'w-6 h-6' })}
            <h4 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">{title}</h4>
        </div>
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.name} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.version && <p className="text-xs text-gray-500">{item.version}</p>}
                </div>
            ))}
        </div>
    </div>
);

const DataLineageTab: React.FC = () => {
    const [selectedAgentId, setSelectedAgentId] = useState<string>(MOCK_AI_AGENTS[4].id);

    const lineage = useMemo(() => {
        const agent = MOCK_AI_AGENTS.find(a => a.id === selectedAgentId);
        if (!agent) return null;
        const modelEval = MOCK_MODEL_EVALUATIONS[2];
        const dataset = MOCK_DATASETS[0];
        const deployment = MOCK_DEPLOYMENTS.find(d => d.name === agent.name);
        return {
            dataset: { name: dataset.name },
            modelEval: { name: modelEval.modelName, version: `v${modelEval.version}` },
            agent: { name: agent.name, version: `v${agent.version}` },
            deployment: deployment ? { name: deployment.name, version: `v${deployment.version} to ${deployment.environment}` } : null,
        };
    }, [selectedAgentId]);

    const ICONS: Record<string, React.ReactElement> = {
        'Source Data': <DatabaseIcon className="text-cyan" />,
        'Model Eval': <ClipboardCheckIcon className="text-yellow-400" />,
        'AI Agent': <ChipIcon className="text-purple-light" />,
        'Deployment': <CloudArrowUpIcon className="text-green-400" />,
    };

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="lineage-agent-select" className="block text-sm font-medium text-gray-700 mb-2">Select an Agent to Trace Lineage</label>
                <select 
                    id="lineage-agent-select"
                    value={selectedAgentId}
                    onChange={e => setSelectedAgentId(e.target.value)}
                    className="w-full max-w-sm p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary"
                >
                    {MOCK_AI_AGENTS.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                </select>
            </div>
            {lineage && (
                <div className="relative flex flex-col md:flex-row items-stretch justify-between space-y-8 md:space-y-0 md:space-x-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <LineageCard title="Source Data" items={[lineage.dataset]} icon={ICONS['Source Data']} />
                    <div className="text-gray-300 md:mt-20 text-2xl font-sans self-center">&rarr;</div>
                    <LineageCard title="Model Eval" items={[lineage.modelEval]} icon={ICONS['Model Eval']} />
                     <div className="text-gray-300 md:mt-20 text-2xl font-sans self-center">&rarr;</div>
                    <LineageCard title="AI Agent" items={[lineage.agent]} icon={ICONS['AI Agent']} />
                    <div className="text-gray-300 md:mt-20 text-2xl font-sans self-center">&rarr;</div>
                    <LineageCard title="Deployment" items={lineage.deployment ? [lineage.deployment] : [{name: 'Not Deployed'}]} icon={ICONS['Deployment']} />
                </div>
            )}
        </div>
    );
};


export const DataGovernanceView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'catalog' | 'access' | 'retention' | 'lineage'>('access');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Phase 12: Data Governance</h2>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex flex-wrap gap-4" aria-label="Tabs">
                        <TabButton isActive={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')}>Data Catalog & Classification</TabButton>
                        <TabButton isActive={activeTab === 'access'} onClick={() => setActiveTab('access')}>Access Control</TabButton>
                        <TabButton isActive={activeTab === 'retention'} onClick={() => setActiveTab('retention')}>Retention Policies</TabButton>
                        <TabButton isActive={activeTab === 'lineage'} onClick={() => setActiveTab('lineage')}>Data Lineage</TabButton>
                    </nav>
                </div>
                <div>
                    {activeTab === 'catalog' && <DataCatalogTab />}
                    {activeTab === 'access' && <AccessControlTab />}
                    {activeTab === 'retention' && <RetentionPoliciesTab />}
                    {activeTab === 'lineage' && <DataLineageTab />}
                </div>
            </div>
        </div>
    );
};