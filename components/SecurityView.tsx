import React from 'react';
import { MOCK_SECURITY_FINDINGS } from '../constants';
import type { SecurityFinding } from '../types';

const SecurityFindingCard: React.FC<{finding: SecurityFinding}> = ({ finding }) => {
    const severityClasses = {
        critical: 'border-red-200 bg-red-50 text-red-700',
        high: 'border-orange-200 bg-orange-50 text-orange-700',
        medium: 'border-yellow-200 bg-yellow-50 text-yellow-700',
        low: 'border-blue-200 bg-blue-50 text-blue-700'
    };

    return (
        <div className={`p-4 rounded-lg border ${severityClasses[finding.severity]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-gray-900">{finding.type}</h4>
                    <span className="text-xs text-gray-500 capitalize">{finding.severity} Severity &middot; {finding.timestamp}</span>
                </div>
                <button className="text-xs text-primary hover:underline">Details</button>
            </div>
            <p className="text-sm text-gray-600 mt-2">{finding.details}</p>
        </div>
    );
}


export const SecurityView: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <h2 className="text-2xl font-bold text-gray-900">Security & Compliance</h2>
            <button
                className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200"
            >
                <span>Run New Scan</span>
            </button>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <h3 className="text-lg font-semibold text-gray-600">Overall Security Score</h3>
            <p className="text-6xl font-bold text-green-500 mt-4">98</p>
            <p className="text-sm text-gray-500 mt-2">Excellent</p>
        </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900">Recent Findings</h3>
            <div className="space-y-4 mt-4">
                {MOCK_SECURITY_FINDINGS.map(finding => (
                    <SecurityFindingCard key={finding.id} finding={finding} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};