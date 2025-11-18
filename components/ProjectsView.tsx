

import React, { useState } from 'react';
import { PhaseDetailModal } from './PhaseDetailModal';
import type { Project, View, ProjectPhase } from '../types';
import { ChipIcon, DatabaseIcon, BeakerIcon, ClipboardCheckIcon, PlusIcon, LightBulbIcon } from '../constants';

const getStatusColorClasses = (status: ProjectPhase['status']) => {
    switch (status) {
        case 'Completed':
            return {
                bg: 'bg-green-100',
                text: 'text-green-700',
                border: 'border-green-200',
                hoverBorder: 'hover:border-green-400',
            };
        case 'In Progress':
            return {
                bg: 'bg-blue-100',
                text: 'text-blue-700',
                border: 'border-blue-200',
                hoverBorder: 'hover:border-blue-400',
            };
        case 'Not Started':
        default:
            return {
                bg: 'bg-gray-100',
                text: 'text-gray-500',
                border: 'border-gray-200',
                hoverBorder: 'hover:border-gray-400',
            };
    }
};

const PhaseCard: React.FC<{ phase: ProjectPhase; onClick: () => void }> = ({ phase, onClick }) => {
    const colors = getStatusColorClasses(phase.status);
    const contentPreview = phase.content ? new DOMParser().parseFromString(phase.content, 'text/html').body.textContent || '' : '';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 shadow-sm flex flex-col h-full ${colors.bg} ${colors.border} ${colors.hoverBorder}`}
        >
            <div className="flex-grow">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text}`}>{phase.status}</span>
                <h4 className="font-semibold text-gray-800 mt-2">{phase.name}</h4>
                <p className={`text-xs mt-1 ${colors.text}`}>{phase.description}</p>
                {contentPreview && (
                    <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-300 pl-2 truncate">
                        {contentPreview}
                    </p>
                )}
            </div>
            <div className="text-right text-xs font-semibold text-primary mt-2">View/Edit</div>
        </button>
    );
};

const DashboardMetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactElement;
  onClick: () => void;
  color: 'primary' | 'secondary' | 'accent' | 'yellow';
}> = ({ title, value, icon, onClick, color }) => {
    const colorClasses = {
        primary: { bg: 'bg-primary-100', text: 'text-primary-600', hoverBorder: 'hover:border-primary-300' },
        secondary: { bg: 'bg-secondary-100', text: 'text-secondary-600', hoverBorder: 'hover:border-secondary-300' },
        accent: { bg: 'bg-accent-100', text: 'text-accent-600', hoverBorder: 'hover:border-accent-300' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', hoverBorder: 'hover:border-yellow-300' },
    };
    const classes = colorClasses[color];

    return (
      <button onClick={onClick} className={`p-4 rounded-xl border transition-all duration-300 shadow-sm text-left flex items-start space-x-4 bg-white ${classes.hoverBorder}`}>
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${classes.bg} ${classes.text}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">{title}</h4>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
      </button>
    );
};

interface ProjectsViewProps {
  currentProject: Project | null;
  onUpdateProject: (project: Project) => void;
  onAddProject: (view: View) => void;
  navigate: (view: View) => void;
}

const NoProjectsView: React.FC<{ onCreateProject: () => void }> = ({ onCreateProject }) => (
    <div className="text-center py-16 px-6 bg-charcoal rounded-xl border border-slate-800 shadow-lg">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
             <LightBulbIcon className="w-8 h-8 text-white"/>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Welcome to GenAI Ops Hub</h2>
        <p className="text-slate-400 mt-2 max-w-lg mx-auto">
            This is your central workspace to manage the entire lifecycle of your AI products, from ideation to governance.
        </p>
        <button
            onClick={onCreateProject}
            className="mt-8 flex items-center mx-auto space-x-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-charcoal focus:ring-primary-light transition duration-200 text-lg"
        >
            <PlusIcon className="w-6 h-6"/>
            <span>Create Your First AI Project</span>
        </button>
    </div>
);


export const ProjectsView: React.FC<ProjectsViewProps> = ({ currentProject, onUpdateProject, onAddProject, navigate }) => {
    const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);
    const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);

    const handlePhaseClick = (phase: ProjectPhase) => {
        setSelectedPhase(phase);
        setIsPhaseModalOpen(true);
    };

    const handleClosePhaseModal = () => {
        setIsPhaseModalOpen(false);
        setSelectedPhase(null);
    };

    const handleUpdatePhase = (updatedPhase: ProjectPhase) => {
        if(!currentProject) return;
        const updatedPhases = currentProject.phases.map(p => 
            p.id === updatedPhase.id ? updatedPhase : p
        );
        onUpdateProject({ ...currentProject, phases: updatedPhases });
    };

    if (!currentProject) {
        return <NoProjectsView onCreateProject={() => onAddProject('project-ideation')} />;
    }

    const completedPhases = currentProject.phases.filter(p => p.status === 'Completed').length;
    
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{currentProject.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">{currentProject.description}</p>
                    </div>
                     <button
                        onClick={() => onAddProject('project-ideation')}
                        className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200"
                    >
                        <PlusIcon className="w-5 h-5"/>
                        <span>New Project</span>
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <DashboardMetricCard title="AI Agents" value={currentProject.agentCount} icon={<ChipIcon className="w-6 h-6" />} onClick={() => navigate('agents')} color="primary"/>
                    <DashboardMetricCard title="Prompts" value={currentProject.promptCount} icon={<DatabaseIcon className="w-6 h-6" />} onClick={() => navigate('registry')} color="secondary"/>
                    <DashboardMetricCard title="A/B Tests" value={currentProject.testCount} icon={<BeakerIcon className="w-6 h-6" />} onClick={() => navigate('ab-testing')} color="accent"/>
                    <DashboardMetricCard title="Model Evals" value={currentProject.modelEvalCount} icon={<ClipboardCheckIcon className="w-6 h-6" />} onClick={() => navigate('model-evaluation')} color="yellow"/>
                    <div className="p-4 rounded-xl border bg-white flex flex-col justify-center items-center text-center">
                        <h4 className="text-sm font-medium text-gray-500">Lifecycle Progress</h4>
                        <div className="mt-2 text-2xl font-semibold text-gray-900">
                            {completedPhases} <span className="text-lg text-gray-500">/ {currentProject.phases.length}</span>
                        </div>
                        <p className="text-xs text-gray-400">Phases Completed</p>
                    </div>
                </div>
            </div>

            <div>
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Project Lifecycle Hub</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentProject.phases.map(phase => (
                        <PhaseCard key={phase.id} phase={phase} onClick={() => handlePhaseClick(phase)} />
                    ))}
                </div>
            </div>

            {selectedPhase && (
                <PhaseDetailModal
                    isOpen={isPhaseModalOpen}
                    onClose={handleClosePhaseModal}
                    phase={selectedPhase}
                    onUpdate={handleUpdatePhase}
                />
            )}
        </div>
    );
};
