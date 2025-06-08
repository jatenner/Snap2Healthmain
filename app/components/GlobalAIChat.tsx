'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './client/ClientAuthProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseStyle?: 'simple' | 'detailed' | 'balanced';
}

const GlobalAIChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentPageContext = () => {
    if (typeof window === 'undefined') return 'unknown';
    const pathname = window.location.pathname;
    
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/analysis/')) return 'meal_analysis';
    if (pathname === '/upload') return 'upload';
    if (pathname === '/meal-history') return 'meal_history';
    if (pathname === '/profile') return 'profile';
    
    switch (pathname) {
      case '/':
        return 'The user is on the home page, exploring Snap2Health\'s features and getting started.';
      case '/upload':
        return 'The user is on the upload page, ready to analyze a new meal by taking a photo or uploading an image.';
      case '/meal-history': 
        return 'The user is browsing their meal history, looking at past meals they have analyzed.';
      case '/profile':
        return 'The user is on their profile page, viewing or editing their personal health information and goals.';
      default:
        return `The user is on the ${pathname.replace('/', '')} page of Snap2Health.`;
    }
  };

  const getCurrentMealId = () => {
    if (typeof window === 'undefined') return null;
    const pathname = window.location.pathname;
    // Extract meal ID from /analysis/[mealId] route
    if (pathname.startsWith('/analysis/')) {
      const segments = pathname.split('/');
      return segments[2] || null; // [empty, 'analysis', mealId]
    }
    return null;
  };

  const sendMessage = async (content: string, forceStyle?: 'simple' | 'detailed') => {
    if (!content.trim() || !user?.id || isLoading) return;
    
    // Add style prefix if requested
    const messageContent = forceStyle ? 
      (forceStyle === 'simple' ? `Please give me a simple, brief answer: ${content}` : 
       forceStyle === 'detailed' ? `Please give me a detailed, comprehensive explanation: ${content}` : content) : content;
    
    console.log('[GlobalAIChat] Sending message with user:', user);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(), // Show original content in UI
      timestamp: new Date(),
      responseStyle: forceStyle
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      let convId = conversationId;
      if (!convId) {
        console.log('[GlobalAIChat] Creating new conversation...');
        const currentMealId = getCurrentMealId();
        const convPayload = {
          user_id: user.id,
          meal_id: currentMealId,
          title: currentMealId ? 'Meal Analysis Chat' : 'General Chat',
          context_data: {
            type: currentMealId ? 'meal_analysis' : 'general',
            page: getCurrentPageContext(),
            current_meal_id: currentMealId,
            timestamp: new Date().toISOString()
          }
        };
        console.log('[GlobalAIChat] Conversation payload:', convPayload);

        const convResponse = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(convPayload)
        });
        
        console.log('[GlobalAIChat] Conversation response status:', convResponse.status);
        
        if (convResponse.ok) {
          const convData = await convResponse.json();
          console.log('[GlobalAIChat] Conversation created:', convData);
          convId = convData.conversation.id;
          setConversationId(convId);
        } else {
          const errorText = await convResponse.text();
          console.error('[GlobalAIChat] Conversation API error:', convResponse.status, errorText);
          throw new Error(`Failed to create conversation: ${convResponse.status} ${errorText}`);
        }
      }

      console.log('[GlobalAIChat] Sending message to conversation:', convId);
      const currentMealId = getCurrentMealId();
      const messagePayload = {
        conversation_id: convId,
        user_id: user.id,
        content: messageContent, // Send modified content with style request
        meal_id: currentMealId,
        context_data: {
          page: getCurrentPageContext(),
          current_meal_id: currentMealId,
          timestamp: new Date().toISOString(),
          requested_style: forceStyle
        }
      };
      console.log('[GlobalAIChat] Message payload:', messagePayload);

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload)
      });

      console.log('[GlobalAIChat] Message response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[GlobalAIChat] Message response data:', data);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.assistantMessage?.content || data.response || 'Sorry, I could not process your message.',
          timestamp: new Date(),
          responseStyle: forceStyle
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Log learning insights if available
        if (data.learningInsights) {
          console.log('[GlobalAIChat] Learning insights captured:', data.learningInsights);
        }
      } else {
        const errorText = await response.text();
        console.error('[GlobalAIChat] Message API error:', response.status, errorText);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error (${response.status}). Please try again.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('[GlobalAIChat] Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'simple_summary':
        sendMessage('Can you give me a simple summary of this meal?', 'simple');
        break;
      case 'detailed_analysis':
        sendMessage('Can you give me a detailed analysis of this meal?', 'detailed');
        break;
      case 'nutrition_tips':
        sendMessage('What are the key nutrition tips for my goals?', 'simple');
        break;
      case 'improvement_suggestions':
        sendMessage('How can I improve this meal for better nutrition?', 'detailed');
        break;
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      const currentMealId = getCurrentMealId();
      const welcomeContent = currentMealId 
        ? `Hi! I'm your personalized AI nutrition coach. I can see you're analyzing a meal right now. 

**Quick options:**
• Simple summary of this meal
• Detailed nutritional analysis  
• How it fits your health goals
• Suggestions for improvement

I learn from our conversations to give you increasingly personalized advice. What would you like to know?

*Tip: Ask for "simple" or "detailed" responses anytime!*`
        : `Hi! I'm your AI nutrition coach. I learn about your preferences and goals to provide personalized guidance.

**I can help with:**
• Meal analysis and nutrition questions
• Understanding your eating patterns
• Tips for reaching your health goals
• Simple or detailed explanations

What would you like to know? 

*Tip: Say "simple answer" or "give me more detail" to control response length!*`;

      const welcomeMessage: Message = {
        id: '0',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  if (!user) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className="w-14 h-14 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
          title="Sign in to chat with AI"
        >
          💬
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className={`mb-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl transition-all duration-300 ${
          isMinimized 
            ? 'w-80 sm:w-96 h-16' 
            : 'w-[calc(100vw-2rem)] max-w-96 h-[70vh] sm:h-96 sm:w-80'
        }`}>
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl">🧠</span>
              <span className="text-white font-semibold text-sm sm:text-base">AI Nutrition Coach</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-200 transition-colors text-lg sm:text-base p-1"
              >
                {isMinimized ? '🔼' : '🔽'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors text-lg sm:text-base p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 p-3 sm:p-4 h-48 sm:h-64 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`mb-3 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] sm:max-w-[85%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && <span className="text-base sm:text-lg">🧠</span>}
                        <div className="flex-1">
                          <p className="text-sm sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          {message.responseStyle && (
                            <span className="text-xs opacity-70 mt-1 block">
                              {message.responseStyle === 'simple' ? '📝 Simple' : 
                               message.responseStyle === 'detailed' ? '📚 Detailed' : '⚖️ Balanced'}
                            </span>
                          )}
                        </div>
                        {message.role === 'user' && <span className="text-base sm:text-lg">👤</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-gray-700 text-gray-100 p-3 rounded-lg max-w-[90%] sm:max-w-[85%]">
                      <div className="flex items-center space-x-2">
                        <span className="text-base sm:text-lg">🧠</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Actions - Mobile Optimized */}
              {getCurrentMealId() && !isLoading && (
                <div className="px-3 sm:px-4 pb-2">
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="text-xs text-gray-400 hover:text-gray-300 transition-colors p-1"
                  >
                    {showQuickActions ? '▼ Hide quick actions' : '▲ Show quick actions'}
                  </button>
                  {showQuickActions && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleQuickAction('simple_summary')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs py-3 sm:py-2 px-3 rounded transition-colors touch-target"
                      >
                        📝 Simple Summary
                      </button>
                      <button
                        onClick={() => handleQuickAction('detailed_analysis')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-3 sm:py-2 px-3 rounded transition-colors touch-target"
                      >
                        📚 Detailed Analysis
                      </button>
                      <button
                        onClick={() => handleQuickAction('nutrition_tips')}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-3 sm:py-2 px-3 rounded transition-colors touch-target"
                      >
                        💡 Quick Tips
                      </button>
                      <button
                        onClick={() => handleQuickAction('improvement_suggestions')}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs py-3 sm:py-2 px-3 rounded transition-colors touch-target"
                      >
                        🚀 Improvements
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 sm:p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
                    placeholder="Ask about nutrition, meals, or health..."
                    className="flex-1 bg-gray-800 text-white p-3 sm:p-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm touch-target"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-600 text-white p-3 sm:p-2 rounded-lg transition-all duration-200 touch-target min-w-[44px]"
                  >
                    📤
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-400 text-center sm:text-left">
                  Try: "simple answer", "more detail", or "tell me more"
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={toggleChat}
        className={`w-14 h-14 sm:w-16 sm:h-16 ${
          isOpen 
            ? 'bg-purple-600 hover:bg-purple-700' 
            : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
        } text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 touch-target`}
      >
        <span className="text-xl sm:text-2xl">{isOpen ? '💬' : '🧠'}</span>
      </button>
    </div>
  );
};

export default GlobalAIChat; 