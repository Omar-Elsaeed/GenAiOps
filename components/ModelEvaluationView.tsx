import React, { useState } from 'react';
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


export const ModelEvaluationView: React.FC = () => {
    const [selectedEvalIds, setSelectedEvalIds] = useState<string[]>(() => {
        // Default to comparing the last two evaluations
        const evals = MOCK_MODEL_EVALUATIONS;
        return evals.length >= 2 ? [evals[evals.length - 1].id, evals[evals.length - 2].id] : [];
    });
    
    const latestEval = MOCK_MODEL_EVALUATIONS[MOCK_MODEL_EVALUATIONS.length - 1];
    
    const handleSelectEval = (evalId: string) => {
        setSelectedEvalIds(prev =>
            prev.includes(evalId)
                ? prev.filter(id => id !== evalId)
                : [...prev, evalId]
        );
    };

    const selectedEvals = MOCK_MODEL_EVALUATIONS.filter(e => selectedEvalIds.includes(e.id));
    const chartData = MOCK_MODEL_EVALUATIONS.map(ev => {
        const dataPoint: {[key: string]: string | number} = { name: `${ev.modelName} ${ev.version}` };
        if (selectedEvalIds.includes(ev.id)) {
            dataPoint[`${ev.id}-precision`] = ev.precision;
            dataPoint[`${ev.id}-recall`] = ev.recall;
            dataPoint[`${ev.id}-f1Score`] = ev.f1Score;
        }
        return dataPoint;
    });

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
                        <LineChart data={MOCK_MODEL_EVALUATIONS} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="version" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} domain={[0.8, 1]} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }} />
                            <Legend />
                            {selectedEvals.map((ev, index) => (
                                <Line key={ev.id} type="monotone" dataKey="f1Score" data={MOCK_MODEL_EVALUATIONS.filter(e => e.id === ev.id)} name={`${ev.modelName} F1`} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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