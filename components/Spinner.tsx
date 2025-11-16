
import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export const PulsingText: React.FC<{text: string}> = ({ text }) => {
  return (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse-fast"></div>
        <p className="text-gray-300">{text}</p>
    </div>
  );
};
