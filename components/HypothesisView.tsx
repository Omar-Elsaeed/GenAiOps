import React from 'react';

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="text-sm text-gray-600 space-y-2 prose prose-sm max-w-none">{children}</div>
    </div>
);

export const HypothesisView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h2 className="text-2xl font-bold text-gray-900">Phase 2: Hypothesis & Goal Setting</h2>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <InfoCard title="Product Vision">
                    <p>The product vision is your North Star. It's a concise, aspirational statement that describes the long-term goal of your AI product. It should inspire the team and align stakeholders.</p>
                    <p><strong>Example:</strong> "To become the most intelligent and helpful e-commerce shopping assistant, making online shopping effortless and personalized for everyone."</p>
                </InfoCard>
                <InfoCard title="Success Metrics (KPIs)">
                    <p>Key Performance Indicators (KPIs) are quantifiable measures used to track progress towards your business goals. They must be measurable, specific, and tied to the product's impact.</p>
                    <ul>
                        <li><strong>North Star Metric:</strong> Daily Active Users (DAU)</li>
                        <li><strong>Business KPI:</strong> Conversion Rate, Average Order Value (AOV)</li>
                        <li><strong>Model KPI:</strong> Click-Through Rate (CTR) on recommendations, latency</li>
                    </ul>
                </InfoCard>
                <InfoCard title="Testable Hypotheses">
                    <p>A hypothesis is a clear, testable statement about an expected outcome. It connects a proposed feature or change to a measurable KPI, forming the basis for experiments like A/B tests.</p>
                    <p><strong>Formula:</strong> We believe that [doing this] for [these users] will result in [this outcome]. We will know this is true when we see [this metric change].</p>
                    <p><strong>Example:</strong> "We believe that implementing a personalized recommendation agent for returning customers will increase user engagement. We will know this is true when we see a 10% increase in AOV for this user segment."</p>
                </InfoCard>
            </div>
        </div>
    );
};
