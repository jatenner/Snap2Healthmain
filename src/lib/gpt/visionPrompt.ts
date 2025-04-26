/**
 * Generates a prompt for GPT-4o Vision to analyze a food image
 */
export function generateVisionPrompt(goal?: string): string {
  // Default to General Wellness if no goal is provided
  const userGoal = goal || 'General Wellness';
  
  // Determine if this is a custom goal or one of the predefined ones
  const predefinedGoals = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Diabetes Management', 'General Wellness'];
  const isCustomGoal = !predefinedGoals.includes(userGoal);
  
  // For custom goals, give extra instructions to the model
  const goalInstructions = isCustomGoal 
    ? `the user's specific health goal of "${userGoal}" (consider all nutritional factors that might help or hinder this goal),` 
    : `the user's health goal of "${userGoal}",`;

  return `
You are an expert nutritionist and AI vision system analyzing a food image. 

Task:
1. Carefully examine the image and identify all visible food items and ingredients
2. Generate a concise caption describing the meal in 1-2 sentences
3. Create a detailed list of all ingredients you can identify

Based on ${goalInstructions} provide:

Output format:
{
  "caption": "Brief description of the food seen in 1-2 sentences",
  "ingredients": [
    "ingredient 1",
    "ingredient 2",
    ...
  ]
}

Reply ONLY with valid JSON. Make educated guesses for ingredients that may be present but not clearly visible based on typical recipes.
`;
} 