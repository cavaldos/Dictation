import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
    providerName: string;
    modelName: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ providerName, modelName }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-blue-400" />
            </div>
            <h3 className="text-[rgb(240,240,240)] font-medium mb-2">Start a conversation</h3>
            <p className="text-sm text-[rgb(142,142,142)]">
                {providerName} - {modelName}
            </p>
        </div>
    );
};
