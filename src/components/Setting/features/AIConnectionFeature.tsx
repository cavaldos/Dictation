import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, Loader2, Zap, Plug } from 'lucide-react';

interface ApiKeyConfig {
    gemini: string;
    groq: string;
}

interface ApiKeyStatus {
    gemini: 'unconfigured' | 'env' | 'custom' | 'checking' | 'valid' | 'invalid';
    groq: 'unconfigured' | 'env' | 'custom' | 'checking' | 'valid' | 'invalid';
}

interface TestResult {
    gemini: 'idle' | 'checking' | 'success' | 'error';
    groq: 'idle' | 'checking' | 'success' | 'error';
}

const AIConnectionFeature: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKeyConfig>({ gemini: '', groq: '' });
    const [showKeys, setShowKeys] = useState<{ gemini: boolean; groq: boolean }>({ gemini: false, groq: false });
    const [status, setStatus] = useState<ApiKeyStatus>({ gemini: 'unconfigured', groq: 'unconfigured' });
    const [editMode, setEditMode] = useState<{ gemini: boolean; groq: boolean }>({ gemini: false, groq: false });
    const [tempKeys, setTempKeys] = useState<ApiKeyConfig>({ gemini: '', groq: '' });
    const [testResult, setTestResult] = useState<TestResult>({ gemini: 'idle', groq: 'idle' });
    const [errorMessage, setErrorMessage] = useState<{ gemini: string; groq: string }>({ gemini: '', groq: '' });

    useEffect(() => {
        loadApiKeyStatus();
    }, []);

    const loadApiKeyStatus = async () => {
        try {
            const result = await window.electronAPI.getApiKeyStatus();
            if (result.success && result.data) {
                setStatus({
                    gemini: result.data.gemini,
                    groq: result.data.groq
                });
                
                // Load saved custom keys for display (masked)
                const savedKeys = await window.electronAPI.getApiKeys();
                if (savedKeys.success && savedKeys.data) {
                    setApiKeys({
                        gemini: savedKeys.data.gemini || '',
                        groq: savedKeys.data.groq || ''
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load API key status:', error);
        }
    };

    // Check connection first, then save if successful
    const handleCheckAndSave = async (provider: 'gemini' | 'groq') => {
        const key = tempKeys[provider].trim();
        if (!key) return;

        setTestResult(prev => ({ ...prev, [provider]: 'checking' }));
        setErrorMessage(prev => ({ ...prev, [provider]: '' }));

        try {
            // First, test the key by temporarily setting it
            const testRes = await window.electronAPI.validateApiKey(provider, key);
            
            if (testRes.success) {
                // Key is valid, now save it
                setTestResult(prev => ({ ...prev, [provider]: 'success' }));
                
                const saveRes = await window.electronAPI.setApiKey(provider, key);
                if (saveRes.success) {
                    setApiKeys(prev => ({ ...prev, [provider]: key }));
                    setStatus(prev => ({ ...prev, [provider]: 'custom' }));
                    setEditMode(prev => ({ ...prev, [provider]: false }));
                    setTempKeys(prev => ({ ...prev, [provider]: '' }));
                    setTestResult(prev => ({ ...prev, [provider]: 'idle' }));
                }
            } else {
                setTestResult(prev => ({ ...prev, [provider]: 'error' }));
                setErrorMessage(prev => ({ ...prev, [provider]: testRes.error || 'Invalid API key' }));
            }
        } catch (error) {
            console.error(`Failed to validate ${provider} API key:`, error);
            setTestResult(prev => ({ ...prev, [provider]: 'error' }));
            setErrorMessage(prev => ({ ...prev, [provider]: (error as Error).message }));
        }
    };

    const handleRemoveKey = async (provider: 'gemini' | 'groq') => {
        try {
            const result = await window.electronAPI.removeApiKey(provider);
            if (result.success) {
                setApiKeys(prev => ({ ...prev, [provider]: '' }));
                await loadApiKeyStatus();
            }
        } catch (error) {
            console.error(`Failed to remove ${provider} API key:`, error);
        }
    };

    const handleTestConnection = async (provider: 'gemini' | 'groq') => {
        setStatus(prev => ({ ...prev, [provider]: 'checking' }));
        try {
            const result = await window.electronAPI.testApiKey(provider);
            setStatus(prev => ({ ...prev, [provider]: result.success ? 'valid' : 'invalid' }));
        } catch (error) {
            setStatus(prev => ({ ...prev, [provider]: 'invalid' }));
        }
    };

    const getStatusBadge = (providerStatus: string) => {
        switch (providerStatus) {
            case 'env':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                        <Key size={10} />
                        From .env
                    </span>
                );
            case 'custom':
            case 'valid':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                        <Check size={10} />
                        Connected
                    </span>
                );
            case 'checking':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                        <Loader2 size={10} className="animate-spin" />
                        Checking...
                    </span>
                );
            case 'invalid':
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                        <X size={10} />
                        Invalid
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded">
                        Not configured
                    </span>
                );
        }
    };

    const maskApiKey = (key: string) => {
        if (!key || key.length < 8) return '••••••••';
        return key.slice(0, 4) + '••••••••' + key.slice(-4);
    };

    const renderProviderCard = (
        provider: 'gemini' | 'groq',
        title: string,
        description: string,
        docsUrl: string
    ) => {
        const isEditing = editMode[provider];
        const currentStatus = status[provider];
        const hasKey = apiKeys[provider] || currentStatus === 'env';

        return (
            <div className="bg-[rgb(35,35,35)] border border-[rgb(56,56,56)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${provider === 'gemini' ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                            <Zap size={18} className={provider === 'gemini' ? 'text-blue-400' : 'text-orange-400'} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white">{title}</h3>
                            <p className="text-xs text-gray-500">{description}</p>
                        </div>
                    </div>
                    {getStatusBadge(currentStatus)}
                </div>

                {isEditing ? (
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type={showKeys[provider] ? 'text' : 'password'}
                                value={tempKeys[provider]}
                                onChange={(e) => {
                                    setTempKeys(prev => ({ ...prev, [provider]: e.target.value }));
                                    // Reset test result when typing
                                    setTestResult(prev => ({ ...prev, [provider]: 'idle' }));
                                    setErrorMessage(prev => ({ ...prev, [provider]: '' }));
                                }}
                                placeholder={`Enter ${title} API Key`}
                                className={`w-full bg-[rgb(28,28,28)] border rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
                                    testResult[provider] === 'error' 
                                        ? 'border-red-500' 
                                        : testResult[provider] === 'success'
                                            ? 'border-green-500'
                                            : 'border-[rgb(56,56,56)] focus:border-purple-500'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                            >
                                {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        
                        {/* Error message */}
                        {testResult[provider] === 'error' && errorMessage[provider] && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <X size={12} />
                                {errorMessage[provider]}
                            </p>
                        )}
                        
                        {/* Success message */}
                        {testResult[provider] === 'success' && (
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                <Check size={12} />
                                Connection successful! Saving...
                            </p>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleCheckAndSave(provider)}
                                disabled={!tempKeys[provider].trim() || testResult[provider] === 'checking'}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                {testResult[provider] === 'checking' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Plug size={12} />
                                )}
                                {testResult[provider] === 'checking' ? 'Checking...' : 'Check & Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setEditMode(prev => ({ ...prev, [provider]: false }));
                                    setTempKeys(prev => ({ ...prev, [provider]: '' }));
                                    setTestResult(prev => ({ ...prev, [provider]: 'idle' }));
                                    setErrorMessage(prev => ({ ...prev, [provider]: '' }));
                                }}
                                disabled={testResult[provider] === 'checking'}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[rgb(45,45,45)] hover:bg-[rgb(55,55,55)] text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X size={12} />
                                Cancel
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Get your API key from{' '}
                            <a
                                href={docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:underline"
                            >
                                {provider === 'gemini' ? 'Google AI Studio' : 'Groq Console'}
                            </a>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {hasKey && (
                            <div className="flex items-center gap-2 bg-[rgb(28,28,28)] rounded-lg px-3 py-2">
                                <Key size={14} className="text-gray-500" />
                                <span className="text-sm text-gray-400 font-mono">
                                    {currentStatus === 'env' ? '(from .env file)' : maskApiKey(apiKeys[provider])}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setEditMode(prev => ({ ...prev, [provider]: true }));
                                    setTempKeys(prev => ({ ...prev, [provider]: '' }));
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[rgb(45,45,45)] hover:bg-[rgb(55,55,55)] text-gray-300 rounded-lg transition-colors"
                            >
                                <Key size={12} />
                                {hasKey ? 'Change Key' : 'Add Key'}
                            </button>
                            {hasKey && currentStatus !== 'env' && (
                                <button
                                    onClick={() => handleRemoveKey(provider)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                >
                                    <X size={12} />
                                    Remove
                                </button>
                            )}
                            {hasKey && (
                                <button
                                    onClick={() => handleTestConnection(provider)}
                                    disabled={currentStatus === 'checking'}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {currentStatus === 'checking' ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Zap size={12} />
                                    )}
                                    Test
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">
                Configure your AI provider API keys. Keys stored here will be used if not found in the .env file.
            </p>

            {renderProviderCard(
                'gemini',
                'Google Gemini',
                'Powerful AI models from Google',
                'https://aistudio.google.com/app/apikey'
            )}

            {renderProviderCard(
                'groq',
                'Groq',
                'Fast inference with Llama and other models',
                'https://console.groq.com/keys'
            )}

            <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400">
                    <strong>Note:</strong> API keys stored here are saved locally on your device. 
                    For better security, consider using environment variables in a .env file.
                </p>
            </div>
        </div>
    );
};

export default AIConnectionFeature;
