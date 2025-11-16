
import React, { useState } from 'react';
import { LogAnalyzer } from './LogAnalyzer';
import { analyzeUserFeedback } from '../services/geminiService';
import { PulsingText } from './Spinner';
import type { UserFeedbackAnalysis, UserFeedbackTheme } from '../types';
import ReactMarkdown from 'react-markdown';

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        {children}
    </button>
);

const SentimentIndicator: React.FC<{ sentiment: 'Positive' | 'Neutral' | 'Negative' }> = ({ sentiment }) => {
    const sentimentInfo = {
        Positive: { text: 'Positive', icon: '😊', color: 'text-green-600', bg: 'bg-green-100' },
        Neutral: { text: 'Neutral', icon: '😐', color: 'text-gray-600', bg: 'bg-gray-100' },
        Negative: { text: 'Negative', icon: '😟', color: 'text-red-600', bg: 'bg-red-100' },
    };
    const { text, icon, color, bg } = sentimentInfo[sentiment];
    return (
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${bg} ${color}`}>
            <span>{icon}</span>
            <span>{text}</span>
        </div>
    );
};

const ThemeCard: React.FC<{ theme: UserFeedbackTheme }> = ({ theme }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-800">{theme.theme}</h4>
            <SentimentIndicator sentiment={theme.sentiment} />
        </div>
        <blockquote className="mt-2 pl-4 border-l-4 border-primary/50 text-gray-600 italic">
            "{theme.quote}"
        </blockquote>
    </div>
);

const UserFeedbackAnalyzer: React.FC = () => {
    const [feedbackText, setFeedbackText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<UserFeedbackAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!feedbackText.trim()) {
            setError('Feedback text cannot be empty.');
            return;
        }
        setError('');
        setIsLoading(true);
        setAnalysisResult(null);
        try {
            const result = await analyzeUserFeedback(feedbackText);
            setAnalysisResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">User Feedback Analysis</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">Paste raw user feedback (from surveys, support tickets, app reviews, etc.) to automatically extract themes, sentiment, and insights.</p>
                <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g., I love the new update, but it seems a bit slow on my phone. Could you add an option to export to PDF?"
                    className="w-full h-48 p-3 bg-gray-50 text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                />
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                <div className="mt-4">
                    <button onClick={handleAnalyze} disabled={isLoading || !feedbackText.trim()} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light disabled:bg-gray-300">
                        {isLoading ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                </div>
            </div>
            {(isLoading || analysisResult) && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                    {isLoading ? (
                        <div className="mt-4"><PulsingText text="Gemini is analyzing the feedback..." /></div>
                    ) : analysisResult ? (
                        <div className="mt-4 space-y-6">
                             <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Summary</h4>
                                <p className="text-gray-700">{analysisResult.summary}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Overall Sentiment</h4>
                                <SentimentIndicator sentiment={analysisResult.overallSentiment} />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Key Themes</h4>
                                <div className="space-y-3">
                                    {analysisResult.themes.map((theme, index) => (
                                        <ThemeCard key={index} theme={theme} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export const LaunchFeedbackView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'feedback' | 'monitoring'>('feedback');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Phase 10: Launch & Feedback</h2>

            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
                        <TabButton isActive={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')}>User Feedback Analysis</TabButton>
                        <TabButton isActive={activeTab === 'monitoring'} onClick={() => setActiveTab('monitoring')}>Technical Monitoring</TabButton>
                    </nav>
                </div>
                <div>
                    {activeTab === 'feedback' && <UserFeedbackAnalyzer />}
                    {activeTab === 'monitoring' && <LogAnalyzer />}
                </div>
            </div>
        </div>
    );
};
