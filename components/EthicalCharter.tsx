import React, { useState } from 'react';

const EthicalCharter: React.FC = () => {
    const [charterContent, setCharterContent] = useState(
        `## Project Phoenix Ethical Charter
This document outlines the ethical principles guiding the development and deployment of our AI systems.

### 1. Human-centric Design
Our AI will be designed to augment human capabilities, not replace them. The user will always be in control.

### 2. Accountability & Transparency
We are responsible for the outcomes of our AI. We will be transparent about its capabilities and limitations.

### 3. Fairness & Inclusivity
We will proactively identify and mitigate biases in our data and models to ensure fair and equitable treatment for all users.`
    );

    return (
        <div>
            <h3 className="text-md font-semibold text-slate-200 mb-2">Project Ethical Charter</h3>
            <p className="text-sm text-slate-400 mb-4">Define and maintain the core ethical principles for this AI project. This charter serves as a guide for all development and deployment decisions.</p>
             <div className="bg-charcoal-dark border border-slate-700 rounded-lg overflow-hidden">
                <textarea
                    value={charterContent}
                    onChange={(e) => setCharterContent(e.target.value)}
                    rows={12}
                    className="w-full p-4 bg-slate-900 text-slate-300 rounded-md border-0 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 font-mono text-sm"
                    placeholder="Define your ethical principles here..."
                />
            </div>
        </div>
    );
};

export default EthicalCharter;
