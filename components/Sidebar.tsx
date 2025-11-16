import React, { useState, useEffect, useMemo } from 'react';
import type { View, NavItem, NavSection } from '../types';
import { NAV_ITEMS, ChevronDownIcon, MagnifyingGlassIcon } from '../constants';

interface SidebarProps {
  currentView: View;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  navigate: (view: View) => void; 
}

const Logo: React.FC = () => (
    <div className="flex items-center space-x-3 px-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
             <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.378 1.602a.75.75 0 00-.756 0L3.34 6.602a.75.75 0 00-.34.65v9.5c0 .245.14.47.36.602l8.28 4.996a.75.75 0 00.72 0l8.28-4.996a.75.75 0 00.36-.603v-9.5a.75.75 0 00-.34-.65L12.378 1.602zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zM12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-100">GenAI Ops Hub</h1>
    </div>
);

const NavLink: React.FC<{ item: NavItem; isActive: boolean; onClick: () => void; }> = ({ item, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 pl-4 pr-4 py-2.5 rounded-md transition-all duration-200 text-sm group relative ${
      isActive
        ? 'bg-primary/10 text-slate-100 font-semibold shadow-inner shadow-primary/10'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full animate-pulse"></div>}
    {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`})}
    <span className="truncate">{item.name}</span>
  </button>
);

const NavSectionHeader: React.FC<{ title: string; isOpen: boolean; isActive: boolean; onClick: () => void; }> = ({ title, isOpen, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex justify-between items-center px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${isActive ? 'bg-primary/20 text-primary-light' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
        aria-expanded={isOpen}
    >
        <span className="truncate">{title}</span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, isOpen, setIsOpen, navigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const parentViewMap: Record<View, View> = {
    'projects': 'projects',
    'problem-framing': 'problem-framing',
    'hypothesis-goals': 'hypothesis-goals',
    'market-research': 'market-research',
    'data-hub': 'data-hub',
    'design-ideation': 'design-ideation',
    'agents': 'agents',
    'registry': 'registry',
    'prompt-detail': 'registry',
    'model-evaluation': 'model-evaluation',
    'ab-testing': 'ab-testing',
    'deployments': 'deployments',
    'launch-feedback': 'launch-feedback',
    'dashboard': 'dashboard',
    'cost': 'cost',
    'stakeholder-reports': 'stakeholder-reports',
    'governance': 'governance',
    'data-governance': 'data-governance',
    'responsible-ai': 'responsible-ai',
    'playground': 'playground',
    'tools': 'tools',
    'chat': 'chat',
  };

  const findParentSection = (view: View) => {
    const effectiveView = parentViewMap[view] || view;
    const parentSection = NAV_ITEMS.find(section => 
      'items' in section && section.items.some(item => item.view === effectiveView)
    );
    return parentSection && 'name' in parentSection ? parentSection.name : null;
  };

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const currentSection = findParentSection(currentView);
    return new Set(currentSection ? [currentSection] : []);
  });

  useEffect(() => {
    const parentSectionName = findParentSection(currentView);
    if (parentSectionName && !openSections.has(parentSectionName)) {
      setOpenSections(prev => new Set(prev).add(parentSectionName));
    }
  }, [currentView]);
  
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) {
        return NAV_ITEMS;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return NAV_ITEMS.map(section => {
        if ('items' in section) {
            const filteredItems = section.items.filter(item => 
                item.name.toLowerCase().includes(lowercasedQuery)
            );
            if (filteredItems.length > 0) {
                return { ...section, items: filteredItems };
            }
        }
        return null;
    }).filter(Boolean) as (NavItem | NavSection)[];
  }, [searchQuery]);

  useEffect(() => {
      if (searchQuery.trim()) {
          const allFilteredSectionNames = filteredNavItems
              .filter(section => 'items' in section)
              .map(section => (section as NavSection).name);
          setOpenSections(new Set(allFilteredSectionNames));
      }
  }, [searchQuery, filteredNavItems]);


  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const handleNavigate = (view: View) => {
    if (view === 'registry') {
        navigate('registry');
    } else {
        navigate(view);
    }
    setIsOpen(false);
  };

  const activeParentSectionName = findParentSection(currentView);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      <aside className={`fixed lg:relative z-40 lg:z-auto w-64 h-full bg-charcoal-dark p-4 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <Logo />

        <div className="relative px-2 mb-4">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 absolute top-1/2 left-5 -translate-y-1/2" />
            <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/70 border-slate-700 rounded-md pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:bg-slate-900 focus:border-primary text-slate-300 placeholder-slate-500"
            />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
            {filteredNavItems.map((section) => {
                if ('items' in section) {
                    const isSectionOpen = openSections.has(section.name);
                    return (
                        <div key={section.name}>
                            <NavSectionHeader 
                                title={section.name} 
                                isOpen={isSectionOpen}
                                isActive={!searchQuery.trim() && section.name === activeParentSectionName}
                                onClick={() => toggleSection(section.name)}
                            />
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSectionOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
                                <div className="pt-1 pl-2 space-y-1">
                                    {section.items.map(item => {
                                        const effectiveView = parentViewMap[currentView] || currentView;
                                        const isActive = item.view === effectiveView;
                                        return (
                                            <NavLink 
                                                key={item.view}
                                                item={item}
                                                isActive={isActive}
                                                onClick={() => handleNavigate(item.view)}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </nav>
        <div className="mt-auto text-center text-xs text-slate-600 pt-4">
            <p>&copy; {new Date().getFullYear()} GenAI Ops Hub</p>
        </div>
      </aside>
    </>
  );
};