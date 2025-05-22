import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a File to a base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
  });
}

/**
 * Groups nutrients by category for better display
 */
export function groupNutrientsByCategory(nutrients: any[]) {
  const categories = {
    'Vitamins': nutrients.filter(n => 
      n.name.includes('Vitamin') || 
      ['Folate', 'Choline', 'Biotin'].includes(n.name)
    ),
    'Minerals': nutrients.filter(n => 
      ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 
       'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine'].includes(n.name)
    ),
    'Other': nutrients.filter(n => 
      !n.name.includes('Vitamin') && 
      !['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 
        'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine',
        'Folate', 'Choline', 'Biotin'].includes(n.name)
    )
  };
  
  // Filter out empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([_, nutrients]) => nutrients.length > 0)
  );
} 