

import React, { useState } from 'react';
import type { DatasetInfo } from '../types';
import { NewDatasetModal } from './NewDatasetModal';
import { DatasetDetailModal } from './DatasetDetailModal';

const StatusBadge: React.FC<{ status: DatasetInfo['status'] }> = ({ status }) => {
    const statusClasses = {
        available: 'bg-green-100 text-green-800',
        processing: 'bg-blue-100 text-blue-800',
        error: 'bg-red-100 text-red-800',
    };
    const statusDotClasses = {
        available: 'bg-green-500',
        processing: 'bg-blue-500 animate-pulse',
        error: 'bg-red-500',
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${statusDotClasses[status]}`}></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

interface DataHubViewProps {
    datasets: DatasetInfo[];
    onSaveDataset: (dataset: DatasetInfo) => void;
}

export const DataHubView: React.FC<DataHubViewProps> = ({ datasets, onSaveDataset }) => {
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<DatasetInfo | null>(null);

    const handleViewDetails = (dataset: DatasetInfo) => {
        setSelectedDataset(dataset);
        setIsDetailModalOpen(true);
    };
    
    const handleSave = (dataset: DatasetInfo) => {
        onSaveDataset(dataset);
        setIsNewModalOpen(false);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Data Hub</h2>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition duration-200"
                    >
                        <span>Define New Dataset</span>
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Datasets</h3>
                    <p className="text-sm text-gray-500 mb-6">Manage datasets for model training, evaluation, and fine-tuning.</p>
                    
                    {datasets.length === 0 ? (
                        <div className="text-center py-12">
                            <h4 className="text-lg font-medium text-gray-600">No Datasets Defined</h4>
                            <p className="text-sm text-gray-500 mt-1">Define a new dataset to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Count</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {datasets.map((dataset) => (
                                        <tr key={dataset.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataset.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dataset.source}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"><StatusBadge status={dataset.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dataset.recordCount.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dataset.createdAt}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleViewDetails(dataset)} className="text-primary hover:text-primary-light transition-colors">Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <NewDatasetModal 
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSave={handleSave}
            />
            <DatasetDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                dataset={selectedDataset}
            />
        </>
    );
};
