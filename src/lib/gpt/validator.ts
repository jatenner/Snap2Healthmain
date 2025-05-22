import { z } from 'zod';

// Define schema for individual nutrients
const NutrientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  percentDailyValue: z.number().optional(),
  description: z.string().optional(),
});

// Define health impact item schema
const HealthImpactItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Define recovery insight schema
const RecoveryInsightSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Define hydration schema
const HydrationSchema = z.object({
  level: z.number(),
  waterContent: z.number(),
  unit: z.string(),
  tips: z.array(z.string()),
});

// Define glycemic load schema
const GlycemicLoadSchema = z.object({
  value: z.number(),
  index: z.number().optional(),
  carbs: z.number(),
  unit: z.string(),
  foodTypes: z.array(z.string()),
  impact: z.string(),
});

// Define the schema for the nutrition analysis
export const NutritionAnalysisSchema = z.object({
  calories: z.number(),
  macronutrients: z.array(NutrientSchema),
  micronutrients: z.array(NutrientSchema),
  benefits: z.array(z.string()),
  concerns: z.array(z.string()),
  suggestions: z.array(z.string()),
  // New fields - all optional as they may not be available for all meals
  recoveryInsights: z.array(RecoveryInsightSchema).optional(),
  hydration: HydrationSchema.optional(),
  glycemicLoad: GlycemicLoadSchema.optional(),
});

// Export the type for use in TypeScript
export type NutritionAnalysis = z.infer<typeof NutritionAnalysisSchema>;
export type Nutrient = z.infer<typeof NutrientSchema>;
export type MacroNutrient = Nutrient;  // Type alias for macronutrients (protein, carbs, fat)
export type MicroNutrient = Nutrient;  // Type alias for micronutrients (vitamins, minerals)
export type HealthImpactItem = z.infer<typeof HealthImpactItemSchema>;
export type RecoveryInsight = z.infer<typeof RecoveryInsightSchema>;
export type Hydration = z.infer<typeof HydrationSchema>;
export type GlycemicLoad = z.infer<typeof GlycemicLoadSchema>;
