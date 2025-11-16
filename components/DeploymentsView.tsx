
import React, { useState } from 'react';
import type { DeployedArtifact, AIAgent, RegisteredPrompt } from '../types';
import { CloudArrowUpIcon } from '../constants';
import { NewDeploymentModal } from './NewDeploymentModal';

const StatusBadge: React.FC<{ status: DeployedArtifact['status'] }> = ({ status }) => {
    const statusClasses = {
        Active: 'bg-green-900/50 text-green-300 border border-green-500/30',
        Monitoring: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
        Degraded: 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30',
        'Rolled Back': 'bg-slate-700 text-slate-300 border border-slate-600',
    };
    const statusDotClasses = {
        Active: 'bg-green-500',
        Monitoring: 'bg-blue-500 animate-pulse',
        Degraded: 'bg-yellow-500',
        'Rolled Back': 'bg-slate-500',
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${statusDotClasses[status]}`}></span>
            {status}
        </span>
    );
};

interface DeploymentsViewProps {
    deployments: DeployedArtifact[];
    agents: AIAgent[];
    prompts: RegisteredPrompt[];
    onAddDeployment: (deployment: Omit<DeployedArtifact, 'id' | 'deployedAt'>) => void;
    onRollback: (deploymentId: string) => void;
}

export const DeploymentsView: React.FC<DeploymentsViewProps> = ({ deployments, agents, prompts, onAddDeployment, onRollback }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleRollbackClick = (deployment: DeployedArtifact) => {
        if (window.confirm(`Are you sure you want to roll back the deployment of "${deployment.name}" (v${deployment.version})? This will mark its status as 'Rolled Back'.`)) {
            onRollback(deployment.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h2 className="text-2xl font-bold text-slate-100">Phase 9: Deployments</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200"
                >
                    <CloudArrowUpIcon className="w-5 h-5"/>
                    <span>New Deployment</span>
                </button>
            </div>

            <div className="bg-charcoal p-6 rounded-xl border border-slate-800 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Deployment History & Status</h3>
                <p className="text-sm text-slate-400 mb-6">Monitor your deployed AI agents and prompts across different environments.</p>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Version</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Environment</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Deployed At</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {deployments.map((artifact) => (
                                <tr key={artifact.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{artifact.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{artifact.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">v{artifact.version}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{artifact.environment}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={artifact.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{artifact.deployedAt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleRollbackClick(artifact)} 
                                            className="text-primary hover:text-primary-light transition-colors disabled:text-slate-500 disabled:cursor-not-allowed disabled:no-underline"
                                            disabled={artifact.status === 'Rolled Back'}
                                        >
                                            Rollback
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <NewDeploymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onAddDeployment}
                agents={agents}
                prompts={prompts}
            />
        </div>
    );
};
