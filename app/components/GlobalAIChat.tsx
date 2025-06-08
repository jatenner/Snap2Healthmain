'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './client/ClientAuthProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseStyle?: 'simple' | 'detailed' | 'balanced';
  metadata?: {
    response_type?: string;
    insights_used?: string;
    historical_context?: string;
  };
}

// Enhanced quick action buttons with historical context
const enhancedQuickActions = [
  { 
    label: "📊 My Progress", 
    action: "Show me my nutrition patterns and progress over the last week" 
  },
  { 
    label: "🎯 Goal Check", 
    action: "How is this meal aligned with my goals?" 
  },
  { 
    label: "💡 Quick Tips", 
    action: "Give me 3 quick actionable tips based on my recent meals" 
  },
  { 
    label: "🔍 Compare", 
    action: "How does this meal compare to my usual intake?" 
  },
  { 
    label: "⚡ Simple", 
    action: "Keep it simple - just the key points" 
  },
  { 
    label: "📚 Detailed", 
    action: "Give me detailed analysis and explanation" 
  },
];

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
  // Enhanced state for historical context
  const [userInsights, setUserInsights] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(false);

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

  // Enhanced helper text with context awareness
  const getContextualHelperText = (): string => {
    if (getCurrentMealId()) {
      return "💬 Ask about this meal's nutrition, compare to your history, or get personalized tips!";
    }
    
    if (userInsights?.totalMeals > 0) {
      return `💬 I've analyzed ${userInsights.totalMeals} of your meals. Ask about patterns, goals, or get advice!`;
    }
    
    return "💬 Ask me about nutrition, your meals, or get personalized health advice!";
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user || isLoading) return;

    setIsLoading(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setShowQuickActions(false);

    try {
      // Enhanced context data
      const contextData = {
        page: getCurrentMealId() ? 'meal_analysis' : 'general',
        current_meal_id: getCurrentMealId(),
        timestamp: new Date().toISOString(),
        user_insights: userInsights,
        // Add request type detection
        request_type: detectRequestType(content)
      };

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_id: user.id,
          content: content.trim(),
          meal_id: getCurrentMealId(),
          context_data: contextData
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Chat API Response:', data);
      
      // Handle the response format correctly
      let assistantContent = 'Sorry, I encountered an error.';
      if (data.assistantMessage?.content) {
        assistantContent = data.assistantMessage.content;
      } else if (data.response) {
        assistantContent = data.response;
      } else if (data.message) {
        assistantContent = data.message;
      }
      
      const aiMessage: Message = {
        id: data.assistantMessage?.id || Date.now().toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        metadata: {
          response_type: data.assistantMessage?.message_metadata?.response_style || data.response_type,
          insights_used: data.insights_used,
          historical_context: data.historical_context
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Handle conversation ID from response
      if (data.userMessage?.conversation_id && !conversationId) {
        setConversationId(data.userMessage.conversation_id);
      } else if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Update user insights if provided
      if (data.updated_insights) {
        setUserInsights(data.updated_insights);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to detect request type for better processing
  const detectRequestType = (content: string): string => {
    const lower = content.toLowerCase();
    
    if (lower.includes('simple') || lower.includes('brief') || lower.includes('quick')) {
      return 'simple';
    }
    if (lower.includes('detail') || lower.includes('explain') || lower.includes('why')) {
      return 'detailed';
    }
    if (lower.includes('compare') || lower.includes('vs') || lower.includes('difference')) {
      return 'comparison';
    }
    if (lower.includes('pattern') || lower.includes('history') || lower.includes('progress')) {
      return 'historical';
    }
    if (lower.includes('goal') || lower.includes('should i') || lower.includes('recommend')) {
      return 'goal_related';
    }
    
    return 'general';
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
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
    <>
      {/* Enhanced chat button with context indicator */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 ${
            getCurrentMealId() ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
          } rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95`}
          aria-label="Open AI Chat"
        >
          <div className="w-full h-full flex items-center justify-center text-white relative">
            {isLoading ? (
              <div className="animate-spin">⚡</div>
            ) : (
              <>
                💬
                {/* Context indicator */}
                {getCurrentMealId() && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                    🍽️
                  </div>
                )}
                {userInsights?.totalMeals > 0 && !getCurrentMealId() && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center text-xs">
                    📊
                  </div>
                )}
              </>
            )}
          </div>
        </button>
      </div>

      {/* Enhanced chat panel */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 bg-white rounded-lg shadow-2xl border z-50 transition-all duration-300 ${
          typeof window !== 'undefined' && window.innerWidth < 640 
            ? 'w-[calc(100vw-2rem)] h-[70vh]' 
            : 'w-80 h-96'
        }`}>
          {/* Enhanced header with context info */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <div>
              <h3 className="font-semibold">AI Nutrition Coach</h3>
              {userInsights?.totalMeals > 0 && (
                <p className="text-xs opacity-90">
                  📊 {userInsights.totalMeals} meals analyzed
                </p>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Enhanced quick actions with context */}
          <div className="px-4 py-2 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-1 text-xs">
              {enhancedQuickActions.slice(0, 4).map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  disabled={isLoading}
                  className="px-2 py-1 bg-white border rounded text-gray-600 hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {action.label}
                </button>
              ))}
            </div>
            
            {/* Response style toggles */}
            <div className="flex gap-1 mt-2">
              {enhancedQuickActions.slice(4, 6).map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  disabled={isLoading}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-48">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm space-y-2">
                <div className="text-lg">🤖</div>
                <p>{getContextualHelperText()}</p>
                {getCurrentMealId() && (
                  <p className="text-xs bg-green-100 text-green-700 rounded p-2">
                    🍽️ Analyzing current meal - ask specific questions!
                  </p>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                    {/* Enhanced metadata display */}
                    {message.metadata && message.role !== 'user' && (
                      <div className="text-xs opacity-70 mt-1">
                        {message.metadata.response_type && (
                          <span className="inline-block mr-2">
                            📝 {message.metadata.response_type}
                          </span>
                        )}
                        {message.metadata.insights_used && (
                          <span className="inline-block">
                            💡 insights used
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm animate-pulse">
                  Thinking... 🤔
                </div>
              </div>
            )}
          </div>

          {/* Enhanced input area */}
          <div className="p-3 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                placeholder="Ask about nutrition, goals, or patterns..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalAIChat; 