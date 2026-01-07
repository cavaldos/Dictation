import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, CheckCheck } from 'lucide-react';

// Code block component with copy button
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-3">
            <div className="flex items-center justify-between bg-[rgb(40,40,40)] px-3 py-1.5 rounded-t-lg border-b border-[rgb(56,56,56)]">
                <span className="text-xs text-[rgb(142,142,142)]">{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-[rgb(142,142,142)] hover:text-[rgb(240,240,240)] transition-colors"
                >
                    {copied ? (
                        <>
                            <CheckCheck size={12} className="text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    borderRadius: '0 0 8px 8px',
                    padding: '12px',
                    fontSize: '13px',
                    backgroundColor: 'rgb(30, 30, 30)',
                }}
                wrapLongLines={true}
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
};

// Inline code component
const InlineCode = ({ children }: { children: React.ReactNode }) => (
    <code className="bg-[rgb(45,45,45)] text-[#e06c75] px-1.5 py-0.5 rounded text-[13px] font-mono">
        {children}
    </code>
);

// Markdown renderer component
export const MarkdownContent = ({ content }: { content: string }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;
                    
                    if (isInline) {
                        return <InlineCode>{children}</InlineCode>;
                    }
                    
                    return (
                        <CodeBlock language={match ? match[1] : ''}>
                            {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                    );
                },
                p({ children }) {
                    return <p className="mb-3 last:mb-0">{children}</p>;
                },
                h1({ children }) {
                    return <h1 className="text-xl font-bold mb-3 mt-4 text-[rgb(240,240,240)]">{children}</h1>;
                },
                h2({ children }) {
                    return <h2 className="text-lg font-bold mb-2 mt-3 text-[rgb(240,240,240)]">{children}</h2>;
                },
                h3({ children }) {
                    return <h3 className="text-base font-bold mb-2 mt-3 text-[rgb(240,240,240)]">{children}</h3>;
                },
                ul({ children }) {
                    return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                    return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
                },
                li({ children }) {
                    return <li className="text-[rgb(220,220,220)]">{children}</li>;
                },
                blockquote({ children }) {
                    return (
                        <blockquote className="border-l-4 border-blue-500 pl-4 my-3 text-[rgb(180,180,180)] italic">
                            {children}
                        </blockquote>
                    );
                },
                a({ href, children }) {
                    return (
                        <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
                            {children}
                        </a>
                    );
                },
                table({ children }) {
                    return (
                        <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-[rgb(56,56,56)] rounded-lg overflow-hidden">
                                {children}
                            </table>
                        </div>
                    );
                },
                thead({ children }) {
                    return <thead className="bg-[rgb(40,40,40)]">{children}</thead>;
                },
                th({ children }) {
                    return <th className="px-3 py-2 text-left text-xs font-medium text-[rgb(180,180,180)] border-b border-[rgb(56,56,56)]">{children}</th>;
                },
                td({ children }) {
                    return <td className="px-3 py-2 text-sm text-[rgb(220,220,220)] border-b border-[rgb(56,56,56)]">{children}</td>;
                },
                hr() {
                    return <hr className="my-4 border-[rgb(56,56,56)]" />;
                },
                strong({ children }) {
                    return <strong className="font-bold text-[rgb(250,250,250)]">{children}</strong>;
                },
                em({ children }) {
                    return <em className="italic text-[rgb(220,220,220)]">{children}</em>;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
