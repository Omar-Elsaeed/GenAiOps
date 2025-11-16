import React from 'react';
import type { Project, View, NavItem, NavSection } from '../types';
import { FolderIcon, ChevronDownIcon, BellIcon, CogIcon } from '../constants';

interface HeaderProps {
  currentView: View;
  onMenuClick: () => void;
  currentProject: Project;
  setCurrentProject: (project: Project) => void;
  projects: Project[];
  navItems: (NavItem | NavSection)[];
  navigate: (view: View) => void;
}

const Breadcrumbs: React.FC<{
  currentView: View;
  navItems: (NavItem | NavSection)[];
  navigate: (view: View) => void;
}> = ({ currentView, navItems, navigate }) => {
    let path: { name: string; view?: View }[] = [];
    
    if (currentView === 'prompt-detail') {
        path = [
            { name: 'Projects', view: 'projects' },
            { name: 'Prompt Registry', view: 'registry' },
            { name: 'Details' }
        ];
    } else {
        for (const section of navItems) {
            if ('items' in section) {
                const foundItem = section.items.find(item => item.view === currentView);
                if (foundItem) {
                    path = [
                        { name: 'Projects', view: 'projects' },
                        { name: section.name },
                        { name: foundItem.name, view: foundItem.view }
                    ];
                    break;
                }
            }
        }
    }
    
    if (path.length === 0) {
        path = [{ name: 'Projects', view: 'projects' }];
    }

    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                {path.map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                        {index > 0 && (
                            <svg className="w-3 h-3 text-slate-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                            </svg>
                        )}
                        {item.view && index < path.length - 1 ? (
                            <button onClick={() => navigate(item.view!)} className="text-sm font-medium text-slate-400 hover:text-primary-light">
                                {item.name}
                            </button>
                        ) : (
                            <span className="text-sm font-medium text-slate-200">{item.name}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export const Header: React.FC<HeaderProps> = ({ currentView, onMenuClick, currentProject, setCurrentProject, projects, navItems, navigate }) => {
  return (
    <header className="flex-shrink-0 bg-charcoal-dark/70 backdrop-blur-lg border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="lg:hidden mr-4 text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <Breadcrumbs currentView={currentView} navItems={navItems} navigate={navigate} />
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <select 
            value={currentProject.id}
            onChange={(e) => {
              const selectedProject = projects.find(p => p.id === e.target.value);
              if (selectedProject) {
                setCurrentProject(selectedProject);
              }
            }}
            className="appearance-none bg-slate-800/50 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 pr-8 py-2 hover:bg-slate-800 transition-colors"
            aria-label="Select Project"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FolderIcon className="h-5 w-5"/>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <ChevronDownIcon className="h-4 w-4" />
          </div>
        </div>
         <button className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <BellIcon className="w-6 h-6" />
        </button>
         <button className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <CogIcon className="w-6 h-6" />
        </button>
        <div className="relative">
            <img src="https://picsum.photos/seed/user/40/40" alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-primary-dark"/>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-charcoal-dark"></span>
        </div>
      </div>
    </header>
  );
};