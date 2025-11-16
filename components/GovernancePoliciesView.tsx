
import React, { useState } from 'react';
import type { GovernancePolicy, PolicyCategory } from '../types';
import { NewPolicyModal } from './NewPolicyModal';

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

const PolicyCard: React.FC<{ policy: GovernancePolicy; onToggle: (policy: GovernancePolicy, enabled: boolean) => void; }> = ({ policy, onToggle }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                <PolicyCategoryBadge category={policy.category} />
            </div>
            <ToggleSwitch enabled={policy.enabled} onChange={(enabled) => onToggle(policy, enabled)} />
        </div>
        <p className="text-sm text-gray-600 mt-4">{policy.description}</p>
    </div>
);

interface GovernancePoliciesViewProps {
    policies: GovernancePolicy[];
    onSavePolicy: (policy: GovernancePolicy) => void;
    onUpdatePolicy: (policy: GovernancePolicy) => void;
}

export const GovernancePoliciesView: React.FC<GovernancePoliciesViewProps> = ({ policies, onSavePolicy, onUpdatePolicy }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleTogglePolicy = (policy: GovernancePolicy, enabled: boolean) => {
        onUpdatePolicy({ ...policy, enabled });
    };
    
    const handleSave = (policy: GovernancePolicy) => {
        onSavePolicy(policy);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h2 className="text-2xl font-bold text-gray-900">AI Guardrails & Policies</h2>
                 <button onClick={() => setIsModalOpen(true)} className="mt-4 sm:mt-0 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light transition duration-200">
                    Create New Policy
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">Policy Management</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Enable or disable governance policies that are automatically checked against your prompts. 
                    These guardrails help ensure your AI interactions are safe, compliant, and responsible.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policies.map(policy => (
                    <PolicyCard key={policy.id} policy={policy} onToggle={handleTogglePolicy} />
                ))}
            </div>
            <NewPolicyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
};
