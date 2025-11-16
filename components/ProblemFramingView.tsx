
import React, { useState } from 'react';
import { generateProblemStatement } from '../services/geminiService';
import { PulsingText } from './Spinner';
import ReactMarkdown from 'react-markdown';

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="text-sm text-gray-600 space-y-2">{children}</div>
    </div>
);

const InputField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
}> = ({ id, label, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={4}
            className="w-full p-3 bg-white text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
        />
    </div>
);

export const ProblemFramingView: React.FC = () => {
    const [businessGoal, setBusinessGoal] = useState('');
    const [userProblem, setUserProblem] = useState('');
    const [successMetrics, setSuccessMetrics] = useState('');
    const [mlProblemStatement, setMlProblemStatement] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!businessGoal.trim() || !userProblem.trim() || !successMetrics.trim()) {
            setError('All fields are required to generate a statement.');
            return;
        }
        setError('');
        setIsLoading(true);
        setMlProblemStatement('');
        try {
            const result = await generateProblemStatement(businessGoal, userProblem, successMetrics);
            setMlProblemStatement(result);
        } catch (err) {
            setError('Failed to generate statement. Please check the console.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h2 className="text-2xl font-bold text-gray-900">Problem Framing Assistant</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <InfoCard title="Why Problem Framing?">
                        <p>Translating a business need into a clear machine learning problem is the most critical step in building a successful AI product. A well-framed problem aligns technical teams and business stakeholders, guiding development and ensuring the final model delivers real value.</p>
                    </InfoCard>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Define Your Problem</h3>
                        <InputField id="business-goal" label="Business Goal" value={businessGoal} onChange={e => setBusinessGoal(e.target.value)} placeholder="e.g., Reduce customer churn by 15% in the next quarter." />
                        <InputField id="user-problem" label="User Problem / Pain Point" value={userProblem} onChange={e => setUserProblem(e.target.value)} placeholder="e.g., Users are canceling subscriptions because they feel the service isn't personalized enough." />
                        <InputField id="success-metrics" label="Key Success Metrics" value={successMetrics} onChange={e => setSuccessMetrics(e.target.value)} placeholder="e.g., Increase in user engagement (daily active users), decrease in subscription cancellation rate." />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200 disabled:bg-gray-300">
                            {isLoading ? 'Generating...' : 'Generate ML Problem Statement'}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated ML Problem Statement</h3>
                    {isLoading ? (
                        <PulsingText text="Gemini is formulating the problem..." />
                    ) : mlProblemStatement ? (
                        <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-md">
                            <ReactMarkdown>{mlProblemStatement}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p>Your generated statement will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
