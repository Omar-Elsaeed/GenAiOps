import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PlaygroundView } from './components/PlaygroundView';
import { ChatView } from './components/ChatView';
import { PromptRegistryView } from './components/PromptRegistryView';
import { CostIntelligenceView } from './components/CostIntelligenceView';
import { ResponsibleAIView } from './components/ResponsibleAIView';
import { ABTestingView } from './components/ABTestingView';
import { AIAgentsView } from './components/AIAgentsView';
import { ProjectsView } from './components/ProjectsView';
import { ToolsView } from './components/ToolsView';
import { DataHubView } from './components/DataHubView';
import { ModelEvaluationView } from './components/ModelEvaluationView';
import { StakeholderReportsView } from './components/StakeholderReportsView';
import { PromptDetailView } from './components/PromptDetailView';
import { GovernancePoliciesView } from './components/GovernancePoliciesView';
// New/Updated Views for 12-Phase Canvas
import { HypothesisView } from './components/HypothesisView';
import { MarketResearchView } from './components/MarketResearchView';
import { DesignIdeationView } from './components/DesignIdeationView';
import { DeploymentsView } from './components/DeploymentsView';
import { LaunchFeedbackView } from './components/LaunchFeedbackView';
import { DataGovernanceView } from './components/DataGovernanceView';
import { ProjectIdeationView } from './components/ProjectIdeationView';


import { NAV_ITEMS, createNewProjectPhases } from './constants';
import type { View, Project, RegisteredPrompt, AIAgent, ABTest, DeployedArtifact, DatasetInfo, GovernancePolicy, AIIdea } from './types';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<View>('projects');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Centralized state management
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [prompts, setPrompts] = useState<RegisteredPrompt[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [deployments, setDeployments] = useState<DeployedArtifact[]>([]);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptForPlayground, setPromptForPlayground] = useState<RegisteredPrompt | null>(null);
  
  // Select first project on load if available
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
    if(projects.length === 0) {
        setCurrentProject(null);
    }
  }, [projects, currentProject]);


  // Update project counts whenever the underlying data changes
  useEffect(() => {
    if(!currentProject) return;

    setProjects(prevProjects => 
      prevProjects.map(p => 
          p.id === currentProject.id ? {
            ...p,
            agentCount: agents.length,
            promptCount: prompts.length,
            testCount: abTests.length,
          } : p
      )
    );
  }, [agents, prompts, abTests, currentProject]);

  const handleSaveAgent = (agentToSave: AIAgent) => {
    setAgents(prev => {
        const exists = prev.some(a => a.id === agentToSave.id);
        if (exists) {
            return prev.map(a => a.id === agentToSave.id ? agentToSave : a);
        }
        return [agentToSave, ...prev];
    });
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
  };
  
  const handleSavePrompt = (promptToSave: Omit<RegisteredPrompt, 'id' | 'createdAt' | 'versionHistory' | 'version' | 'avgLatency' | 'costPerKTokens' | 'usage24h' | 'errorRate'> & { userPrompt: string }) => {
    const newPrompt: RegisteredPrompt = {
      id: `prompt-${Date.now()}`,
      name: promptToSave.name,
      version: 1,
      model: promptToSave.model,
      systemInstruction: promptToSave.systemInstruction,
      userPrompt: promptToSave.userPrompt,
      createdAt: new Date().toISOString().split('T')[0],
      avgLatency: Math.floor(Math.random() * 400) + 100,
      costPerKTokens: 0, // Should be calculated
      usage24h: 0,
      errorRate: 0,
      versionHistory: [{
          version: 1,
          userPrompt: promptToSave.userPrompt,
          systemInstruction: promptToSave.systemInstruction,
          createdAt: new Date().toISOString().split('T')[0],
          deployed: false,
      }]
    };
    setPrompts(prev => [newPrompt, ...prev]);
  };

  const handleSaveTest = (test: ABTest) => {
    setAbTests(prev => [test, ...prev]);
  };

  const handleAddDeployment = (deployment: Omit<DeployedArtifact, 'id' | 'deployedAt'>) => {
    const newDeployment: DeployedArtifact = {
        ...deployment,
        id: `dep-${Date.now()}`,
        deployedAt: new Date().toISOString().split('T')[0],
    };
    setDeployments(prev => [newDeployment, ...prev]);
  };
  
  const handleRollbackDeployment = (deploymentId: string) => {
      setDeployments(prev => prev.map(d => d.id === deploymentId ? {...d, status: 'Rolled Back'} : d));
  };

  const handleSaveDataset = (dataset: DatasetInfo) => {
    setDatasets(prev => [dataset, ...prev]);
  };

  const handleSavePolicy = (policy: GovernancePolicy) => {
    setPolicies(prev => [policy, ...prev]);
  };

  const handleUpdatePolicy = (policyToUpdate: GovernancePolicy) => {
      setPolicies(prev => prev.map(p => p.id === policyToUpdate.id ? policyToUpdate : p));
  };

  const navigate = (view: View, options?: { promptId?: string, prompt?: RegisteredPrompt }) => {
    if (options?.promptId) {
      setSelectedPromptId(options.promptId);
    } else {
      setSelectedPromptId(null);
    }
    
    if (options?.prompt) {
      setPromptForPlayground(options.prompt);
    } else {
      setPromptForPlayground(null);
    }
    setCurrentView(view);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    if (currentProject && currentProject.id === updatedProject.id) {
      setCurrentProject(updatedProject);
    }
  };
  
  const handleAddNewProject = (idea: AIIdea) => {
    const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: idea.ideaName,
        description: idea.problemStatement,
        createdAt: new Date().toISOString().split('T')[0],
        phases: createNewProjectPhases(),
        agentCount: 0,
        promptCount: 0,
        testCount: 0,
        modelEvalCount: 0,
        integrationCount: 0,
        idea: idea,
    };
    setProjects(prevProjects => [newProject, ...prevProjects]);
    setCurrentProject(newProject);
    navigate('projects');
  };

  const renderView = () => {
    if (currentView !== 'project-ideation' && projects.length === 0) {
        return <ProjectsView currentProject={null} onUpdateProject={handleUpdateProject} onAddProject={navigate} navigate={navigate} />;
    }
    
    switch (currentView) {
      // Workspace
      case 'projects':
        return <ProjectsView currentProject={currentProject} onUpdateProject={handleUpdateProject} onAddProject={navigate} navigate={navigate} />;
      case 'project-ideation':
        return <ProjectIdeationView onAddProject={handleAddNewProject} navigate={navigate} />;

      // Phase 1-3: Strategy & Research
      case 'hypothesis-goals':
        return <HypothesisView />;
      case 'market-research':
        return <MarketResearchView />;

      // Phase 4-5: Data & Design
      case 'data-hub':
        return <DataHubView datasets={datasets} onSaveDataset={handleSaveDataset} />;
      case 'design-ideation':
        return <DesignIdeationView />;
      
      // Phase 6-7: Build & Develop
      case 'agents':
        return <AIAgentsView agents={agents} onSaveAgent={handleSaveAgent} onDeleteAgent={handleDeleteAgent} policies={policies} />;
      case 'registry':
        return <PromptRegistryView prompts={prompts} onSavePrompt={handleSavePrompt} navigate={navigate} />;
      case 'prompt-detail':
        return selectedPromptId ? <PromptDetailView promptId={selectedPromptId} navigate={navigate} prompts={prompts} onAddDeployment={handleAddDeployment} policies={policies} /> : <PromptRegistryView prompts={prompts} onSavePrompt={handleSavePrompt} navigate={navigate} />;
      
      // Phase 8: Validation & Eval
      case 'model-evaluation':
        return <ModelEvaluationView />;
      case 'ab-testing':
        return <ABTestingView tests={abTests} prompts={prompts} onSaveTest={handleSaveTest} />;
      
      // Phase 9-10: Deploy & Feedback
      case 'deployments':
        return <DeploymentsView deployments={deployments} agents={agents} prompts={prompts} onAddDeployment={handleAddDeployment} onRollback={handleRollbackDeployment} />;
      case 'launch-feedback':
        return <LaunchFeedbackView />;
        
      // Phase 11-12: Growth & Governance
      case 'dashboard':
        return <DashboardView />;
      case 'cost':
        return <CostIntelligenceView />;
      case 'stakeholder-reports':
        return <StakeholderReportsView />;
      case 'governance':
        return <GovernancePoliciesView policies={policies} onSavePolicy={handleSavePolicy} onUpdatePolicy={handleUpdatePolicy} />;
      case 'data-governance':
        return <DataGovernanceView />;
      case 'responsible-ai':
        return <ResponsibleAIView datasets={datasets} onSaveDataset={handleSaveDataset} />;
        
      // Core Tools
      case 'playground':
        return <PlaygroundView initialPrompt={promptForPlayground} clearInitialPrompt={() => setPromptForPlayground(null)} onSavePrompt={handleSavePrompt} />;
      case 'tools':
        return <ToolsView />;
      case 'chat':
        return <ChatView />;
        
      default:
        return <ProjectsView currentProject={currentProject} onUpdateProject={handleUpdateProject} onAddProject={navigate} navigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-charcoal-dark text-slate-300 font-sans">
      <Sidebar 
        currentView={currentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        navigate={navigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentView={currentView}
          onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
          currentProject={projects.find(p => p.id === currentProject?.id) || currentProject}
          setCurrentProject={(project) => {
              const fullProject = projects.find(p => p.id === project.id);
              if (fullProject) setCurrentProject(fullProject);
          }}
          projects={projects}
          navItems={NAV_ITEMS}
          navigate={navigate}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
