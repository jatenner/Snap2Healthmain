import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('[Fix SQL] Starting SQL syntax fixes...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('meals')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.log('[Fix SQL] Database connection test failed:', testError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed',
        details: testError.message 
      }, { status: 500 });
    }
    
    console.log('[Fix SQL] Database connection successful');
    
    const sqlCommands = [
      // Fix policies with correct syntax
      `DROP POLICY IF EXISTS "Users can view their own meals" ON meals;`,
      `CREATE POLICY "Users can view their own meals" 
        ON meals FOR SELECT 
        USING (auth.uid()::text = user_id);`,
      
      `DROP POLICY IF EXISTS "Users can insert their own meals" ON meals;`,
      `CREATE POLICY "Users can insert their own meals" 
        ON meals FOR INSERT 
        WITH CHECK (auth.uid()::text = user_id);`,
      
      `DROP POLICY IF EXISTS "Users can update their own meals" ON meals;`,
      `CREATE POLICY "Users can update their own meals" 
        ON meals FOR UPDATE 
        USING (auth.uid()::text = user_id);`,
      
      `DROP POLICY IF EXISTS "Users can delete their own meals" ON meals;`,
      `CREATE POLICY "Users can delete their own meals" 
        ON meals FOR DELETE 
        USING (auth.uid()::text = user_id);`,
      
      // Fix triggers with correct syntax  
      `DROP TRIGGER IF EXISTS update_meals_updated_at ON meals;`,
      `CREATE TRIGGER update_meals_updated_at 
        BEFORE UPDATE ON meals 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();`
    ];
    
    const results: string[] = [];
    const errors: string[] = [];
    
    for (const sql of sqlCommands) {
      try {
        console.log('[Fix SQL] Executing:', sql.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log('[Fix SQL] Command failed:', error);
          errors.push(`${sql.substring(0, 30)}...: ${error.message}`);
        } else {
          results.push(`✅ ${sql.substring(0, 30)}... executed successfully`);
        }
      } catch (err) {
        console.log('[Fix SQL] Command exception:', err);
        errors.push(`${sql.substring(0, 30)}...: ${err}`);
      }
    }
    
    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0 ? '✅ SQL syntax fixes applied successfully!' : '⚠️ Some fixes failed',
      results,
      errors,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Fix SQL] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fix SQL syntax',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'SQL Fix endpoint ready. Use POST to apply fixes.',
    status: 'ready' 
  });
} 