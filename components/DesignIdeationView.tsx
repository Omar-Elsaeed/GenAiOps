import React from 'react';

const ToolCard: React.FC<{ name: string; description: string; link: string; icon: string; }> = ({ name, description, link, icon }) => (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-primary transition-all duration-300 group">
        <div className="flex items-center space-x-4">
            <div className="text-4xl">{icon}</div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary">{name}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
    </a>
);


export const DesignIdeationView: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Phase 5: Design & Ideation</h2>
            
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Visualizing the User Journey</h3>
                <p className="text-sm text-gray-600">
                    This phase is about translating your research and hypotheses into a tangible user experience. Before writing any code, it's crucial to map out the user flow, create wireframes, and brainstorm potential solutions. This ensures that what you build is intuitive, valuable, and directly addresses the user's problem.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ToolCard 
                    name="Figma"
                    description="Visualize user flows, create high-fidelity wireframes, and design the user interface for your AI application."
                    link="https://www.figma.com"
                    icon="🎨"
                />
                <ToolCard 
                    name="Miro"
                    description="A collaborative online whiteboard for brainstorming sessions, mapping out user journeys, and organizing ideas."
                    link="https://www.miro.com"
                    icon="🧠"
                />
            </div>
        </div>
    );
};