#!/usr/bin/env python3

# Read the file
with open('app/components/PersonalizedNutritionAnalysis.tsx', 'r') as f:
    lines = f.readlines()

# Function to insert
function_code = """
// Helper function to get DV color system
const getDVColorSystem = (nutrient: Nutrient): { progressColor: string; statusLabel: string; bgColor: string } => {
  const dv = nutrient.percentDailyValue || 0;
  const limitNutrients = ['sodium', 'sugar', 'saturated fat', 'cholesterol'];
  const isLimitNutrient = limitNutrients.some(limit => nutrient.name.toLowerCase().includes(limit));
  if (dv <= 0) return { progressColor: 'bg-gray-600', statusLabel: 'Unknown', bgColor: 'bg-gray-800/50 border-gray-600/50' };
  if (isLimitNutrient) {
    if (dv >= 75) return { progressColor: 'bg-red-500', statusLabel: 'High', bgColor: 'bg-red-900/30 border-red-500/40' };
    if (dv >= 40) return { progressColor: 'bg-yellow-500', statusLabel: 'Moderate', bgColor: 'bg-yellow-900/30 border-yellow-500/40' };
    return { progressColor: 'bg-green-500', statusLabel: 'Good', bgColor: 'bg-green-900/30 border-green-500/40' };
  } else {
    if (dv >= 50) return { progressColor: 'bg-green-500', statusLabel: 'Excellent', bgColor: 'bg-green-900/30 border-green-500/40' };
    if (dv >= 25) return { progressColor: 'bg-yellow-500', statusLabel: 'Good', bgColor: 'bg-yellow-900/30 border-yellow-500/40' };
    return { progressColor: 'bg-red-500', statusLabel: 'Low', bgColor: 'bg-red-900/30 border-red-500/40' };
  }
};

"""

# Insert after line 296 (index 295)
lines.insert(296, function_code)

# Write back to file
with open('app/components/PersonalizedNutritionAnalysis.tsx', 'w') as f:
    f.writelines(lines)

print('Function added successfully') 