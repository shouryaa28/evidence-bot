import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Processing your request...', size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="loading-spinner">
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className={`animate-spin ${sizeClasses[size]} text-blue-600`} />
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
