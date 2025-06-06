'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Sample meal details
const SAMPLE_MEALS = {
  '1': {
    id: '1',
    name: 'Grilled Chicken Salad',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    date: '2023-05-08T12:30:00Z',
    calories: 320,
    macros: {
      protein: 29,
      carbs: 12,
      fat: 16,
      fiber: 4,
      sugar: 3
    },
    ingredients: [
      { name: 'Grilled Chicken Breast', calories: 165, protein: 25, amount: '100g' },
      { name: 'Mixed Greens', calories: 15, fiber: 2, amount: '2 cups' },
      { name: 'Cherry Tomatoes', calories: 25, carbs: 5, amount: '6 pieces' },
      { name: 'Cucumber', calories: 15, carbs: 3, amount: '1/2 cup' },
      { name: 'Olive Oil', calories: 80, fat: 14, amount: '1 tbsp' },
      { name: 'Balsamic Vinegar', calories: 20, sugar: 3, amount: '1 tbsp' }
    ],
    vitamins: [
      { name: 'Vitamin A', amount: '25%' },
      { name: 'Vitamin C', amount: '45%' },
      { name: 'Iron', amount: '15%' },
      { name: 'Calcium', amount: '10%' }
    ],
    healthScore: 9.2,
    recommendations: [
      'Great source of lean protein',
      'Low in carbohydrates',
      'Rich in micronutrients',
      'Consider adding some healthy fats like avocado'
    ]
  },
  '2': {
    id: '2',
    name: 'Salmon with Vegetables',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
    date: '2023-05-07T18:15:00Z',
    calories: 0, // No fallback calories - OpenAI must provide
    macros: {
      protein: 35,
      carbs: 15,
      fat: 28,
      fiber: 6,
      sugar: 4
    },
    ingredients: [
      { name: 'Salmon Fillet', calories: 280, protein: 30, fat: 18, amount: '150g' },
      { name: 'Broccoli', calories: 55, carbs: 10, fiber: 5, amount: '1 cup' },
      { name: 'Sweet Potato', calories: 90, carbs: 20, fiber: 3, amount: '1 small' },
      { name: 'Olive Oil', calories: 40, fat: 6, amount: '1/2 tbsp' }
    ],
    vitamins: [
      { name: 'Vitamin D', amount: '100%' },
      { name: 'Omega-3', amount: '180%' },
      { name: 'Vitamin B12', amount: '120%' },
      { name: 'Potassium', amount: '25%' }
    ],
    healthScore: 9.5,
    recommendations: [
      'Excellent source of omega-3 fatty acids',
      'Rich in vitamin D and B vitamins',
      'Good balance of protein and healthy fats',
      'Consider adding a leafy green side for more fiber'
    ]
  },
  '3': {
    id: '3',
    name: 'Avocado Toast',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
    date: '2023-05-07T09:20:00Z',
    calories: 280,
    macros: {
      protein: 8,
      carbs: 28,
      fat: 16,
      fiber: 8,
      sugar: 2
    },
    ingredients: [
      { name: 'Whole Grain Bread', calories: 80, carbs: 15, fiber: 3, amount: '1 slice' },
      { name: 'Avocado', calories: 160, fat: 15, fiber: 7, amount: '1/2 fruit' },
      { name: 'Cherry Tomatoes', calories: 15, carbs: 3, amount: '4 pieces' },
      { name: 'Lemon Juice', calories: 5, amount: '1 tsp' },
      { name: 'Red Pepper Flakes', calories: 5, amount: '1/4 tsp' },
      { name: 'Salt', calories: 0, amount: 'to taste' }
    ],
    vitamins: [
      { name: 'Vitamin E', amount: '15%' },
      { name: 'Potassium', amount: '20%' },
      { name: 'Folate', amount: '25%' },
      { name: 'Magnesium', amount: '15%' }
    ],
    healthScore: 8.5,
    recommendations: [
      'Great source of healthy monounsaturated fats',
      'High in fiber which aids digestion',
      'Rich in potassium and magnesium',
      'Consider adding an egg for more protein'
    ]
  },
  '4': {
    id: '4',
    name: 'Protein Smoothie Bowl',
    image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767',
    date: '2023-05-06T08:45:00Z',
    calories: 310,
    macros: {
      protein: 24,
      carbs: 42,
      fat: 8,
      fiber: 6,
      sugar: 26
    },
    ingredients: [
      { name: 'Protein Powder', calories: 120, protein: 24, amount: '1 scoop' },
      { name: 'Frozen Banana', calories: 90, carbs: 23, sugar: 15, amount: '1 medium' },
      { name: 'Mixed Berries', calories: 50, carbs: 12, sugar: 8, amount: '1/2 cup' },
      { name: 'Almond Milk', calories: 30, fat: 3, amount: '1/2 cup' },
      { name: 'Chia Seeds', calories: 60, fat: 4, fiber: 5, amount: '1 tbsp' },
      { name: 'Granola', calories: 40, carbs: 7, amount: '2 tbsp' }
    ],
    vitamins: [
      { name: 'Vitamin C', amount: '60%' },
      { name: 'Vitamin B6', amount: '25%' },
      { name: 'Manganese', amount: '30%' },
      { name: 'Antioxidants', amount: 'High' }
    ],
    healthScore: 7.8,
    recommendations: [
      'Good post-workout meal with balanced protein and carbs',
      'High in natural sugars from fruit',
      'Rich in antioxidants from berries',
      'Consider using unsweetened protein powder to reduce sugar content'
    ]
  }
};

export default function MealDetailPage() {
  const params = useParams();
  const mealId = params?.id as string;
  
  const [meal, setMeal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      if (SAMPLE_MEALS[mealId]) {
        setMeal(SAMPLE_MEALS[mealId]);
        setIsLoading(false);
      } else {
        setError('Meal not found');
        setIsLoading(false);
      }
    }, 800);
  }, [mealId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-xl shadow-xl">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error || 'Unable to load meal details'}</p>
          <Link href="/history" className="text-blue-400 hover:underline">
            ← Back to Meal History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header Navigation */}
        <div className="flex flex-wrap justify-between items-center mb-8">
          <nav className="flex space-x-4 text-sm mb-4 lg:mb-0">
            <Link href="/" className="text-blue-300 hover:underline">Home</Link>
            <span className="text-gray-500">/</span>
            <Link href="/history" className="text-blue-300 hover:underline">Meal History</Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-300">{meal.name}</span>
          </nav>
          
          <div className="flex space-x-3">
            <Link
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition-colors"
            >
              Analyze New Meal
            </Link>
          </div>
        </div>
        
        {/* Meal Header */}
        <div className="bg-gray-800 rounded-xl overflow-hidden mb-8">
          <div className="relative h-80 w-full">
            <Image
              src={meal.image}
              alt={meal.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <h1 className="text-3xl font-bold text-blue-300 mb-2">{meal.name}</h1>
                <p className="text-gray-400 text-sm">
                  Analyzed on {new Date(meal.date).toLocaleDateString()} at {new Date(meal.date).toLocaleTimeString()}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center bg-gray-700 px-4 py-2 rounded-lg">
                <div className="mr-3">
                  <div className="text-sm text-gray-400">Health Score</div>
                  <div className="text-2xl font-bold text-green-400">{meal.healthScore}/10</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-green-500 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-400">
                    {Math.round(meal.healthScore * 10)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Nutritional Summary */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-blue-300">Nutritional Summary</h2>
              
              <div className="flex justify-between mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{meal.calories}</div>
                  <div className="text-sm text-gray-400">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{meal.macros.protein}g</div>
                  <div className="text-sm text-gray-400">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{meal.macros.carbs}g</div>
                  <div className="text-sm text-gray-400">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">{meal.macros.fat}g</div>
                  <div className="text-sm text-gray-400">Fat</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Carbohydrates</span>
                    <span className="font-medium text-yellow-400">{meal.macros.carbs}g</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(meal.macros.carbs / 50) * 100}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Protein</span>
                    <span className="font-medium text-green-400">{meal.macros.protein}g</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: `${(meal.macros.protein / 50) * 100}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Fat</span>
                    <span className="font-medium text-red-400">{meal.macros.fat}g</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${(meal.macros.fat / 50) * 100}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Fiber</span>
                    <span className="font-medium text-purple-400">{meal.macros.fiber}g</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${(meal.macros.fiber / 25) * 100}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Sugar</span>
                    <span className="font-medium text-pink-400">{meal.macros.sugar}g</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-pink-400 h-2 rounded-full" style={{ width: `${(meal.macros.sugar / 25) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ingredients Analysis */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-blue-300">Ingredients Analysis</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 text-left text-gray-400">Ingredient</th>
                      <th className="pb-3 text-right text-gray-400">Amount</th>
                      <th className="pb-3 text-right text-gray-400">Calories</th>
                      <th className="pb-3 text-right text-gray-400">Protein</th>
                      <th className="pb-3 text-right text-gray-400">Carbs</th>
                      <th className="pb-3 text-right text-gray-400">Fat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.ingredients.map((ingredient, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-0">
                        <td className="py-3 text-gray-300">{ingredient.name}</td>
                        <td className="py-3 text-right text-gray-300">{ingredient.amount}</td>
                        <td className="py-3 text-right text-gray-300">{ingredient.calories || '-'}</td>
                        <td className="py-3 text-right text-gray-300">{ingredient.protein ? `${ingredient.protein}g` : '-'}</td>
                        <td className="py-3 text-right text-gray-300">{ingredient.carbs ? `${ingredient.carbs}g` : '-'}</td>
                        <td className="py-3 text-right text-gray-300">{ingredient.fat ? `${ingredient.fat}g` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Nutritional Recommendations */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-blue-300">Recommendations</h2>
              <ul className="space-y-3 text-gray-300">
                {meal.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Vitamins & Minerals */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-blue-300">Vitamins & Minerals</h2>
              
              <div className="space-y-3">
                {meal.vitamins.map((vitamin, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{vitamin.name}</span>
                      <span className="font-medium text-blue-400">{vitamin.amount}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(
                            parseInt(vitamin.amount.replace('%', '')) || 0, 
                            100
                          )}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 