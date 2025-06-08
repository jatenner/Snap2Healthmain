'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Brain, Sparkles, User, Bot, Clock } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  message_metadata?: any;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface AIChatProps {
  userId: string;
  mealId?: string;
  mealData?: any;
  className?: string;
}

export default function AIChat({ userId, mealId, mealData, className = '' }: AIChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    fetchConversations();
  }, [userId, mealId]);

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (mealId) params.append('meal_id', mealId);
      
      const response = await fetch(`/api/chat/conversations?${params}`);
      const data = await response.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0) {
          setCurrentConversation(data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const startNewConversation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          meal_id: mealId,
          title: mealData ? `Chat about ${mealData.meal_name}` : 'Nutrition Chat',
          context_data: { meal: mealData }
        })
      });

      const data = await response.json();
      if (data.conversation) {
        setCurrentConversation(data.conversation);
        setConversations(prev => [data.conversation, ...prev]);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentConversation || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: currentConversation.id,
          user_id: userId,
          content: userMessage,
          meal_id: mealId
        })
      });

      const data = await response.json();
      
      if (data.userMessage && data.assistantMessage) {
        setCurrentConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.userMessage, data.assistantMessage]
        } : null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    return (
      <div
        key={msg.id}
        className={`flex items-start space-x-3 mb-6 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Brain size={16} />}
        </div>
        
        <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
          
          <div className={`flex items-center mt-1 text-xs text-gray-400 space-x-2 ${
            isUser ? 'flex-row-reverse space-x-reverse' : ''
          }`}>
            <Clock size={12} />
            <span>{formatTime(msg.created_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!currentConversation) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="text-white" size={24} />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            AI Nutrition Coach
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {mealData 
              ? `Get personalized insights about your ${mealData.meal_name}. Ask questions about nutrition, health benefits, or how to improve your meals.`
              : 'Start a conversation with your AI nutrition coach. Get personalized advice, ask questions, and learn about your nutrition journey.'
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-1">
                <Sparkles size={16} className="text-blue-600" />
                <span className="font-medium text-blue-800">Personalized</span>
              </div>
              <p className="text-blue-700">Remembers your preferences and history</p>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200">
              <div className="flex items-center space-x-2 mb-1">
                <Brain size={16} className="text-emerald-600" />
                <span className="font-medium text-emerald-800">Smart</span>
              </div>
              <p className="text-emerald-700">Learns from every conversation</p>
            </div>
          </div>
          
          <button
            onClick={startNewConversation}
            disabled={isLoading}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 mx-auto"
          >
            <MessageCircle size={18} />
            <span>{isLoading ? 'Starting...' : 'Start Conversation'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <Brain className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Nutrition Coach</h3>
              <p className="text-sm text-gray-600">{currentConversation.title}</p>
            </div>
          </div>
          
          <button
            onClick={startNewConversation}
            className="text-emerald-600 hover:text-emerald-700 transition-colors"
            title="Start new conversation"
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {currentConversation.messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {mealData 
                ? `Hi! I'm here to help you understand your ${mealData.meal_name}. What would you like to know?`
                : "Hi! I'm your AI nutrition coach. Ask me anything about nutrition, meals, or healthy eating!"
              }
            </p>
          </div>
        ) : (
          currentConversation.messages.map(renderMessage)
        )}
        
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mealData 
                ? `Ask about ${mealData.meal_name}...`
                : "Ask me about nutrition, meal planning, or healthy eating..."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!message.trim() || isLoading}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI remembers your preferences and past conversations to provide personalized advice
        </p>
      </div>
    </div>
  );
} 