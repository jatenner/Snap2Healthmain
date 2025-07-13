'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { MealAnalysis } from '../../lib/nutrition-buckets';

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  color: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ icon, title, children, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-slate-800 rounded-lg p-4 border border-slate-700"
  >
    <div className="flex items-center space-x-2 mb-3">
      <div className={`${color} p-1 rounded`}>{icon}</div>
      <h3 className="font-medium text-white">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const MacroBudgetMeter: React.FC<{ macros: MealAnalysis['macros'] }> = ({ macros }) => {
  const totalTarget = macros.protein.target + macros.totalCarbs.target + macros.totalFat.target;
  const totalConsumed = macros.protein.grams + macros.totalCarbs.grams + macros.totalFat.grams;
  const percentage = (totalConsumed / totalTarget) * 100;

  return (
    <InsightCard
      icon={<Target className="w-4 h-4" />}
      title="Macro Budget"
      color="text-macro-400"
    >
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Used today</span>
          <span className="text-white">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-macro-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          {percentage > 80 ? 'Close to daily target' : 'Room for more nutrients'}
        </p>
      </div>
    </InsightCard>
  );
};

const AllergenFlags: React.FC<{ mealName: string }> = ({ mealName }) => {
  const commonAllergens = ['dairy', 'gluten', 'nuts', 'eggs', 'soy'];
  const detected = commonAllergens.filter(allergen => 
    mealName.toLowerCase().includes(allergen) || 
    mealName.toLowerCase().includes(allergen.slice(0, -1))
  );

  return (
    <InsightCard
      icon={<AlertTriangle className="w-4 h-4" />}
      title="Allergen Check"
      color="text-yellow-400"
    >
      {detected.length > 0 ? (
        <div className="space-y-2">
          {detected.map(allergen => (
            <div key={allergen} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-sm text-yellow-400 capitalize">{allergen}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-green-400">No common allergens detected</p>
      )}
    </InsightCard>
  );
};

const ComplementChips: React.FC<{ vitamins: any[]; minerals: any[] }> = ({ vitamins, minerals }) => {
  const getComplement = (nutrients: any[]) => {
    const lowNutrients = nutrients.filter(n => n.dv < 20);
    if (lowNutrients.length === 0) return null;
    
    const nutrient = lowNutrients[0];
    const foods: Record<string, string> = {
      'vitamin c': 'citrus fruits',
      'iron': 'spinach or lean meat',
      'calcium': 'dairy or leafy greens',
      'vitamin d': 'fatty fish or sunshine',
      'magnesium': 'nuts or dark chocolate'
    };
    
    return foods[nutrient.name.toLowerCase()] || 'nutrient-rich foods';
  };

  const vitaminComplement = getComplement(vitamins);
  const mineralComplement = getComplement(minerals);

  return (
    <InsightCard
      icon={<Activity className="w-4 h-4" />}
      title="Pair With"
      color="text-green-400"
    >
      <div className="space-y-2">
        {vitaminComplement && (
          <div className="bg-green-900/30 rounded px-2 py-1">
            <span className="text-xs text-green-400">{vitaminComplement}</span>
          </div>
        )}
        {mineralComplement && (
          <div className="bg-blue-900/30 rounded px-2 py-1">
            <span className="text-xs text-blue-400">{mineralComplement}</span>
          </div>
        )}
        {!vitaminComplement && !mineralComplement && (
          <p className="text-sm text-slate-400">Well-balanced meal</p>
        )}
      </div>
    </InsightCard>
  );
};

const GlycemicCurve: React.FC<{ macros: MealAnalysis['macros'] }> = ({ macros }) => {
  const sugarGrams = macros.components.sugar.grams;
  const fiberGrams = macros.components.fiber.grams;
  const impact = sugarGrams > fiberGrams ? 'High' : sugarGrams > fiberGrams / 2 ? 'Moderate' : 'Low';
  const color = impact === 'High' ? 'text-red-400' : impact === 'Moderate' ? 'text-yellow-400' : 'text-green-400';

  return (
    <InsightCard
      icon={<TrendingUp className="w-4 h-4" />}
      title="Blood Sugar Impact"
      color={color}
    >
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Expected impact</span>
          <span className={`text-sm font-medium ${color}`}>{impact}</span>
        </div>
        <div className="text-xs text-slate-400">
          {impact === 'Low' && 'Steady energy from fiber and protein'}
          {impact === 'Moderate' && 'Balanced sugar with some fiber'}
          {impact === 'High' && 'Quick energy spike expected'}
        </div>
      </div>
    </InsightCard>
  );
};

interface InsightsTabProps {
  analysis: MealAnalysis;
}

const InsightsTab: React.FC<InsightsTabProps> = ({ analysis }) => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Smart Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MacroBudgetMeter macros={analysis.macros} />
        <AllergenFlags mealName={analysis.name} />
        <ComplementChips vitamins={analysis.vitamins} minerals={analysis.minerals} />
        <GlycemicCurve macros={analysis.macros} />
      </div>
    </div>
  );
};

export default InsightsTab; 