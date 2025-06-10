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
    user_recognized?: boolean;
  };
}

interface PageContext {
  type: 'upload' | 'analysis' | 'history' | 'profile' | 'home' | 'meal_analysis' | 'meal_history';
  data?: any;
  nutrients?: any[];
  mealName?: string;
  currentPage?: string;
}

// Enhanced quick action buttons with emojis and better categorization
const enhancedQuickActions = [
  { 
    label: "📊 My Nutrition Trends", 
    action: "Show me my nutrition patterns and progress over the last week",
    category: "analysis",
    icon: "📈"
  },
  { 
    label: "🎯 Goal Check", 
    action: "How is this meal aligned with my goals?",
    category: "goals",
    icon: "🏆"
  },
  { 
    label: "💡 Quick Tips", 
    action: "Give me 3 quick actionable tips based on my recent meals",
    category: "tips",
    icon: "⚡"
  },
  { 
    label: "🔍 Compare Meals", 
    action: "How does this meal compare to my usual intake?",
    category: "analysis",
    icon: "⚖️"
  },
  { 
    label: "🥗 What to Eat Next", 
    action: "What should I eat for my next meal based on my nutrition today?",
    category: "recommendations",
    icon: "🍽️"
  },
  { 
    label: "📚 Detailed Analysis", 
    action: "Give me detailed analysis and explanation of my nutrition",
    category: "analysis",
    icon: "🔬"
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contextLoading, setContextLoading] = useState(false);

  // Debug user authentication
  useEffect(() => {
    console.log('[GlobalAIChat] User data:', {
      user,
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated: !!user
    });
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to hide welcome pulse after 8 seconds or when chat is opened
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomePulse(false);
    }, 8000);

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

  // Effect to add personalized auto-greeting when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      const context = getPageContext();
      const userName = user?.email?.split('@')[0] || 'there';
      
      let greetingMessage = `Good to see you back, ${userName}! I'm your AI nutrition guide. Ready to analyze your meal and work towards your goals? 🎯`;
      
      // Auto-add greeting message
      const autoGreeting: Message = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: greetingMessage,
        timestamp: new Date(),
        metadata: {
          response_type: 'auto_greeting',
          user_recognized: true
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
        return 'The user is on the upload page, ready to analyze a meal photo with AI.';
      case '/meal-history':
        return 'The user is viewing their meal history, looking at past nutrition analysis.';
      case '/profile':
        return 'The user is on their profile page, managing personal information and nutrition goals.';
      default:
        if (pathname.startsWith('/analysis/')) {
          return 'The user is viewing a detailed meal analysis with nutrition breakdown.';
        }
        return 'The user is exploring the Snap2Health nutrition tracking platform.';
    }
  };

  const getCurrentMealId = () => {
    if (typeof window === 'undefined') return null;
    const pathname = window.location.pathname;
    const mealMatch = pathname.match(/\/analysis\/([a-f0-9\-]+)/);
    return mealMatch ? mealMatch[1] : null;
  };

  const getContextualHelperText = (): string => {
    const context = getPageContext();
    const baseText = "🤖 Your AI Guide";
    
    switch (context.type) {
      case 'upload':
        return `${baseText} - Ready to analyze your meal`;
      case 'meal_analysis':
        return `${baseText} - Nutrition insights available`;
      case 'meal_history':
        return `${baseText} - Pattern analysis & recommendations`;
      case 'profile':
        return `${baseText} - Goal optimization consultation`;
      default:
        return `${baseText} - AI nutrition guide`;
    }
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
        user_id: user?.id,
        content: content.trim(),
        conversation_id: conversationId,
        meal_id: getCurrentMealId(),
        context_data: {
          ...context,
          userInsights,
          currentMeal: getCurrentMealId(),
          requestType,
          page: context.type,
          nutrients: context.nutrients || []
        },
        context: context.type,
        systemPrompt: systemPrompt,
        max_tokens: requestType === 'simple' ? 150 : 
                   requestType === 'detailed' ? 800 : 400,
      };

      console.log('[Chat] Sending request to API...', { user_id: user?.id, content: content.trim() });
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Chat] API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[Chat] Received response:', data);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message || data.response || 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      
      // Provide more helpful error messages
      let errorContent = 'Sorry, I encountered an error. ';
      if (!user) {
        errorContent = 'Please sign in to use the AI chat feature.';
      } else if (error instanceof Error && error.message.includes('401')) {
        errorContent = 'Authentication error. Please try refreshing the page.';
      } else if (error instanceof Error && error.message.includes('429')) {
        errorContent = 'Too many requests. Please wait a moment before trying again.';
      } else if (error instanceof Error && error.message.includes('500')) {
        errorContent = 'Server error. Our team has been notified. Please try again later.';
      } else {
        errorContent += 'Please check your connection and try again.';
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        metadata: { response_type: 'error' }
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

  // Enhanced renderQuickActions with better design and categories
  const renderQuickActions = () => {
    const context = getPageContext();
    const categories = ['all', 'analysis', 'goals', 'tips', 'recommendations'];
    
    const filteredActions = activeCategory === 'all' 
      ? enhancedQuickActions 
      : enhancedQuickActions.filter(action => action.category === activeCategory);
    
    return (
      <div className="space-y-3">
        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              {category === 'all' ? '🌟 All' : 
               category === 'analysis' ? '📊 Analysis' :
               category === 'goals' ? '🎯 Goals' :
               category === 'tips' ? '💡 Tips' :
               category === 'recommendations' ? '🥗 Food' : category}
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredActions.map((actionObj, index) => (
            <button
              key={index}
              onClick={() => {
                setInputValue(actionObj.action);
                sendMessage(actionObj.action);
              }}
              disabled={isLoading}
              className="group flex items-center space-x-3 p-3 bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 hover:shadow-md transform hover:scale-[1.02] text-left disabled:opacity-50"
            >
              <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                {actionObj.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900 truncate">
                  {actionObj.label.replace(/^[📊🎯💡🔍🥗📚]\s*/, '')}
                </div>
                <div className="text-xs text-gray-500 group-hover:text-blue-600 line-clamp-2">
                  Click to ask
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Contextual suggestions from current page */}
        {getContextualQuickActions(context).length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">💡 Page-specific questions:</div>
            <div className="flex flex-wrap gap-2">
              {getContextualQuickActions(context).slice(0, 3).map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(action);
                    sendMessage(action);
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border border-green-200 rounded-full transition-all duration-200 hover:shadow-sm disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
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
    <div className="fixed bottom-4 right-4 z-50">
      {/* Enhanced Chat Toggle Button */}
      {!isOpen && (
        <div className="relative">
          {/* Welcome Pulse Animation */}
          {showWelcomePulse && (
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75 scale-110"></div>
          )}
          <button
            onClick={toggleChat}
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 group"
            aria-label="Open AI Chat"
          >
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            {/* Chat Badge */}
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
              💬
            </div>
          </button>
          {/* Floating Hint */}
          {showWelcomePulse && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in">
              <div className="relative">
                {user ? 'Ask me anything! 🤖' : 'Sign in to chat! 🔐'}
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 transform ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        } flex flex-col overflow-hidden animate-slide-up`}>
          
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI Nutrition Guide</h3>
                  <p className="text-sm text-gray-600">
                    {user ? 'AI Assistant • Always ready to help ✨' : 'Sign in to get started 🔐'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
                >
                  <svg className={`w-4 h-4 transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={toggleChat}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 group"
                  aria-label="Close chat"
                >
                  <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Context Status */}
            {!isMinimized && (
              <div className="mt-3 text-blue-100 text-xs bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                {user ? getContextualHelperText() : 'Please sign in to access personalized nutrition coaching'}
              </div>
            )}
          </div>

          {/* Chat Content - Only show when not minimized */}
          {!isMinimized && (
            <>
              {/* Authentication Check */}
              {!user ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                  <div className="text-center max-w-sm">
                    <div className="text-6xl mb-4">🔐</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Sign In Required</h3>
                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                      To get personalized nutrition coaching, access your meal history, and receive tailored recommendations, please sign in to your account.
                    </p>
                    <div className="space-y-3">
                      <a 
                        href="/login" 
                        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                      >
                        Sign In
                      </a>
                      <a 
                        href="/signup" 
                        className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        Create Account
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Your nutrition data is private and secure 🛡️
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Enhanced Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">🤖</div>
                        <p className="text-gray-600 text-lg font-medium">Good to see you, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'}!</p>
                        <p className="text-gray-500 text-sm mt-2">I'm your AI nutrition guide. What would you like to work on today?</p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
                      >
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}>
                          {message.role === 'assistant' && (
                            <div className="flex items-center mb-2">
                              <span className="text-lg mr-2">🤖</span>
                              <span className="text-xs text-gray-500 font-medium">AI Nutrition Guide</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start animate-message-in">
                        <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-500">AI Nutrition Guide is analyzing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Enhanced Quick Actions */}
                  {showQuickActions && messages.length <= 1 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">💡 Quick actions:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {contextualSuggestions.slice(0, 3).map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickAction(suggestion)}
                            className="text-left text-sm p-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                          >
                            <span className="text-blue-600 font-medium">• {suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Input Area */}
                  <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
                          placeholder="Ask about nutrition, meals, or health goals..."
                          className="w-full p-4 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-500"
                          disabled={isLoading}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <span className="text-xs">💭</span>
                        </div>
                      </div>
                      <button
                        onClick={() => sendMessage(inputValue)}
                        disabled={!inputValue.trim() || isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Press Enter to send • Secure nutrition coaching ✨
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-message-in {
          animation: message-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GlobalAIChat; 