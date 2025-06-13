import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure dynamic runtime to prevent caching
export const dynamic = 'force-dynamic';

/**
 * POST handler for fixing OpenAI API key format
 */
export async function POST(request: NextRequest) {
  console.log('[Timezone Fix] Starting timezone configuration...');

  try {
    const body = await request.json();
    const { action } = body;

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let results: any = {
      timezoneConfig: 'checking',
      memoryConfig: 'checking',
      timestampFixes: 'applying'
    };

    if (action === 'configure_timezone' || action === 'full_fix') {
      console.log('[Timezone Fix] Configuring database timezone...');
      
      // Set database timezone to EST
      try {
        const { data: timezoneData, error: timezoneError } = await supabaseAdmin.rpc('execute_sql', {
          sql_query: `
            -- Set database timezone to Eastern
            SET timezone = 'America/New_York';
            
            -- Create timezone conversion functions
            CREATE OR REPLACE FUNCTION to_est_timezone(timestamp_input timestamptz)
            RETURNS text
            LANGUAGE plpgsql
            AS $$
            BEGIN
              RETURN timestamp_input AT TIME ZONE 'America/New_York';
            END;
            $$;
            
            -- Create function to get current EST time
            CREATE OR REPLACE FUNCTION now_est()
            RETURNS timestamptz
            LANGUAGE plpgsql
            AS $$
            BEGIN
              RETURN NOW() AT TIME ZONE 'America/New_York';
            END;
            $$;
            
            -- Update default for meals table
            ALTER TABLE meals 
            ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'America/New_York'),
            ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'America/New_York');
            
            -- Create view for EST timestamps
            CREATE OR REPLACE VIEW meals_est AS
            SELECT 
              *,
              (created_at AT TIME ZONE 'America/New_York') as created_at_est,
              (updated_at AT TIME ZONE 'America/New_York') as updated_at_est
            FROM meals;
            
            SELECT 'Timezone configuration completed' as status;
          `
        });

        if (timezoneError) {
          console.error('[Timezone Fix] Error configuring timezone:', timezoneError);
          results.timezoneConfig = `Error: ${timezoneError.message}`;
        } else {
          console.log('[Timezone Fix] Timezone configuration successful');
          results.timezoneConfig = 'success';
          results.timezoneData = timezoneData;
        }
      } catch (tzError: any) {
        console.error('[Timezone Fix] Timezone configuration failed:', tzError);
        results.timezoneConfig = `Failed: ${tzError.message}`;
      }
    }

    if (action === 'configure_memory' || action === 'full_fix') {
      console.log('[Timezone Fix] Configuring memory and conversation features...');
      
      try {
        // Create tables for memory/conversation functionality
        const { data: memoryData, error: memoryError } = await supabaseAdmin.rpc('execute_sql', {
          sql_query: `
            -- Create conversations table for chat memory
            CREATE TABLE IF NOT EXISTS conversations (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id VARCHAR NOT NULL,
              title VARCHAR,
              created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/New_York'),
              updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/New_York')
            );

            -- Create messages table for chat history
            CREATE TABLE IF NOT EXISTS chat_messages (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
              user_id VARCHAR NOT NULL,
              role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant')),
              content TEXT NOT NULL,
              context_data JSONB DEFAULT '{}',
              created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/New_York')
            );

            -- Create user_profiles_learning for AI learning
            CREATE TABLE IF NOT EXISTS user_profiles_learning (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id VARCHAR NOT NULL UNIQUE,
              dietary_preferences JSONB DEFAULT '{}',
              health_goals JSONB DEFAULT '{}',
              food_sensitivities JSONB DEFAULT '{}',
              past_insights JSONB DEFAULT '{}',
              conversation_patterns JSONB DEFAULT '{}',
              learning_data JSONB DEFAULT '{}',
              created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/New_York'),
              updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/New_York')
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_profiles_learning_user_id ON user_profiles_learning(user_id);

            -- Enable RLS
            ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
            ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
            ALTER TABLE user_profiles_learning ENABLE ROW LEVEL SECURITY;

            -- Create RLS policies
            CREATE POLICY IF NOT EXISTS "Users can manage their conversations" 
              ON conversations FOR ALL 
              USING (auth.uid()::text = user_id);

            CREATE POLICY IF NOT EXISTS "Users can manage their messages" 
              ON chat_messages FOR ALL 
              USING (auth.uid()::text = user_id);

            CREATE POLICY IF NOT EXISTS "Users can manage their learning profiles" 
              ON user_profiles_learning FOR ALL 
              USING (auth.uid()::text = user_id);

            -- Create update triggers for updated_at
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW() AT TIME ZONE 'America/New_York';
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at 
              BEFORE UPDATE ON conversations 
              FOR EACH ROW 
              EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER IF NOT EXISTS update_user_profiles_learning_updated_at 
              BEFORE UPDATE ON user_profiles_learning 
              FOR EACH ROW 
              EXECUTE FUNCTION update_updated_at_column();

            SELECT 'Memory configuration completed' as status;
          `
        });

        if (memoryError) {
          console.error('[Timezone Fix] Error configuring memory:', memoryError);
          results.memoryConfig = `Error: ${memoryError.message}`;
        } else {
          console.log('[Timezone Fix] Memory configuration successful');
          results.memoryConfig = 'success';
          results.memoryData = memoryData;
        }
      } catch (memError: any) {
        console.error('[Timezone Fix] Memory configuration failed:', memError);
        results.memoryConfig = `Failed: ${memError.message}`;
      }
    }

    // Test current timezone configuration
    try {
      const { data: testData, error: testError } = await supabaseAdmin.rpc('execute_sql', {
        sql_query: `
          SELECT 
            current_setting('timezone') as db_timezone,
            NOW() as current_utc,
            NOW() AT TIME ZONE 'America/New_York' as current_est,
            to_char(NOW() AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS TZ') as formatted_est
        `
      });

      if (!testError && testData) {
        results.currentTimezone = testData;
      }
    } catch (testErr) {
      console.log('[Timezone Fix] Timezone test query failed (normal in some setups)');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Timezone and memory configuration completed',
      results,
      timestamp: new Date().toISOString(),
      recommendations: [
        'Database timezone configured for EST/EDT',
        'Memory tables created for conversation history', 
        'RLS policies enabled for data security',
        'Triggers created for automatic timestamp updates',
        'Use database DEFAULT timestamps instead of JavaScript Date.now()'
      ]
    });

  } catch (error: any) {
    console.error('[Timezone Fix] Configuration failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to configure timezone and memory systems',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Timezone and Memory Configuration API',
    actions: [
      'POST with { "action": "configure_timezone" } - Set up EST timezone',
      'POST with { "action": "configure_memory" } - Set up conversation memory',
      'POST with { "action": "full_fix" } - Complete setup'
    ],
    current_time_est: new Date().toLocaleString("en-US", {timeZone: "America/New_York"}),
    current_time_utc: new Date().toISOString()
  });
} 