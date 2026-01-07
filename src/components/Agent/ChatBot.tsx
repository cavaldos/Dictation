import React, { useState, useRef, useEffect } from "react";
import { Mic, Send, Loader2 } from "lucide-react";
import type { Message, AIModel, AIProvider } from './box/types';
import { ChatHeader } from './box/ChatHeader';
import { ChatMessage } from './box/ChatMessage';
import { EmptyState } from './box/EmptyState';
import { ProviderSelector, ModelSelector } from './box/Selectors';

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

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date(),
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
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const history = messages.map(msg => ({
                role: msg.type as 'user' | 'assistant',
                content: msg.content,
            }));

            let streamedContent = '';

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

            const result = await window.electronAPI.chatWithAIStream(history, inputValue);

            if (window.electronAPI?.removeAIChatChunkListener) {
                window.electronAPI.removeAIChatChunkListener();
            }

            if (result.success) {
                const finalContent = result.data || streamedContent;
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: finalContent, isStreaming: false }
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

    const handleClearChat = () => {
        setMessages([]);
    };

    const handleRegenerate = async (messageId: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex <= 0) return;

        const previousUserMessage = messages[messageIndex - 1];
        if (previousUserMessage.type !== 'user') return;

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
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const history = newMessages.slice(0, -1).map(msg => ({
                role: msg.type as 'user' | 'assistant',
                content: msg.content,
            }));

            let streamedContent = '';

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

            const result = await window.electronAPI.chatWithAIStream(history, previousUserMessage.content);

            if (window.electronAPI?.removeAIChatChunkListener) {
                window.electronAPI.removeAIChatChunkListener();
            }

            if (result.success) {
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: result.data || streamedContent, isStreaming: false }
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

    return (
        <div className="w-full h-full flex flex-col bg-[rgb(32,32,32)]">
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
                            <ChatMessage
                                message={message}
                                currentModelName={getCurrentModelName()}
                                isLoading={isLoading}
                                onRegenerate={handleRegenerate}
                            />
                        </div>
                    ))
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-[rgb(56,56,56)] p-3 space-y-2 bg-[rgb(32,32,32)]">
                {/* Input field */}
                <div className="relative bg-[rgb(25,25,25)] rounded-lg border border-[rgb(56,56,56)] focus-within:border-gray-600 transition-colors">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-[rgb(240,240,240)] placeholder-[rgb(142,142,142)] resize-none focus:outline-none disabled:opacity-50"
                        rows={3}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
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
