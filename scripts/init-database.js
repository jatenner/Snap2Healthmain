const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function initDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  // Create Supabase client with service key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Setting up database tables...');

  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'setup-tables.sql');
  let sql;
  
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
  } catch (error) {
    console.error('Error reading SQL file:', error);
    process.exit(1);
  }

  // Execute SQL commands
  try {
    const { error } = await supabase.rpc('pgrunner.run_sql', { 
      query: sql 
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      // Try alternative methods since pgrunner might not be available
      await executeManualChecks(supabase);
    } else {
      console.log('✅ Database tables created successfully');
    }
  } catch (error) {
    console.error('Exception executing SQL:', error);
    // Try alternative methods
    await executeManualChecks(supabase);
  }

  // Create storage buckets
  try {
    console.log('Checking storage buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      return;
    }

    const mealImagesBucket = buckets?.find(bucket => bucket.name === 'meal-images');
    
    if (!mealImagesBucket) {
      console.log('Creating meal-images bucket...');
      const { error: createError } = await supabase.storage.createBucket('meal-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('✅ meal-images bucket created');
      }
    } else {
      console.log('✅ meal-images bucket already exists');
    }
  } catch (error) {
    console.error('Error managing storage buckets:', error);
  }
}

async function executeManualChecks(supabase) {
  // Manually check if tables exist
  console.log('Performing manual table checks...');
  
  // Check profiles table
  try {
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError && profilesError.message.includes('does not exist')) {
      console.log('Creating profiles table...');
      await supabase.rpc('pg_exec', { 
        command: `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can view their own profile" 
            ON public.profiles FOR SELECT 
            USING (auth.uid() = id);
          CREATE POLICY "Users can update their own profile" 
            ON public.profiles FOR UPDATE 
            USING (auth.uid() = id);
        `
      });
      console.log('✅ Profiles table created');
    } else {
      console.log('✅ Profiles table exists');
    }
  } catch (error) {
    console.error('Error checking/creating profiles table:', error);
  }
  
  // Check meal_history table
  try {
    const { error: mealHistoryError } = await supabase
      .from('meal_history')
      .select('id')
      .limit(1);

    if (mealHistoryError && mealHistoryError.message.includes('does not exist')) {
      console.log('Creating meal_history table...');
      await supabase.rpc('pg_exec', { 
        command: `
          CREATE TABLE IF NOT EXISTS public.meal_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            meal_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
            meal_type TEXT,
            meal_name TEXT,
            image_url TEXT,
            analysis JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          ALTER TABLE public.meal_history ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can view their own meals" 
            ON public.meal_history FOR SELECT 
            USING (auth.uid() = user_id);
          CREATE POLICY "Users can insert their own meals" 
            ON public.meal_history FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
          CREATE POLICY "Users can update their own meals" 
            ON public.meal_history FOR UPDATE 
            USING (auth.uid() = user_id);
          CREATE POLICY "Users can delete their own meals" 
            ON public.meal_history FOR DELETE 
            USING (auth.uid() = user_id);
        `
      });
      console.log('✅ Meal history table created');
    } else {
      console.log('✅ Meal history table exists');
    }
  } catch (error) {
    console.error('Error checking/creating meal_history table:', error);
  }
}

// Run the initialization
initDatabase()
  .then(() => {
    console.log('Database initialization complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }); 