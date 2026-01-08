import React, { useState, useRef, useEffect } from "react";
import { Mic, Send, Loader2 } from "lucide-react";
import type { Message, AIModel, AIProvider, ChatMode, DictionaryResponse } from './box/types';
import { CHAT_MODES } from './box/types';
import { ChatHeader } from './box/ChatHeader';
import { ChatMessage } from './box/ChatMessage';
import { EmptyState } from './box/EmptyState';
import { ProviderSelector, ModelSelector, ModeSelector } from './box/Selectors';
import DictionaryTable from './box/DictionaryTable';

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Provider state
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [currentProvider, setCurrentProvider] = useState<string>('');
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);

    // Model state
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Mode state
    const [currentMode, setCurrentMode] = useState<ChatMode>('chat');
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load providers on mount
    useEffect(() => {
        const loadProviders = async () => {
            try {
                const result = await window.electronAPI.getAIProviders();
                if (result.success && result.data) {
                    setProviders(result.data.providers);
                    setCurrentProvider(result.data.currentProvider);

                    const activeProvider = result.data.providers.find(
                        p => p.id === result.data!.currentProvider
                    );
                    if (activeProvider) {
                        setSelectedModel(activeProvider.currentModel);
                    }
                }
            } catch (error) {
                console.error('Failed to load providers:', error);
            }
        };
        loadProviders();
    }, []);

    // Fetch models when provider changes
    useEffect(() => {
        if (currentProvider) {
            const fetchModels = async (providerId: string) => {
                setIsLoadingModels(true);
                try {
                    const result = await window.electronAPI.fetchAIModels(providerId);
                    if (result.success && result.data) {
                        setModels(result.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch models:', error);
                } finally {
                    setIsLoadingModels(false);
                }
            };

            fetchModels(currentProvider);
        }
    }, [currentProvider]);

    // Cleanup streaming listener on unmount
    useEffect(() => {
        return () => {
            window.electronAPI?.removeAIChatChunkListener?.();
        };
    }, []);

    const getCurrentProviderName = () => {
        const provider = providers.find(p => p.id === currentProvider);
        return provider?.name || 'Select Provider';
    };

    const getCurrentModelName = () => {
        const model = models.find(m => m.id === selectedModel);
        return model?.name || selectedModel || 'Select Model';
    };

    const getSystemPrompt = (): string | undefined => {
        const mode = CHAT_MODES.find(m => m.id === currentMode);
        return mode?.systemPrompt;
    };

    const handleProviderChange = async (providerId: string) => {
        try {
            const result = await window.electronAPI.setAIProvider(providerId);
            if (result.success) {
                setCurrentProvider(providerId);
                const provider = providers.find(p => p.id === providerId);
                if (provider) {
                    setSelectedModel(provider.currentModel);
                }
            }
        } catch (error) {
            console.error('Failed to set provider:', error);
        }
        setShowProviderDropdown(false);
    };

    const handleModelChange = async (modelId: string) => {
        try {
            const result = await window.electronAPI.setAIModel(currentProvider, modelId);
            if (result.success) {
                setSelectedModel(modelId);
                setProviders(prev => prev.map(p =>
                    p.id === currentProvider
                        ? { ...p, currentModel: modelId }
                        : p
                ));
            }
        } catch (error) {
            console.error('Failed to set model:', error);
        }
        setShowModelDropdown(false);
    };

    const handleModeChange = (mode: ChatMode) => {
        setCurrentMode(mode);
        setShowModeDropdown(false);
        setShowCommandPalette(false);
    };

    const parseDictionaryResponse = (content: string): DictionaryResponse | null => {
        try {
            // Try to extract JSON from the response
            let jsonStr = content.trim();
            
            // Remove markdown code blocks if present
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.slice(7);
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.slice(3);
            }
            if (jsonStr.endsWith('```')) {
                jsonStr = jsonStr.slice(0, -3);
            }
            jsonStr = jsonStr.trim();
            
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed.words && Array.isArray(parsed.words)) {
                return parsed as DictionaryResponse;
            }
        } catch (e) {
            console.error('Failed to parse dictionary response:', e);
        }
        return null;
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        // Check for "/" commands
        if (inputValue.startsWith('/')) {
            const command = inputValue.slice(1).toLowerCase().trim();
            if (command === 'dict' || command === 'dictionary') {
                setCurrentMode('dictionary');
                setInputValue('');
                return;
            } else if (command === 'chat') {
                setCurrentMode('chat');
                setInputValue('');
                return;
            }
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date(),
            mode: currentMode,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            type: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
            model: getCurrentModelName(),
            mode: currentMode,
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const history = messages
                .filter(msg => msg.mode === currentMode || !msg.mode)
                .map(msg => ({
                    role: msg.type as 'user' | 'assistant',
                    content: msg.content,
                }));

            let streamedContent = '';
            const systemPrompt = getSystemPrompt();

            if (window.electronAPI?.onAIChatChunk) {
                window.electronAPI.onAIChatChunk((chunk: string) => {
                    streamedContent += chunk;
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: streamedContent }
                            : msg
                    ));
                });
            }

            const result = await window.electronAPI.chatWithAIStream(history, inputValue, systemPrompt);

            if (window.electronAPI?.removeAIChatChunkListener) {
                window.electronAPI.removeAIChatChunkListener();
            }

            if (result.success) {
                const finalContent = result.data || streamedContent;
                
                // Parse dictionary response if in dictionary mode
                let dictionaryData: DictionaryResponse | undefined;
                if (currentMode === 'dictionary') {
                    const parsed = parseDictionaryResponse(finalContent);
                    if (parsed) {
                        dictionaryData = parsed;
                    }
                }
                
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: finalContent, isStreaming: false, dictionaryData }
                        : msg
                ));
            } else {
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: `Error: ${result.error}`, isStreaming: false }
                        : msg
                ));
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: `Error: ${(error as Error).message}`, isStreaming: false }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputValue(value);
        
        // Show command palette when typing "/"
        if (value === '/') {
            setShowCommandPalette(true);
        } else if (!value.startsWith('/')) {
            setShowCommandPalette(false);
        }
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    const handleRegenerate = async (messageId: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex <= 0) return;

        const previousUserMessage = messages[messageIndex - 1];
        if (previousUserMessage.type !== 'user') return;

        const messageMode = messages[messageIndex].mode || 'chat';
        const newMessages = messages.slice(0, messageIndex);
        setMessages(newMessages);
        setIsLoading(true);

        const assistantMessageId = Date.now().toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            type: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
            model: getCurrentModelName(),
            mode: messageMode,
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const history = newMessages.slice(0, -1).map(msg => ({
                role: msg.type as 'user' | 'assistant',
                content: msg.content,
            }));

            let streamedContent = '';
            const modeConfig = CHAT_MODES.find(m => m.id === messageMode);
            const systemPrompt = modeConfig?.systemPrompt;

            if (window.electronAPI?.onAIChatChunk) {
                window.electronAPI.onAIChatChunk((chunk: string) => {
                    streamedContent += chunk;
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: streamedContent }
                            : msg
                    ));
                });
            }

            const result = await window.electronAPI.chatWithAIStream(history, previousUserMessage.content, systemPrompt);

            if (window.electronAPI?.removeAIChatChunkListener) {
                window.electronAPI.removeAIChatChunkListener();
            }

            if (result.success) {
                const finalContent = result.data || streamedContent;
                
                let dictionaryData: DictionaryResponse | undefined;
                if (messageMode === 'dictionary') {
                    const parsed = parseDictionaryResponse(finalContent);
                    if (parsed) {
                        dictionaryData = parsed;
                    }
                }
                
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: finalContent, isStreaming: false, dictionaryData }
                        : msg
                ));
            } else {
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: `Error: ${result.error}`, isStreaming: false }
                        : msg
                ));
            }
        } catch (error) {
            console.error('Regenerate error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const word = e.dataTransfer.getData('text/plain');
        if (word) {
            const newText = inputValue ? `${inputValue} ${word}` : word;
            setInputValue(newText);
            textareaRef.current?.focus();
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleSaveWordToNotes = (word: string) => {
        console.log('Saved word to notes:', word);
    };

    return (
        <div className="w-full h-full flex flex-col bg-[rgb(32,32,32)] border border-[rgb(56,56,56)] rounded-lg">
            {/* Header */}
            <ChatHeader
                messages={messages}
                onClearChat={handleClearChat}
            />

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[rgb(25,25,25)]">
                {messages.length === 0 ? (
                    <EmptyState
                        providerName={getCurrentProviderName()}
                        modelName={getCurrentModelName()}
                    />
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className="space-y-2">
                            {message.type === 'assistant' && message.mode === 'dictionary' && message.dictionaryData ? (
                                <div className="ml-8">
                                    <DictionaryTable 
                                        data={message.dictionaryData} 
                                        onSaveToNotes={handleSaveWordToNotes}
                                    />
                                </div>
                            ) : (
                                <ChatMessage
                                    message={message}
                                    currentModelName={getCurrentModelName()}
                                    isLoading={isLoading}
                                    onRegenerate={handleRegenerate}
                                />
                            )}
                        </div>
                    ))
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-[rgb(56,56,56)] rounded-b-md p-3 space-y-2 bg-[rgb(32,32,32)]">
                {/* Command Palette */}
                {showCommandPalette && (
                    <div className="absolute bottom-24 left-4 w-64 bg-[rgb(40,40,40)] border border-[rgb(56,56,56)] rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-[rgb(56,56,56)]">
                            <p className="text-xs text-[rgb(142,142,142)] font-medium">Commands</p>
                        </div>
                        <button
                            onClick={() => {
                                setCurrentMode('dictionary');
                                setInputValue('');
                                setShowCommandPalette(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[rgb(49,49,49)] transition-colors flex items-center gap-3"
                        >
                            <span className="text-base">📖</span>
                            <div>
                                <p className="text-sm text-[rgb(240,240,240)]">/dict</p>
                                <p className="text-xs text-[rgb(142,142,142)]">Switch to Dictionary mode</p>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setCurrentMode('chat');
                                setInputValue('');
                                setShowCommandPalette(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[rgb(49,49,49)] transition-colors flex items-center gap-3"
                        >
                            <span className="text-base">💬</span>
                            <div>
                                <p className="text-sm text-[rgb(240,240,240)]">/chat</p>
                                <p className="text-xs text-[rgb(142,142,142)]">Switch to Chat mode</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Mode indicator */}
                {currentMode === 'dictionary' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md">
                        <span className="text-sm">📖</span>
                        <span className="text-xs text-purple-400">Dictionary Mode - Enter words to look up</span>
                    </div>
                )}

                {/* Input field */}
                <div 
                    className="relative bg-[rgb(25,25,25)] rounded-lg border border-[rgb(56,56,56)] focus-within:border-gray-600 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={currentMode === 'dictionary' ? "Enter words to look up (e.g., happy, sad, run)..." : "Ask me anything... (type / for commands)"}
                        disabled={isLoading}
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-[rgb(240,240,240)] placeholder-[rgb(142,142,142)] resize-none focus:outline-none disabled:opacity-50"
                        rows={3}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <ModeSelector
                            currentMode={currentMode}
                            showDropdown={showModeDropdown}
                            onToggleDropdown={() => setShowModeDropdown(!showModeDropdown)}
                            onModeChange={handleModeChange}
                        />

                        <ProviderSelector
                            providers={providers}
                            currentProvider={currentProvider}
                            showDropdown={showProviderDropdown}
                            onToggleDropdown={() => setShowProviderDropdown(!showProviderDropdown)}
                            onProviderChange={handleProviderChange}
                            getCurrentProviderName={getCurrentProviderName}
                        />

                        <ModelSelector
                            models={models}
                            selectedModel={selectedModel}
                            isLoadingModels={isLoadingModels}
                            showDropdown={showModelDropdown}
                            providerName={getCurrentProviderName()}
                            onToggleDropdown={() => setShowModelDropdown(!showModelDropdown)}
                            onModelChange={handleModelChange}
                            getCurrentModelName={getCurrentModelName}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors">
                            <Mic size={16} className="text-[rgb(142,142,142)]" />
                        </button>
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className="p-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:opacity-50 rounded transition-colors flex items-center justify-center"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="text-white animate-spin" />
                            ) : (
                                <Send size={16} className="text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatBot;
