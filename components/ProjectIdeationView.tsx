import React, { useState } from 'react';
import type { View, AIIdea } from '../types';
import { getInitialAIIdea } from '../constants';

interface ProjectIdeationViewProps {
  onAddProject: (idea: AIIdea) => void;
  navigate: (view: View) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-charcoal p-6 rounded-xl border border-slate-800">
    <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    {children}
  </div>
);

const TextInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full p-2 bg-slate-800 rounded-md border border-slate-600 focus:ring-primary focus:border-primary" />
);

const TextArea: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number }> = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="w-full p-2 bg-slate-800 rounded-md border border-slate-600 focus:ring-primary focus:border-primary" />
);

const CheckboxGroup: React.FC<{ options: Record<string, string>; values: Record<string, boolean>; onChange: (key: string, value: boolean) => void; nested?: boolean }> = ({ options, values, onChange, nested }) => (
  <div className={`space-y-2 ${nested ? 'pl-6' : ''}`}>
    {Object.entries(options).map(([key, label]) => (
      <label key={key} className="flex items-center space-x-3">
        <input type="checkbox" checked={!!values[key]} onChange={(e) => onChange(key, e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-primary focus:ring-primary" />
        <span className="text-slate-300">{label}</span>
      </label>
    ))}
  </div>
);

const RadioGroup: React.FC<{ name: string; options: Record<string, string>; value: string; onChange: (value: string) => void }> = ({ name, options, value, onChange }) => (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
        {Object.entries(options).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2">
                <input type="radio" name={name} value={key} checked={value === key} onChange={(e) => onChange(e.target.value)} className="h-4 w-4 border-slate-500 bg-slate-700 text-primary focus:ring-primary" />
                <span className="text-slate-300">{label}</span>
            </label>
        ))}
    </div>
);


const FAMILIES_OF_SOLUTIONS = {
  rpa: 'RPA', robotics: 'Robotics', predictions: 'Predictions', optimization: 'Optimization',
  autonomousVehicles: 'Autonomous vehicles', fraudPrediction: 'Fraud prediction',
  recommendations: 'Recommendations', computerVision: 'Computer vision', voice: 'Voice',
  smellTasteTouch: 'Smell/taste/touch', iot: 'IoT/smart city', vrArMetaverse: 'VR/AR/metaverse',
  aiAgent: 'AI agent',
};

const GEN_AI_SOLUTIONS = {
  pictureVideo3d: 'Picture/video/3D', textCode: 'Text/code (incl. LLMs and chats)',
  voiceMusic: 'Voice/music', llmMultimodal: 'LLM multimodal', llmWithRag: 'LLM with RAG',
};

export const ProjectIdeationView: React.FC<ProjectIdeationViewProps> = ({ onAddProject, navigate }) => {
  const [idea, setIdea] = useState<AIIdea>(getInitialAIIdea());
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof AIIdea, value: any) => {
    setIdea(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: keyof AIIdea, field: string, value: any) => {
    setIdea(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as object),
        [field]: value,
      },
    }));
  };

  const handleSubmit = () => {
    if (!idea.ideaName.trim()) {
      setError('Idea Name is required.');
      window.scrollTo(0, 0);
      return;
    }
    setError('');
    onAddProject(idea);
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Project Ideation Canvas</h2>
        <button onClick={() => navigate('projects')} className="text-sm text-primary hover:underline">&larr; Back to Projects</button>
      </div>
      {error && <div className="p-4 bg-red-900/50 border border-red-500/30 rounded-lg text-red-300">{error}</div>}

      {/* Page 1 */}
      <Section title="1. Core Idea">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Idea Name"><TextInput value={idea.ideaName} onChange={(e) => handleInputChange('ideaName', e.target.value)} /></FormField>
          <FormField label="Author/Department"><TextInput value={idea.author} onChange={(e) => handleInputChange('author', e.target.value)} /></FormField>
        </div>
        <FormField label="The Problem">
            <CheckboxGroup options={{processOptimization: 'Process optimization', newFeature: 'New feature', newValueStream: 'New value stream'}} values={idea.problem} onChange={(k,v) => handleNestedChange('problem', k, v)} />
        </FormField>
        <FormField label="The Problem (in 1-2 sentences, explain the current challenge)">
            <TextArea value={idea.problemStatement} onChange={(e) => handleInputChange('problemStatement', e.target.value)} />
        </FormField>
        <FormField label="Personas: Who Has the Problem?"><TextArea value={idea.personas} onChange={(e) => handleInputChange('personas', e.target.value)} /></FormField>
        <FormField label="Idea Description"><TextArea value={idea.ideaDescription} onChange={(e) => handleInputChange('ideaDescription', e.target.value)} /></FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Families of Solutions">
                <CheckboxGroup options={FAMILIES_OF_SOLUTIONS} values={idea.familiesOfSolutions} onChange={(k, v) => handleNestedChange('familiesOfSolutions', k, v)} />
                <div className="mt-4 pl-4 border-l-2 border-slate-600">
                    <p className="font-semibold text-slate-300 mb-2">GenAI:</p>
                    <CheckboxGroup options={GEN_AI_SOLUTIONS} values={idea.familiesOfSolutions} onChange={(k, v) => handleNestedChange('familiesOfSolutions', k, v)} nested />
                </div>
            </FormField>
            <FormField label="Architecture">
                <RadioGroup name="architecture" options={{connects: 'Connects with existing system(s)', standalone: 'Standalone'}} value={idea.architecture} onChange={(v) => handleInputChange('architecture', v)} />
                {idea.architecture === 'connects' && <TextInput value={idea.architectureDetails} onChange={(e) => handleInputChange('architectureDetails', e.target.value)} placeholder="Details..." />}
            </FormField>
        </div>
      </Section>

      {/* Page 2 */}
       <Section title="2. Implementation & Risks">
        <FormField label="Implementation Options">
          <CheckboxGroup
            options={{ buy: 'Buy', build: 'Build', fineTune: 'Fine-tune', useCloud: 'Use cloud', connectAiAgent: 'Connect/AI agent' }}
            values={idea.implementationOptions}
            onChange={(k, v) => handleNestedChange('implementationOptions', k, v)}
          />
        </FormField>
        <FormField label="Value for the User"><TextArea value={idea.valueForUser} onChange={e => handleInputChange('valueForUser', e.target.value)} /></FormField>
        <FormField label="Is Data Available?"><TextArea value={idea.dataAvailable} onChange={e => handleInputChange('dataAvailable', e.target.value)} /></FormField>
        <FormField label="Is It Ethical? What Are the Risks?"><TextArea value={idea.ethicalRisks} onChange={e => handleInputChange('ethicalRisks', e.target.value)} /></FormField>
        <FormField label="To-Be Architecture"><TextArea value={idea.toBeArchitecture} onChange={e => handleInputChange('toBeArchitecture', e.target.value)} rows={6} /></FormField>
        <FormField label="Data Sources"><TextArea value={idea.dataSources} onChange={e => handleInputChange('dataSources', e.target.value)} rows={4} /></FormField>
      </Section>

      {/* Page 3 */}
      <Section title="3. Logistics & Strategy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Time (in months)"><TextInput value={idea.time} onChange={e => handleInputChange('time', e.target.value)} /></FormField>
            <FormField label="ROI (in two years, as a percentage)"><TextInput value={idea.roi} onChange={e => handleInputChange('roi', e.target.value)} /></FormField>
        </div>
        <FormField label="Project Dependencies">
            <RadioGroup name="dependencies" options={{yes: 'Yes', no: 'No', dont_know: "Don't know"}} value={idea.dependencies.hasDependencies} onChange={v => handleNestedChange('dependencies', 'hasDependencies', v)} />
            {idea.dependencies.hasDependencies === 'yes' && <TextInput value={idea.dependencies.details} onChange={e => handleNestedChange('dependencies', 'details', e.target.value)} placeholder="Dependency details..." />}
        </FormField>
        <FormField label="Budget (in USD)">
            <RadioGroup name="budget" options={{lt100k: '<100k', '100k-250k': '100k-250k', '250k-500k': '250k-500k', '500k-1m': '500k-1,000k', gt1m: '>1,000k'}} value={idea.budget} onChange={v => handleInputChange('budget', v)} />
        </FormField>
        <FormField label="Comment"><TextArea value={idea.comment} onChange={e => handleInputChange('comment', e.target.value)} /></FormField>
        <FormField label="Required Resources">
            <TextArea value={idea.requiredResources.people} onChange={e => handleNestedChange('requiredResources', 'people', e.target.value)} placeholder="People: Estimate team members and profiles" />
            <TextArea value={idea.requiredResources.hardware} onChange={e => handleNestedChange('requiredResources', 'hardware', e.target.value)} placeholder="Hardware: List required tech stack resources" />
        </FormField>
        {(idea.implementationOptions.buy || idea.implementationOptions.fineTune) && (
            <FormField label="Implementation Options If Buying or Fine-Tuning">
                <TextArea value={idea.buyOrFineTuneDetails} onChange={e => handleInputChange('buyOrFineTuneDetails', e.target.value)} placeholder="List names of providers you are considering" />
            </FormField>
        )}
        {idea.implementationOptions.buy && (
            <FormField label="Implementation Options If Buying">
                <RadioGroup name="buyMaturity" options={{alpha: 'Alpha', beta: 'Beta', stable: 'Stable solution', stableTraction: 'Stable solution with traction 2+ years'}} value={idea.buyMaturity} onChange={v => handleInputChange('buyMaturity', v)} />
            </FormField>
        )}
        <FormField label="Metrics: How Will We Know That We Achieved Success?"><TextArea value={idea.kpis} onChange={e => handleInputChange('kpis', e.target.value)} /></FormField>
        <FormField label="Risk Strategies"><TextArea value={idea.riskStrategies} onChange={e => handleInputChange('riskStrategies', e.target.value)} /></FormField>
        <FormField label="Market Standard"><TextArea value={idea.marketStandard} onChange={e => handleInputChange('marketStandard', e.target.value)} /></FormField>
      </Section>

      <div className="flex justify-end pt-4">
        <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-lg hover:bg-primary-light transition-transform transform hover:scale-105"
        >
            Create Project
        </button>
      </div>
    </div>
  );
};
