
import React, { useState, useEffect, useRef } from 'react';
import type { GovernancePolicy, PolicyCategory, SensitivityLevel, RegisteredPrompt, PromptVersion } from '../types';

interface NewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: GovernancePolicy) => void;
}

const CATEGORIES: PolicyCategory[] = ['Security', 'Fairness', 'Data Privacy', 'Compliance'];
const SENSITIVITIES: SensitivityLevel[] = ['Low', 'Medium', 'High'];

export const NewPolicyModal: React.FC<NewPolicyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<PolicyCategory>('Security');
    const [sensitivity, setSensitivity] = useState<SensitivityLevel>('Medium');
    const [keywords, setKeywords] = useState('');
    const [error, setError] = useState('');
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setCategory('Security');
            setSensitivity('Medium');
            setKeywords('');
            setError('');
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            setError('Policy name is required.');
            return;
        }

        const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);

        const newPolicy: GovernancePolicy = {
            id: `gov-${Date.now()}`,
            name: name.trim(),
            description: description.trim(),
            category,
            sensitivity,
            enabled: true,
            check: (prompt: RegisteredPrompt | PromptVersion) => {
                if (keywordsArray.length === 0) {
                    return { policyId: newPolicy.id, status: 'Pass', details: 'No keywords configured for this policy.' };
                }
                const foundKeyword = keywordsArray.find(kw => prompt.userPrompt.toLowerCase().includes(kw.toLowerCase()));
                if (foundKeyword) {
                    return { policyId: newPolicy.id, status: 'Fail', details: `Detected forbidden keyword: "${foundKeyword}"` };
                }
                return { policyId: newPolicy.id, status: 'Pass', details: 'No forbidden keywords detected.' };
            }
        };
        onSave(newPolicy);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-charcoal-dark text-slate-200 rounded-2xl border border-slate-700 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold">Create New Guardrail Policy</h2>
                </header>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="policy-name" className="block text-sm font-medium text-slate-300 mb-1">Policy Name</label>
                        <input type="text" id="policy-name" ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-slate-800 rounded-md border border-slate-600" />
                        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                    </div>
                     <div>
                        <label htmlFor="policy-desc" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea id="policy-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 bg-slate-800 rounded-md border border-slate-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="policy-cat" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                            <select id="policy-cat" value={category} onChange={e => setCategory(e.target.value as PolicyCategory)} className="w-full p-2 bg-slate-800 rounded-md border border-slate-600">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="policy-sens" className="block text-sm font-medium text-slate-300 mb-1">Sensitivity</label>
                            <select id="policy-sens" value={sensitivity} onChange={e => setSensitivity(e.target.value as SensitivityLevel)} className="w-full p-2 bg-slate-800 rounded-md border border-slate-600">
                                {SENSITIVITIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="policy-keywords" className="block text-sm font-medium text-slate-300 mb-1">Keywords to Block (comma-separated)</label>
                        <input type="text" id="policy-keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g., financial advice, confidential" className="w-full p-2 bg-slate-800 rounded-md border border-slate-600" />
                        <p className="text-xs text-slate-500 mt-1">A simple check will be created to fail if these words are in the user prompt.</p>
                    </div>
                </div>
                <footer className="p-4 flex justify-end space-x-2 border-t border-slate-700">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg">Create Policy</button>
                </footer>
            </div>
        </div>
    );
};
