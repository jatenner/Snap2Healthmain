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

interface PageContext {
  type: 'upload' | 'analysis' | 'history' | 'profile' | 'home' | 'meal_analysis' | 'meal_history';
  data?: any;
  nutrients?: any[];
  mealName?: string;
  currentPage?: string;
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
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [userInsights, setUserInsights] = useState<any>(null);
  const [showWelcomePulse, setShowWelcomePulse] = useState(true);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contextLoading, setContextLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to hide welcome pulse after 10 seconds or when chat is opened
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomePulse(false);
    }, 10000);

    if (isOpen) {
      setShowWelcomePulse(false);
    }

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Effect to generate contextual suggestions based on current page
  useEffect(() => {
    const generateContextualSuggestions = () => {
      const context = getPageContext();
      let suggestions: string[] = [];

      switch (context.type) {
        case 'upload':
          suggestions = [
            "What should I know about this meal?",
            "How does this fit my goals?",
            "Any nutrition tips for this food?"
          ];
          break;
        case 'analysis':
        case 'meal_analysis':
          suggestions = [
            "Explain this nutrition analysis",
            "How can I improve this meal?",
            "What are the health benefits?"
          ];
          break;
        case 'history':
        case 'meal_history':
          suggestions = [
            "Show my nutrition trends",
            "Which meals were healthiest?",
            "What should I eat next?"
          ];
          break;
        case 'profile':
          suggestions = [
            "Help optimize my nutrition goals",
            "What changes should I make?",
            "Am I on the right track?"
          ];
          break;
        default:
          suggestions = [
            "How can I improve my nutrition?",
            "What should I eat today?",
            "Analyze my recent meals"
          ];
      }

      setContextualSuggestions(suggestions);
    };

    generateContextualSuggestions();
    
    // Re-generate suggestions when the page context changes
    const interval = setInterval(generateContextualSuggestions, 3000);
    return () => clearInterval(interval);
  }, []);

  // Effect to add auto-greeting when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      const context = getPageContext();
      let greetingMessage = "👋 Hi there! I'm your AI nutrition coach. ";
      
      switch (context.type) {
        case 'upload':
          greetingMessage += "I see you're about to upload a meal! Once you take or upload a photo, I can analyze its nutrition, suggest improvements, and explain how it fits your goals.";
          break;
        case 'analysis':
        case 'meal_analysis':
          greetingMessage += `I can see you're viewing a nutrition analysis${context.mealName ? ` for "${context.mealName}"` : ''}. Ask me about the nutrients, health benefits, or how to optimize this meal!`;
          break;
        case 'history':
        case 'meal_history':
          greetingMessage += "Looking at your meal history? I can help you spot patterns, identify your healthiest meals, or suggest what to eat next based on your trends.";
          break;
        case 'profile':
          greetingMessage += "Great to see you checking your profile! I can help you optimize your nutrition goals, adjust your targets, or explain how to reach your health objectives.";
          break;
        default:
          greetingMessage += "I'm here to help with all your nutrition questions! Upload a meal photo, review your history, or ask about nutrition strategies.";
      }
      
      // Add quick suggestions
      if (contextualSuggestions.length > 0) {
        greetingMessage += `\n\n💡 Try asking:\n${contextualSuggestions.slice(0, 3).map(s => `• ${s}`).join('\n')}`;
      }
      
      // Auto-add greeting message
      const autoGreeting: Message = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: greetingMessage,
        timestamp: new Date(),
        metadata: {
          response_type: 'auto_greeting',
        }
      };
      
      setMessages([autoGreeting]);
    }
  }, [isOpen, user, contextualSuggestions]);

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
    const context = getPageContext();
    
    if (context.type === 'analysis' && context.nutrients && context.nutrients.length > 0) {
      return "💬 Ask about this meal's nutrition, compare to your history, or get personalized tips!";
    }
    
    if (userInsights && typeof userInsights === 'object' && userInsights.totalMeals && userInsights.totalMeals > 0) {
      return `💬 I've analyzed ${userInsights.totalMeals} of your meals. Ask about patterns, goals, or get advice!`;
    }
    
    return "💬 Ask me about nutrition, your meals, or get personalized health advice!";
  };

  // Enhanced function to extract visible nutrition data from the page
  const extractVisibleNutrients = () => {
    try {
      // Look for nutrient displays with data attributes first
      const nutrientElements = document.querySelectorAll('[data-nutrient]');
      const nutrients: any[] = [];
      
      nutrientElements.forEach(el => {
        const nutrientName = el.getAttribute('data-nutrient');
        const amount = el.getAttribute('data-nutrient-amount');
        const unit = el.getAttribute('data-nutrient-unit');
        const dv = el.getAttribute('data-nutrient-dv');
        const type = el.getAttribute('data-nutrient-type');
        
        if (nutrientName) {
          nutrients.push({
            name: nutrientName,
            amount: amount,
            unit: unit,
            dailyValue: dv,
            type: type,
            visible: true
          });
        }
      });
      
      // If no data attributes found, try to extract from text content
      if (nutrients.length === 0) {
        const textElements = document.querySelectorAll('h4, h5, .nutrient-name, [class*="nutrient"], [class*="macro"]');
        textElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length < 50 && (
            text.toLowerCase().includes('protein') ||
            text.toLowerCase().includes('carb') ||
            text.toLowerCase().includes('fat') ||
            text.toLowerCase().includes('vitamin') ||
            text.toLowerCase().includes('mineral') ||
            text.toLowerCase().includes('calcium') ||
            text.toLowerCase().includes('iron') ||
            text.toLowerCase().includes('fiber')
          )) {
            nutrients.push({
              name: text,
              visible: true,
              extracted: true
            });
          }
        });
      }
      
      // Look for calorie information
      const calorieElements = document.querySelectorAll('[class*="calorie"], [class*="energy"]');
      calorieElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.includes('calor')) {
          nutrients.push({
            name: 'Calories',
            amount: text.match(/\d+/)?.[0],
            unit: 'cal',
            visible: true,
            type: 'energy'
          });
        }
      });
      
      return nutrients.slice(0, 15); // Return up to 15 nutrients for context
    } catch (error) {
      console.warn('Error extracting nutrients:', error);
      return [];
    }
  };

  // Enhanced page context detection
  const getPageContext = (): PageContext => {
    if (typeof window === 'undefined') return { type: 'home' };
    
    const pathname = window.location.pathname;
    const visibleNutrients = extractVisibleNutrients();
    
    if (pathname.includes('/upload')) {
      return { 
        type: 'upload',
        currentPage: 'Upload Page - Ready to analyze meal photos',
        data: {
          canSeeUploadForm: document.querySelector('input[type="file"]') !== null,
          hasImage: document.querySelector('img[src*="blob:"]') !== null
        }
      };
    }
    
    if (pathname.includes('/analysis')) {
      const mealId = pathname.split('/').pop();
      const mealTitle = document.querySelector('h1, h2, [class*="meal-name"], [class*="title"]')?.textContent?.trim();
      
      return { 
        type: 'analysis',
        currentPage: `Meal Analysis Page - Viewing "${mealTitle || 'your meal'}" nutrition breakdown`,
        data: { 
          mealId,
          mealTitle,
          hasNutrientData: visibleNutrients.length > 0,
          activeTab: document.querySelector('.border-b-4')?.textContent?.trim() || 'nutrients'
        },
        nutrients: visibleNutrients,
        mealName: mealTitle
      };
    }
    
    if (pathname.includes('/meal-history')) {
      const mealCards = document.querySelectorAll('[class*="meal"], [class*="card"]').length;
      return { 
        type: 'history',
        currentPage: `Meal History - Browsing ${mealCards} past meal analyses`,
        data: {
          totalMeals: mealCards,
          hasHistory: mealCards > 0
        }
      };
    }
    
    if (pathname.includes('/profile')) {
      return { 
        type: 'profile',
        currentPage: 'Profile Settings - Customize nutrition goals and preferences',
        data: {
          hasProfileData: document.querySelector('input[value], select option:checked') !== null
        }
      };
    }
    
    return { 
      type: 'home',
      currentPage: 'Home Page - Welcome to Snap2Health',
      data: {
        isLoggedIn: !!user
      }
    };
  };

  // Enhanced system prompt with deep context awareness
  const buildSystemPrompt = (context: PageContext): string => {
    const currentMealId = getCurrentMealId();
    const isAnalyzingMeal = !!currentMealId;
    
    let systemPrompt = `You are a knowledgeable nutrition expert and wellness coach integrated into Snap2Health, a meal analysis app. You provide personalized, encouraging nutrition advice.

CURRENT CONTEXT:
- Page: ${context.type}
- User has meal data available: ${(context.nutrients?.length || 0) > 0 ? 'Yes' : 'No'}
- Currently analyzing meal: ${isAnalyzingMeal ? 'Yes' : 'No'}
- User insights available: ${userInsights ? 'Yes' : 'No'}

NUTRITION DATA AVAILABLE:
${context.nutrients && context.nutrients.length > 0 ? 
  `Current meal nutrients: ${context.nutrients.map(n => `${n.name}${n.amount ? ` (${n.amount}${n.unit || ''})` : ''}`).join(', ')}` :
  'No specific nutrient data visible'
}

${userInsights ? `USER HISTORY: ${userInsights.totalMeals} meals analyzed, patterns available for comparison` : ''}

RESPONSE GUIDELINES:
- Be conversational, encouraging, and specific
- Use the visible nutrition data when relevant
- Provide actionable, personalized advice
- Keep responses concise but informative (2-4 sentences typically)
- Use emojis occasionally for engagement
- Reference the user's patterns/history when available
- If asked about meal analysis, focus on the current meal context

CURRENT PAGE CONTEXT: ${getCurrentPageContext()}`;

    return systemPrompt;
  };

  const loadUserInsights = async () => {
    if (!user || contextLoading) return;
    
    try {
      setContextLoading(true);
      const response = await fetch('/api/chat/insights', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const insights = await response.json();
        setUserInsights(insights);
      }
    } catch (error) {
      console.warn('Could not load user insights:', error);
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOpen && !userInsights) {
      loadUserInsights();
    }
  }, [user, isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = getPageContext();
      const systemPrompt = buildSystemPrompt(context);
      const requestType = detectRequestType(content);
      
      const requestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content }
        ],
        context: {
          ...context,
          userInsights,
          currentMeal: getCurrentMealId(),
          requestType
        },
        conversationId,
        max_tokens: requestType === 'simple' ? 150 : 
                   requestType === 'detailed' ? 800 : 400,
      };

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message || 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
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

  const detectRequestType = (content: string): string => {
    const lower = content.toLowerCase();
    if (lower.includes('simple') || lower.includes('brief') || lower.includes('quick')) {
      return 'simple';
    }
    if (lower.includes('detailed') || lower.includes('explain') || lower.includes('how') || lower.includes('why')) {
      return 'detailed';
    }
    return 'balanced';
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Add context-aware quick actions
  const getContextualQuickActions = (context: PageContext): string[] => {
    const baseActions = [
      "Tell me about protein in this meal",
      "How can I improve this meal?",
      "What nutrients am I missing?",
      "Is this amount healthy for me?"
    ];

    switch (context.type) {
      case 'analysis':
      case 'meal_analysis':
        return [
          "Tell me about this meal's protein",
          "How does this fit my goals?",
          "What could make this healthier?",
          "Compare to my usual meals"
        ];
      
      case 'upload':
        return [
          "What should I look for in a meal?",
          "Tips for healthier choices",
          "How to read nutrition labels",
          "What makes a balanced meal?"
        ];
      
      case 'history':
      case 'meal_history':
        return [
          "Show me my nutrition trends",
          "How has my nutrition changed?",
          "Which meal was my healthiest?",
          "What should I focus on?"
        ];
      
      case 'profile':
        return [
          "Help me set better nutrition goals",
          "What activity level should I choose?",
          "How many calories should I eat?",
          "What's best for my goals?"
        ];
      
      default:
        return baseActions;
    }
  };

  // Update the renderQuickActions to use context
  const renderQuickActions = () => {
    const context = getPageContext();
    const contextualActions = getContextualQuickActions(context);
    
    return (
      <div className="mb-3 flex flex-wrap gap-2">
        {contextualActions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              setInputValue(action);
              sendMessage(action);
            }}
            className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 rounded-full transition-all duration-200 hover:shadow-sm"
          >
            {action}
          </button>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button 
            className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ring-4 ring-gray-300/30"
            title="Sign in to chat with AI"
          >
            <span className="text-3xl">💬</span>
          </button>
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-sm text-white font-bold">!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced floating chat button with multiple attention-grabbing features */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Welcome pulse overlay - only shows for first 10 seconds */}
          {showWelcomePulse && (
            <div className="absolute -inset-4 z-10">
              <div className="w-28 h-28 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full animate-ping opacity-30"></div>
              <div className="absolute inset-0 w-28 h-28 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse opacity-40"></div>
            </div>
          )}

          {/* Main chat button with enhanced design */}
          <button 
            onClick={toggleChat}
            className="relative w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ring-4 ring-blue-300/30 hover:ring-blue-400/50 group"
            title={getContextualHelperText()}
          >
            {/* Robot emoji with bounce animation */}
            <span className="text-3xl animate-bounce group-hover:animate-pulse">🤖</span>
            
            {/* Context indicator badges */}
            {getPageContext().nutrients && getPageContext().nutrients!.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <span className="text-xs text-white font-bold">📊</span>
              </div>
            )}
            
            {userInsights && typeof userInsights === 'object' && userInsights.totalMeals && userInsights.totalMeals > 0 && (
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <span className="text-xs text-white font-bold">{userInsights.totalMeals}</span>
              </div>
            )}
          </button>

          {/* Floating tooltip with contextual information */}
          {!isOpen && (
            <div className="absolute bottom-full right-0 mb-4 w-72 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-xl p-4 transform transition-all duration-300 hover:scale-105">
              <div className="text-sm text-gray-700 font-medium mb-2">
                {getContextualHelperText()}
              </div>
              
              {/* Show contextual suggestions */}
              {contextualSuggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Quick Questions:</div>
                  {contextualSuggestions.slice(0, 2).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsOpen(true);
                        setInputValue(suggestion);
                      }}
                      className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Arrow pointing to button */}
              <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-200"></div>
            </div>
          )}

          {/* Enhanced pulsing ring animation when active */}
          {isOpen && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-pulse"></div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced chat panel with modern design */}
      {isOpen && (
        <div className={`fixed bottom-28 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 transform ${
          typeof window !== 'undefined' && window.innerWidth < 640 
            ? 'w-[calc(100vw-2rem)] h-[75vh] left-4 right-4' 
            : 'w-96 h-[500px]'
        }`}>
          {/* Enhanced header with gradient and better typography */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Nutrition Coach</h3>
                {userInsights?.totalMeals > 0 && (
                  <p className="text-xs text-blue-100">
                    📊 {userInsights.totalMeals} meals analyzed
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-2xl font-light transition-colors hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Enhanced quick actions with better styling */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
            {renderQuickActions()}
          </div>

          {/* Enhanced messages area with better spacing and typography */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 h-64 bg-gradient-to-b from-white to-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-600 space-y-4 py-8">
                <div className="text-4xl animate-bounce">🤖</div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">{getContextualHelperText()}</p>
                  {getCurrentMealId() && (
                    <div className="bg-green-100 border border-green-200 text-green-700 rounded-xl p-3 text-sm animate-pulse">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🍽️</span>
                        <span>Analyzing current meal - ask specific questions!</span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">Try asking about nutrition, goals, or meal patterns</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md shadow-lg'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {/* Enhanced metadata display */}
                    {message.metadata && message.role !== 'user' && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        {message.metadata.response_type && (
                          <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded-full mr-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                            {message.metadata.response_type}
                          </span>
                        )}
                        {message.metadata.insights_used && (
                          <span className="inline-flex items-center bg-purple-100 px-2 py-1 rounded-full">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                            insights used
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
                <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md text-sm animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced input area with modern styling */}
          <div className="p-5 border-t border-gray-100 bg-white rounded-b-2xl">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                placeholder="Ask about nutrition, goals, or patterns..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200"
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg"
              >
                <span className="flex items-center space-x-1">
                  <span>Send</span>
                  <span className="text-lg">📤</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalAIChat; 