'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Brain, Camera, BarChart3, Sparkles } from 'lucide-react';

interface AnalysisProgressProps {
  isVisible: boolean;
  onComplete?: () => void;
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: number; // in seconds
  completed: boolean;
}

export default function EnhancedAnalysisProgress({ isVisible, onComplete }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps: ProgressStep[] = [
    {
      id: 'upload',
      title: 'Processing Image',
      description: 'Uploading and preparing your meal image for analysis...',
      icon: <Camera className="w-6 h-6" />,
      estimatedTime: 5,
      completed: false
    },
    {
      id: 'identification',
      title: 'Identifying Foods',
      description: 'AI is recognizing ingredients and food items in your meal...',
      icon: <Brain className="w-6 h-6" />,
      estimatedTime: 15,
      completed: false
    },
    {
      id: 'nutrition',
      title: 'Calculating Nutrition',
      description: 'Analyzing nutritional content, macros, and micronutrients...',
      icon: <BarChart3 className="w-6 h-6" />,
      estimatedTime: 20,
      completed: false
    },
    {
      id: 'personalization',
      title: 'Personalizing Insights',
      description: 'Generating personalized recommendations based on your profile...',
      icon: <Sparkles className="w-6 h-6" />,
      estimatedTime: 15,
      completed: false
    }
  ];

  useEffect(() => {
    if (!isVisible) return;

    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    let elapsedTimer: NodeJS.Timeout;

    // Update elapsed time every second
    elapsedTimer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Simulate step progression
    const progressSteps = () => {
      let totalTime = 0;
      let stepIndex = 0;

      const moveToNextStep = () => {
        if (stepIndex < steps.length) {
          setCurrentStep(stepIndex);
          const stepTime = (steps[stepIndex]?.estimatedTime || 5) * 1000;
          totalTime += stepTime;

          // Update progress gradually during each step
          const progressIncrement = 100 / steps.length;
          const startProgress = stepIndex * progressIncrement;
          const endProgress = (stepIndex + 1) * progressIncrement;
          
          let stepProgress = 0;
          const progressUpdateInterval = stepTime / 20; // 20 updates per step

          progressTimer = setInterval(() => {
            stepProgress += progressUpdateInterval;
            const currentProgress = startProgress + (stepProgress / stepTime) * progressIncrement;
            setProgress(Math.min(currentProgress, endProgress));

            if (stepProgress >= stepTime) {
              clearInterval(progressTimer);
              // Mark current step as completed
              if (steps[stepIndex]) {
                steps[stepIndex].completed = true;
              }
              stepIndex++;
              
              if (stepIndex < steps.length) {
                setTimeout(moveToNextStep, 500);
              } else {
                // All steps complete
                setProgress(100);
                setIsComplete(true);
                setTimeout(() => {
                  onComplete?.();
                }, 1000);
              }
            }
          }, progressUpdateInterval / 20);
        }
      };

      moveToNextStep();
    };

    progressSteps();

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearInterval(elapsedTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedTotal = steps.reduce((acc, step) => acc + step.estimatedTime, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Meal</h2>
          <p className="text-gray-400">Our AI is processing your image and generating insights</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || step.completed;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-blue-500/10 border border-blue-500/30' : 
                  isCompleted ? 'bg-green-500/10' : 'bg-gray-800'
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${
                    isActive ? 'text-blue-300' : 
                    isCompleted ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${
                    isActive ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                </div>
                
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time Info */}
        <div className="flex justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Elapsed: {formatTime(timeElapsed)}</span>
          </div>
          <span>Est. {formatTime(estimatedTotal)}</span>
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-300 font-medium">Analysis Complete!</p>
            <p className="text-green-200 text-sm">Redirecting to your results...</p>
          </div>
        )}
      </div>
    </div>
  );
} 