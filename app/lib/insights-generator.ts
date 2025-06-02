/**
 * Insights Generator for meal analysis
 * 
 * This module provides functions to generate personalized insights
 * from meal analysis data, either on the server or client side.
 */

interface UserProfile {
  id?: string;
  full_name?: string;
  gender?: string;
  age?: number;
  weight?: number;
  height?: number;
  activity_level?: string;
  goal?: string;
  healthGoals?: string;
  calorieTarget?: number;
  health_conditions?: string[];
  dietary_restrictions?: string[];
  [key: string]: any;
}

/**
 * Generate personalized insights based on analysis data and user profile
 */
export function generateMealInsights(mealData: any, userProfile?: UserProfile): string {
  try {
    // Initialize the insights array
    const insights: string[] = [];
    
    // Add header and personalized greeting
    insights.push(`# ${mealData.mealName || 'Your Meal'} Analysis`);
    
    if (userProfile?.full_name) {
      insights.push(`Hello ${userProfile.full_name}, here's your personalized nutrition breakdown:`);
    } else {
      insights.push(`Here's your personalized nutrition breakdown:`);
    }
    
    // Get the goal - from meal data or user profile
    const goal = mealData.goal || userProfile?.goal || "General Wellness";
    insights.push(`### Goal: ${goal}`);
    
    // Add the calorie context
    const calories = mealData.calories || mealData.analysis?.calories || 0;
    
    if (calories > 0) {
      // Calculate calorie context based on user profile if available
      let calorieContext = "This meal contains";
      
      if (userProfile?.calorieTarget && userProfile.calorieTarget > 0) {
        const caloriePercentage = Math.round((calories / userProfile.calorieTarget) * 100);
        calorieContext = `This meal represents approximately ${caloriePercentage}% of your daily calorie target (${userProfile.calorieTarget} kcal)`;
      }
      
      insights.push(`${calorieContext} ${calories} calories.`);
    }
    
    // Add macronutrient summary
    const macros = mealData.macronutrients || mealData.analysis?.macronutrients || [];
    if (macros.length > 0) {
      insights.push(`### Macronutrient Composition`);
      
      // Find protein, carbs, and fat
      const protein = macros.find((m: any) => m.name.toLowerCase().includes('protein'));
      const carbs = macros.find((m: any) => m.name.toLowerCase().includes('carb'));
      const fat = macros.find((m: any) => m.name.toLowerCase().includes('fat'));
      
      if (protein) {
        insights.push(`- **Protein:** ${protein.amount}${protein.unit} (${protein.percentDailyValue || 0}% DV)`);
      }
      
      if (carbs) {
        insights.push(`- **Carbohydrates:** ${carbs.amount}${carbs.unit} (${carbs.percentDailyValue || 0}% DV)`);
      }
      
      if (fat) {
        insights.push(`- **Fat:** ${fat.amount}${fat.unit} (${fat.percentDailyValue || 0}% DV)`);
      }
    }
    
    // Add key micronutrients
    const micros = mealData.micronutrients || mealData.analysis?.micronutrients || [];
    if (micros.length > 0) {
      insights.push(`### Key Micronutrients`);
      
      // Get top 3-5 micronutrients by %DV
      const sortedMicros = [...micros].sort((a, b) => (b.percentDailyValue || 0) - (a.percentDailyValue || 0));
      const topMicros = sortedMicros.slice(0, 4);
      
      topMicros.forEach((micro: any) => {
        const benefit = getMicronutrientBenefit(micro.name);
        insights.push(`- **${micro.name}:** ${micro.amount}${micro.unit} (${micro.percentDailyValue || 0}% DV) - *Supports ${benefit}*`);
      });
    }
    
    // Add key benefits
    const benefits = mealData.benefits || mealData.analysis?.benefits || [];
    if (benefits.length > 0) {
      insights.push(`### Benefits`);
      benefits.forEach((benefit: string) => {
        insights.push(`- ${benefit}`);
      });
    }
    
    const concerns = mealData.concerns || mealData.analysis?.concerns || [];
    if (concerns.length > 0) {
      insights.push(`### Considerations`);
      concerns.forEach((concern: string) => {
        insights.push(`- ${concern}`);
      });
    }
    
    // Add recommendations section
    const suggestions = mealData.suggestions || mealData.analysis?.suggestions || [];
    if (suggestions.length > 0) {
      insights.push(`### Recommendations`);
      suggestions.forEach((suggestion: string) => {
        insights.push(`- ${suggestion}`);
      });
    } else {
      insights.push(`### Recommendations`);
      if (goal.toLowerCase().includes('weight loss')) {
        insights.push(`- Consider adding more vegetables to increase volume and fiber while keeping calories moderate.`);
        insights.push(`- Ensure adequate protein to maintain satiety and preserve lean muscle mass.`);
      } else if (goal.toLowerCase().includes('muscle')) {
        insights.push(`- Pair with adequate hydration to support recovery and nutrient transport.`);
        insights.push(`- Consider timing this meal within 1-2 hours after a workout for optimal recovery.`);
      } else {
        insights.push(`- Add a variety of colorful vegetables to increase phytonutrient content.`);
        insights.push(`- Balance your plate with appropriate portions of protein, complex carbs, and healthy fats.`);
      }
    }
    
    // Final personalized tip
    if (userProfile) {
      insights.push(`\n### Personalized Tip`);
      if (goal.toLowerCase().includes('weight loss')) {
        insights.push(`Maintaining a consistent eating schedule and practicing mindful eating can enhance your weight loss journey beyond just focusing on calories.`);
      } else if (goal.toLowerCase().includes('muscle')) {
        insights.push(`Remember that consistency in both nutrition and training is key for muscle development. This meal contributes to your overall nutritional strategy.`);
      } else if (goal.toLowerCase().includes('heart')) {
        insights.push(`Combining this nutrition approach with regular physical activity and stress management will provide the most comprehensive support for your cardiovascular health.`);
      } else {
        insights.push(`Consistent nutrition habits that include a variety of nutrient-dense foods like those in this meal form the foundation of long-term health and wellbeing.`);
      }
    }
    
    // Return the formatted insights
    return insights.join('\n\n');
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Unable to generate detailed insights for this meal.';
  }
}

/**
 * Helper function for micronutrient benefits
 */
function getMicronutrientBenefit(nutrientName: string): string {
  const name = nutrientName.toLowerCase();
  
  if (name.includes('vitamin c')) return 'immune function and collagen production';
  if (name.includes('vitamin d')) return 'bone health and immune function';
  if (name.includes('vitamin b12')) return 'nerve function and red blood cell formation';
  if (name.includes('iron')) return 'oxygen transport and energy production';
  if (name.includes('calcium')) return 'bone health and muscle function';
  if (name.includes('potassium')) return 'heart health and muscle function';
  if (name.includes('magnesium')) return 'muscle recovery and nervous system function';
  
  return 'overall health';
} 