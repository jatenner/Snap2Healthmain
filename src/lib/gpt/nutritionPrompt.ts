import { NutritionAnalysisSchema } from './validator';

/**
 * Generates a prompt for GPT-4o to analyze nutritional content
 */
export const generateNutritionPrompt = (
  caption: string,
  ingredients: string[],
  healthGoal?: string
): string => {
  // Default goal
  const goal = healthGoal || 'General Wellness';
  
  // Determine if this is a custom goal or one of the predefined ones
  const predefinedGoals = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Diabetes Management', 'General Wellness'];
  const isCustomGoal = !predefinedGoals.includes(goal);
  
  // For custom goals, provide extra instructions
  const customGoalInstructions = isCustomGoal 
    ? `\n\nSince "${goal}" is a personalized health goal, pay special attention to nutrients, ingredients, and meal aspects that would specifically impact this objective. Consider both positive contributors and potential deterrents to this specific health goal.` 
    : '';
  
  // Format ingredients for the prompt
  const ingredientsList = ingredients.length > 0
    ? ingredients.join(', ')
    : caption;
  
  return `
You are a certified nutritionist with expertise in food analysis. Analyze the following food description and provide detailed nutritional information.

FOOD DESCRIPTION:
${caption}

IDENTIFIED INGREDIENTS:
${ingredientsList}

USER'S HEALTH GOAL:
${goal}${customGoalInstructions}

Provide your analysis in the following JSON format:

{
  "calories": <estimate total calories as a number>,
  "macronutrients": [
    {
      "name": <name of macronutrient>,
      "amount": <estimated amount as a number>,
      "unit": <unit of measurement>,
      "percentDailyValue": <percent of daily recommended value>,
      "description": <brief description of why this nutrient matters for the user's specific goal>
    }
    // Include all relevant macronutrients: protein, carbs, fat, fiber, etc.
  ],
  "micronutrients": [
    {
      "name": <name of micronutrient>,
      "amount": <estimated amount as a number>,
      "unit": <unit of measurement>,
      "percentDailyValue": <percent of daily recommended value if applicable>,
      "description": <brief description of why this nutrient matters for the user's specific goal>
    }
    // Include key vitamins and minerals present in significant amounts
  ],
  "benefits": [
    <string describing health benefit specifically related to user's goal>,
    <string describing health benefit specifically related to user's goal>,
    // Add more benefits
  ],
  "concerns": [
    <string describing potential health concern specifically related to user's goal>,
    <string describing potential health concern specifically related to user's goal>,
    // Add more concerns if applicable, otherwise empty array
  ],
  "suggestions": [
    <string offering improvement suggestion specifically addressing user's goal>,
    <string offering improvement suggestion specifically addressing user's goal>,
    // Add more suggestions
  ],
  "recoveryInsights": [
    {
      "title": <short title of recovery insight>,
      "description": <detailed explanation of how this meal aspect supports the user's specific goal>
    }
    // Include 2-3 insights specifically related to the user's goal
  ],
  "hydration": {
    "level": <estimated hydration contribution as percentage 0-100>,
    "waterContent": <estimated water content as number>,
    "unit": <unit of measurement for water content>,
    "tips": [
      <hydration tip relevant to this meal and the user's goal>,
      <hydration tip relevant to this meal and the user's goal>
      // Include 2-3 relevant hydration tips
    ]
  },
  "glycemicLoad": {
    "value": <estimated glycemic load as a number>,
    "index": <estimated glycemic index if applicable>,
    "carbs": <digestible carbs amount>,
    "unit": <unit of measurement for carbs>,
    "foodTypes": [
      <food type contributing to glycemic load>,
      <food type contributing to glycemic load>
      // Include relevant food types
    ],
    "impact": <concise explanation of this glycemic load's impact on the user's specific goal>
  }
}

Ensure the analysis is specifically tailored to the user's "${goal}" goal. Every recommendation, insight, and analysis point should directly address how this meal impacts their specific health objective. For the recoveryInsights, hydration and glycemicLoad sections, if you cannot make a reasonable estimate based on the food description, omit those sections from the JSON response. All numeric values should be numbers, not strings.
`;
}; 