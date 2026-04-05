'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/client/ClientAuthProvider';
import { ArrowLeft, Send, Loader2, Sparkles, MessageCircle, Activity, Utensils, TrendingUp } from 'lucide-react';
import AuthGate from '../components/AuthGate';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contextCaptured?: string[];
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: 'Why am I tired?', prompt: "Why have I been feeling tired lately? Look at my recent data.", icon: Activity },
  { label: 'What should I eat?', prompt: "Based on my data and goals, what should I eat today?", icon: Utensils },
  { label: 'How does alcohol affect me?', prompt: "Do I react badly to alcohol? What does my data show?", icon: TrendingUp },
  { label: 'Sleep tips', prompt: "What can I change about my diet to improve my sleep?", icon: Sparkles },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          conversation_id: conversationId,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      // Handle SSE streaming
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let capturedContext: string[] = [];
      const assistantId = `assistant-${Date.now()}`;

      // Add empty assistant message for streaming
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  done = true;
                  break;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantContent += parsed.content;
                    setMessages(prev =>
                      prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
                    );
                  }
                  if (parsed.contextCaptured) {
                    capturedContext = parsed.contextCaptured;
                  }
                  if (parsed.conversation_id) {
                    setConversationId(parsed.conversation_id);
                  }
                } catch {}
              }
            }
          }
        }
      }

      // Update final message with context captured info
      if (capturedContext.length > 0) {
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, contextCaptured: capturedContext } : m)
        );
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-14 z-10">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Health Assistant
            </h1>
            <p className="text-xs text-gray-400">Powered by your real health data</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="pt-8 space-y-6">
              <div className="text-center">
                <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Ask me anything</h2>
                <p className="text-sm text-gray-500">I know your meals, WHOOP data, correlations, and patterns.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-sm font-medium text-gray-900">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.contextCaptured && msg.contextCaptured.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Logged: {msg.contextCaptured.map(c => c.replace(':', ' ')).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
          <div className="max-w-lg mx-auto flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your health data..."
              rows={1}
              className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
