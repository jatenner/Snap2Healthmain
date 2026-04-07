/**
 * Nutrition Validation Tests
 */

import { describe, it, expect } from 'vitest';
import { validateNutritionEstimate } from '../app/lib/nutrition-validation';

describe('Nutrition Validation', () => {
  it('accepts a valid meal', () => {
    const result = validateNutritionEstimate({
      mealName: 'Chicken salad',
      calories: 520,
      protein: 38,
      carbs: 22,
      fat: 32,
      macronutrients: [{ name: 'Protein', amount: 38 }],
      micronutrients: [{ name: 'Vitamin C', amount: 18, percentDailyValue: 20 }],
      foods: ['chicken', 'salad'],
    });
    expect(result.isValid).toBe(true);
    expect(result.confidenceScore).toBeGreaterThan(50);
  });

  it('rejects impossible values (protein > calories)', () => {
    const result = validateNutritionEstimate({
      calories: 100,
      protein: 200,
      carbs: 0,
      fat: 0,
    });
    expect(result.isValid).toBe(false);
    expect(result.flags.some(f => f.type === 'impossible')).toBe(true);
  });

  it('flags calories out of bounds', () => {
    const result = validateNutritionEstimate({
      calories: 5000,
      protein: 50,
      carbs: 100,
      fat: 50,
    });
    expect(result.flags.some(f => f.field === 'calories' && f.type === 'bounds')).toBe(true);
    expect(result.confidenceScore).toBeLessThan(90);
  });

  it('flags macro-calorie inconsistency', () => {
    const result = validateNutritionEstimate({
      calories: 500,
      protein: 10,
      carbs: 10,
      fat: 5,
      // Expected: 10*4 + 10*4 + 5*9 = 125 cal, but reported 500
    });
    expect(result.flags.some(f => f.type === 'consistency')).toBe(true);
  });

  it('handles null input', () => {
    const result = validateNutritionEstimate(null);
    expect(result.isValid).toBe(false);
    expect(result.confidenceScore).toBe(0);
  });

  it('penalizes extreme micronutrient DV', () => {
    const result = validateNutritionEstimate({
      calories: 500,
      protein: 30,
      carbs: 50,
      fat: 15,
      micronutrients: [{ name: 'Vitamin C', amount: 5000, percentDailyValue: 5555 }],
    });
    expect(result.flags.some(f => f.field === 'Vitamin C')).toBe(true);
  });
});
