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
  timeframe: z.string().optional(),
  impactRating: z.enum(['low', 'moderate', 'high']).optional(),
  keyFindings: z.array(z.string()).optional(),
  researchNotes: z.array(z.string()).optional(),
  citations: z.array(z.string()).optional()
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

// Schema for validating nutrition analysis data from GPT
export const NutritionAnalysisSchema = {
  type: 'object',
  properties: {
    calories: { type: 'number' },
    macronutrients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
          unit: { type: 'string' },
          percentDailyValue: { type: 'number' },
          description: { type: 'string' }
        },
        required: ['name', 'amount', 'unit']
      }
    },
    micronutrients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
          unit: { type: 'string' },
          percentDailyValue: { type: 'number' },
          description: { type: 'string' }
        },
        required: ['name', 'amount', 'unit']
      }
    },
    benefits: {
      type: 'array',
      items: { type: 'string' }
    },
    concerns: {
      type: 'array',
      items: { type: 'string' }
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' }
    },
    recoveryInsights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          timeframe: { type: 'string' },
          impactRating: { type: 'string', enum: ['low', 'moderate', 'high'] },
          keyFindings: { 
            type: 'array',
            items: { type: 'string' }
          },
          researchNotes: { 
            type: 'array',
            items: { type: 'string' }
          },
          citations: { 
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['title', 'description']
      }
    },
    hydration: {
      type: 'object',
      properties: {
        level: { type: 'number' },
        waterContent: { type: 'number' },
        unit: { type: 'string' },
        tips: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    glycemicLoad: {
      type: 'object',
      properties: {
        value: { type: 'number' },
        index: { type: 'number' },
        carbs: { type: 'number' },
        unit: { type: 'string' },
        foodTypes: {
          type: 'array',
          items: { type: 'string' }
        },
        impact: { type: 'string' }
      }
    }
  },
  required: ['calories', 'macronutrients', 'benefits', 'concerns', 'suggestions']
};

// Export the type for use in TypeScript
export type NutritionAnalysis = z.infer<typeof NutritionAnalysisSchema>;
export type Nutrient = z.infer<typeof NutrientSchema>;
export type MacroNutrient = Nutrient;  // Type alias for macronutrients (protein, carbs, fat)
export type MicroNutrient = Nutrient;  // Type alias for micronutrients (vitamins, minerals)
export type HealthImpactItem = z.infer<typeof HealthImpactItemSchema>;
export type RecoveryInsight = z.infer<typeof RecoveryInsightSchema>;
export type Hydration = z.infer<typeof HydrationSchema>;
export type GlycemicLoad = z.infer<typeof GlycemicLoadSchema>;

// Define TypeScript interfaces for the nutrition analysis

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
}

export interface RecoveryInsight {
  title: string;
  description: string;
  timeframe?: string;
  impactRating?: 'low' | 'moderate' | 'high';
  keyFindings?: string[];
  researchNotes?: string[];
  citations?: string[];
}

export interface Hydration {
  level: number;
  waterContent: number;
  unit: string;
  tips: string[];
}

export interface GlycemicLoad {
  value: number;
  index?: number;
  carbs: number;
  unit: string;
  foodTypes: string[];
  impact: string;
}

export interface NutritionAnalysis {
  calories: number;
  macronutrients: Nutrient[];
  micronutrients?: Nutrient[];
  benefits: string[];
  concerns: string[];
  suggestions: string[];
  recoveryInsights?: RecoveryInsight[];
  hydration?: Hydration;
  glycemicLoad?: GlycemicLoad;
}

// Simple validation function to ensure required fields exist
export function validateNutritionAnalysis(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }
  
  if (typeof data.calories !== 'number') {
    errors.push('Calories must be a number');
  }
  
  if (!Array.isArray(data.macronutrients)) {
    errors.push('Macronutrients must be an array');
  } else {
    // Check each macronutrient
    data.macronutrients.forEach((nutrient: any, index: number) => {
      if (typeof nutrient !== 'object' || nutrient === null) {
        errors.push(`Macronutrient at index ${index} must be an object`);
        return;
      }
      
      if (typeof nutrient.name !== 'string') {
        errors.push(`Macronutrient at index ${index} must have a name string`);
      }
      
      if (typeof nutrient.amount !== 'number') {
        errors.push(`Macronutrient at index ${index} must have an amount number`);
      }
      
      if (typeof nutrient.unit !== 'string') {
        errors.push(`Macronutrient at index ${index} must have a unit string`);
      }
    });
  }
  
  if (!Array.isArray(data.benefits)) {
    errors.push('Benefits must be an array');
  }
  
  if (!Array.isArray(data.concerns)) {
    errors.push('Concerns must be an array');
  }
  
  if (!Array.isArray(data.suggestions)) {
    errors.push('Suggestions must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
