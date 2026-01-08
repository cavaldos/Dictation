import React, { useRef, useEffect } from 'react';
import { Cpu, ChevronDown, CheckCheck, Sparkles, Loader2, BookOpen, MessageSquare } from 'lucide-react';
import type { AIProvider, AIModel, ChatMode, ChatModeOption } from './types';
import { CHAT_MODES } from './types';

interface ProviderSelectorProps {
    providers: AIProvider[];
    currentProvider: string;
    showDropdown: boolean;
    onToggleDropdown: () => void;
    onProviderChange: (providerId: string) => void;
    getCurrentProviderName: () => string;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
    providers,
    currentProvider,
    showDropdown,
    onToggleDropdown,
    onProviderChange,
    getCurrentProviderName,
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (showDropdown) {
                    onToggleDropdown();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, onToggleDropdown]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggleDropdown}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] rounded transition-colors"
            >
                <Cpu size={12} className="text-green-400" />
                <span className="max-w-[80px] truncate">{getCurrentProviderName()}</span>
                <ChevronDown size={12} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-[rgb(40,40,40)] border border-[rgb(56,56,56)] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-[rgb(56,56,56)]">
                        <p className="text-xs text-[rgb(142,142,142)] font-medium">AI Provider</p>
                    </div>
                    {providers.map((provider) => (
                        <button
                            key={provider.id}
                            onClick={() => onProviderChange(provider.id)}
                            className={`w-full px-3 py-2 text-left hover:bg-[rgb(49,49,49)] transition-colors flex items-center justify-between ${currentProvider === provider.id ? 'bg-[rgb(49,49,49)]' : ''
                                }`}
                        >
                            <span className="text-sm text-[rgb(240,240,240)]">{provider.name}</span>
                            {currentProvider === provider.id && (
                                <CheckCheck size={14} className="text-green-400" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface ModelSelectorProps {
    models: AIModel[];
    selectedModel: string;
    isLoadingModels: boolean;
    showDropdown: boolean;
    providerName: string;
    onToggleDropdown: () => void;
    onModelChange: (modelId: string) => void;
    getCurrentModelName: () => string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    models,
    selectedModel,
    isLoadingModels,
    showDropdown,
    providerName,
    onToggleDropdown,
    onModelChange,
    getCurrentModelName,
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (showDropdown) {
                    onToggleDropdown();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, onToggleDropdown]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggleDropdown}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] rounded transition-colors"
            >
                <Sparkles size={12} className="text-blue-400" />
                <span className="max-w-[100px] truncate">
                    {isLoadingModels ? 'Loading...' : getCurrentModelName()}
                </span>
                <ChevronDown size={12} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-64 bg-[rgb(40,40,40)] border border-[rgb(56,56,56)] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-[rgb(56,56,56)]">
                        <p className="text-xs text-[rgb(142,142,142)] font-medium">
                            {providerName} Models
                        </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {isLoadingModels ? (
                            <div className="px-3 py-4 text-center">
                                <Loader2 size={16} className="animate-spin text-blue-400 mx-auto" />
                                <p className="text-xs text-[rgb(142,142,142)] mt-2">Loading models...</p>
                            </div>
                        ) : models.length === 0 ? (
                            <div className="px-3 py-4 text-center">
                                <p className="text-xs text-[rgb(142,142,142)]">No models available</p>
                            </div>
                        ) : (
                            models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => onModelChange(model.id)}
                                    className={`w-full px-3 py-2 text-left hover:bg-[rgb(49,49,49)] transition-colors flex items-center justify-between ${selectedModel === model.id ? 'bg-[rgb(49,49,49)]' : ''
                                        }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-[rgb(240,240,240)] truncate">{model.name}</p>
                                        <p className="text-xs text-[rgb(142,142,142)] truncate">{model.description}</p>
                                    </div>
                                    {selectedModel === model.id && (
                                        <CheckCheck size={14} className="text-blue-400 flex-shrink-0 ml-2" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Mode Selector Component
interface ModeSelectorProps {
    currentMode: ChatMode;
    showDropdown: boolean;
    onToggleDropdown: () => void;
    onModeChange: (mode: ChatMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
    currentMode,
    showDropdown,
    onToggleDropdown,
    onModeChange,
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (showDropdown) {
                    onToggleDropdown();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, onToggleDropdown]);

    const getCurrentMode = (): ChatModeOption => {
        return CHAT_MODES.find(m => m.id === currentMode) || CHAT_MODES[0];
    };

    const getModeIcon = (mode: ChatMode) => {
        switch (mode) {
            case 'dictionary':
                return <BookOpen size={12} className="text-purple-400" />;
            case 'chat':
            default:
                return <MessageSquare size={12} className="text-emerald-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggleDropdown}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] rounded transition-colors"
            >
                {getModeIcon(currentMode)}
                <span className="max-w-[80px] truncate">{getCurrentMode().name}</span>
                <ChevronDown size={12} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-56 bg-[rgb(40,40,40)] border border-[rgb(56,56,56)] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-[rgb(56,56,56)]">
                        <p className="text-xs text-[rgb(142,142,142)] font-medium">Chat Mode</p>
                    </div>
                    {CHAT_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => onModeChange(mode.id)}
                            className={`w-full px-3 py-2 text-left hover:bg-[rgb(49,49,49)] transition-colors flex items-center gap-3 ${currentMode === mode.id ? 'bg-[rgb(49,49,49)]' : ''}`}
                        >
                            <span className="text-base">{mode.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[rgb(240,240,240)]">{mode.name}</p>
                                <p className="text-xs text-[rgb(142,142,142)]">{mode.description}</p>
                            </div>
                            {currentMode === mode.id && (
                                <CheckCheck size={14} className="text-purple-400 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
