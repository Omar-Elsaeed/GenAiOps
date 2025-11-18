
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MOCK_MODEL_EVALUATIONS, ArrowsRightLeftIcon } from '../constants';
import type { ModelEval } from '../types';

const MetricCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <p className="text-2xl font-semibold text-primary mt-1">{value}</p>
    </div>
);

const ComparisonTable: React.FC<{ evals: ModelEval[] }> = ({ evals }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead>
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                    {evals.map(e => (
                        <th key={e.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{e.modelName} ({e.version})</th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {(['precision', 'recall', 'f1Score', 'accuracy'] as const).map(metric => (
                    <tr key={metric}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</td>
                        {evals.map(e => (
                            <td key={e.id} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{e[metric].toFixed(3)}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Custom styled tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xl">
                <p className="label font-bold text-gray-500">{`Date: ${label}`}</p>
                {payload.map((pld: any) => (
                    pld.stroke !== 'transparent' && (
                        <div key={pld.dataKey} style={{ color: pld.stroke }}>
                            <span className="font-semibold">{pld.name}:</span> {pld.value.toFixed(3)}
                        </div>
                    )
                ))}
            </div>
        );
    }
    return null;
};


export const ModelEvaluationView: React.FC = () => {
    const [selectedEvalIds, setSelectedEvalIds] = useState<string[]>(() => {
        // Default to comparing the last two evaluations
        const evals = MOCK_MODEL_EVALUATIONS;
        return evals.length >= 2 ? [evals[evals.length - 1].id, evals[evals.length - 2].id] : [];
    });
    
    const [hiddenChartLines, setHiddenChartLines] = useState<Set<string>>(new Set());

    const latestEval = MOCK_MODEL_EVALUATIONS[MOCK_MODEL_EVALUATIONS.length - 1];
    
    const handleSelectEval = (evalId: string) => {
        setSelectedEvalIds(prev =>
            prev.includes(evalId)
                ? prev.filter(id => id !== evalId)
                : [...prev, evalId]
        );
    };

    const handleLegendClick = (data: any) => {
        const { dataKey } = data;
        setHiddenChartLines(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dataKey)) {
                newSet.delete(dataKey);
            } else {
                newSet.add(dataKey);
            }
            return newSet;
        });
    };

    const selectedEvals = MOCK_MODEL_EVALUATIONS.filter(e => selectedEvalIds.includes(e.id));
    
    const { chartData, allModelNames } = useMemo(() => {
        const modelNames = [...new Set(MOCK_MODEL_EVALUATIONS.map(ev => ev.modelName))];
        const dataByDate: Record<string, { name: string; [modelName: string]: number | string }> = {};

        MOCK_MODEL_EVALUATIONS.forEach(ev => {
            if (!dataByDate[ev.evaluatedAt]) {
                dataByDate[ev.evaluatedAt] = { name: ev.evaluatedAt };
            }
            dataByDate[ev.evaluatedAt][ev.modelName] = ev.f1Score;
        });

        const sortedData = Object.values(dataByDate).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
        
        // Forward fill data to connect lines
        for (let i = 1; i < sortedData.length; i++) {
            for (const modelName of modelNames) {
                if (sortedData[i][modelName] === undefined && sortedData[i-1][modelName] !== undefined) {
                    sortedData[i][modelName] = sortedData[i-1][modelName];
                }
            }
        }
        return { chartData: sortedData, allModelNames: modelNames };
    }, []);

    const COLORS = ["#3B82F6", "#F97316", "#22C55E", "#EF4444", "#8B5CF6"];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h2 className="text-2xl font-bold text-gray-900">Model Evaluation</h2>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Latest Version Performance: {latestEval.modelName} ({latestEval.version})</h3>
                <p className="text-sm text-gray-500 mb-6">Evaluated on "{latestEval.dataset}" at {latestEval.evaluatedAt}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard title="Precision" value={latestEval.precision.toFixed(2)} />
                    <MetricCard title="Recall" value={latestEval.recall.toFixed(2)} />
                    <MetricCard title="F1-Score" value={latestEval.f1Score.toFixed(2)} />
                    <MetricCard title="Accuracy" value={latestEval.accuracy.toFixed(2)} />
                </div>
            </div>

            {selectedEvals.length > 0 && (
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ArrowsRightLeftIcon className="w-5 h-5 mr-2 text-primary" />
                        Model Comparison
                    </h3>
                    <ComparisonTable evals={selectedEvals} />
                </div>
            )}
           
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend Over Versions</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                            <YAxis stroke="#6B7280" fontSize={12} domain={[0.8, 1]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend onClick={handleLegendClick} wrapperStyle={{ paddingTop: '20px' }} />
                            {allModelNames.map((modelName, index) => (
                                <Line 
                                    key={modelName} 
                                    type="monotone" 
                                    dataKey={modelName} 
                                    name={modelName} 
                                    stroke={hiddenChartLines.has(modelName) ? 'transparent' : COLORS[index % COLORS.length]} 
                                    strokeWidth={2} 
                                    dot={{ r: 4 }} 
                                    activeDot={{ r: 6 }} 
                                    connectNulls 
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation History</h3>
                <p className="text-sm text-gray-500 mb-4">Select two or more evaluations to compare them side-by-side.</p>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-2 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F1-Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dataset</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {MOCK_MODEL_EVALUATIONS.slice().reverse().map((evalData) => (
                                <tr key={evalData.id} className={`hover:bg-gray-50 ${selectedEvalIds.includes(evalData.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-2 py-4">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                            checked={selectedEvalIds.includes(evalData.id)}
                                            onChange={() => handleSelectEval(evalData.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{evalData.modelName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{evalData.version}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-bold">{evalData.f1Score.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{evalData.accuracy.toFixed(2)}</td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{evalData.dataset}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
