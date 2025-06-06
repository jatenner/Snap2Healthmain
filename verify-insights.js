// Verification script to test meal insights
async function verifyMealInsights(mealId) {
  try {
    console.log(`🔍 Checking insights for meal: ${mealId}`);
    
    const response = await fetch(`http://localhost:3000/api/meals/${mealId}`);
    if (!response.ok) {
      console.error('❌ Failed to fetch meal data:', response.status);
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 Meal Data Analysis:');
    console.log('- Has personalized_insights:', !!data.personalized_insights);
    console.log('- Has insights:', !!data.insights);
    console.log('- insights_status:', data.insights_status);
    console.log('- Insights length:', data.personalized_insights?.length || data.insights?.length || 0);
    
    const hasInsights = data.personalized_insights || data.insights;
    const isCompleted = data.insights_status !== 'generating';
    const shouldDisplay = hasInsights && isCompleted;
    
    console.log('🎯 Display Logic:');
    console.log('- Has insights:', hasInsights);
    console.log('- Is completed (not generating):', isCompleted);
    console.log('- Should display insights:', shouldDisplay);
    
    if (shouldDisplay) {
      console.log('✅ Insights should be visible in the UI!');
      console.log('📝 Insights preview (first 200 chars):');
      console.log((data.personalized_insights || data.insights).substring(0, 200) + '...');
    } else {
      console.log('❌ Insights will NOT be displayed because:');
      if (!hasInsights) console.log('  - No insights data found');
      if (!isCompleted) console.log(`  - Status is "${data.insights_status}" (should be completed)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking meal insights:', error);
  }
}

// Test with the meal from the logs
verifyMealInsights('fad2b1a3-684f-4899-8a89-69669a7851af'); 