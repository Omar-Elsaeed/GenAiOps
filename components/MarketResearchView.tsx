import React from 'react';

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-sm text-gray-600 space-y-3 prose prose-sm max-w-none">{children}</div>
    </div>
);

export const MarketResearchView: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Phase 3: User & Market Research</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InfoCard title="SWOT Analysis">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-green-600">Strengths</h4>
                            <ul className="list-disc list-inside">
                                <li>Proprietary dataset</li>
                                <li>Strong in-house engineering team</li>
                                <li>Established brand trust</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-600">Weaknesses</h4>
                            <ul className="list-disc list-inside">
                                <li>Lack of mobile presence</li>
                                <li>High inference costs with current model</li>
                                <li>Slow to iterate on new features</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-600">Opportunities</h4>
                            <ul className="list-disc list-inside">
                                <li>Expand into international markets</li>
                                <li>Utilize multi-modal models for new features</li>
                                <li>Partnership with a major cloud provider</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-yellow-600">Threats</h4>
                            <ul className="list-disc list-inside">
                                <li>New open-source models reducing barrier to entry</li>
                                <li>Changing data privacy regulations (GDPR, CCPA)</li>
                                <li>Big tech competitors launching similar products</li>
                            </ul>
                        </div>
                    </div>
                </InfoCard>
                <InfoCard title="User Persona: 'Data-Driven Dan'">
                     <div className="flex items-start space-x-4">
                        <img src="https://picsum.photos/seed/dan/80/80" alt="User Avatar" className="w-20 h-20 rounded-full border-2 border-primary"/>
                        <div>
                            <p><strong>Role:</strong> Product Manager at a mid-size tech company.</p>
                            <p><strong>Goals:</strong> Wants to quickly validate new AI features, monitor costs, and report on performance to executives without needing a data science degree.</p>
                            <p><strong>Pain Points:</strong> "It's hard to connect our model's performance to actual business KPIs. I spend too much time chasing down engineers for simple reports."</p>
                        </div>
                    </div>
                </InfoCard>
            </div>
             <InfoCard title="Competitive Benchmarking">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Our Product</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Competitor A</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Competitor B</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr><td className="p-2 font-semibold">A/B Testing</td><td className="p-2 text-center text-green-500">✔</td><td className="p-2 text-center text-green-500">✔</td><td className="p-2 text-center text-red-500">✖</td></tr>
                            <tr><td className="p-2 font-semibold">Cost Monitoring</td><td className="p-2 text-center text-green-500">✔</td><td className="p-2 text-center text-red-500">✖</td><td className="p-2 text-center text-green-500">✔</td></tr>
                            <tr><td className="p-2 font-semibold">Real-time Log Analysis</td><td className="p-2 text-center text-green-500">✔</td><td className="p-2 text-center text-red-500">✖</td><td className="p-2 text-center text-red-500">✖</td></tr>
                        </tbody>
                    </table>
                </div>
            </InfoCard>
        </div>
    );
};
