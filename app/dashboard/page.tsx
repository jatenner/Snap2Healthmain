import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

async function getMealHistory() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
    const { data, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('user_id', 'test-user-bypass')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching meal history:', error);
      return [];
    }
    
    return data || [];
  }

  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Fetch meal history for the authenticated user
  const { data, error } = await supabase
    .from('meal_history')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching meal history:', error);
    return [];
  }
  
  return data || [];
}

export default async function Dashboard() {
  const mealHistory = await getMealHistory();
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Meal History</h1>
          <Link href="/analyze" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
            Analyze New Meal
          </Link>
        </div>
        
        {mealHistory.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">No meal history yet</h2>
            <p className="text-gray-600 mb-6">Start analyzing your meals to build your history</p>
            <Link href="/analyze" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg">
              Analyze Your First Meal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealHistory.map((meal) => (
              <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-48 w-full">
                  {meal.image_url && (
                    <Image
                      src={meal.image_url}
                      alt={meal.caption || 'Meal image'}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{meal.caption || 'Meal analysis'}</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Calories:</span>
                    <span className="font-medium">{meal.calories || 'N/A'}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(meal.created_at).toLocaleDateString()}
                  </div>
                  <Link 
                    href={`/meal/${meal.id}`}
                    className="mt-3 inline-block text-green-600 hover:text-green-700 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 