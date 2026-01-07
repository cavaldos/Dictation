export interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    model?: string;
}

export interface AIModel {
    id: string;
    name: string;
    description: string;
}

export interface AIProvider {
    id: string;
    name: string;
    currentModel: string;
}
