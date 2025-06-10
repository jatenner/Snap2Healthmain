-- Corrected Setup script for Snap2Health database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  meal_name VARCHAR,
  image_url VARCHAR,
  calories INTEGER,
  protein REAL,
  fat REAL,
  carbs REAL,
  macronutrients JSONB,
  micronutrients JSONB,
  ingredients TEXT[],
  benefits TEXT[],
  concerns TEXT[],
  suggestions TEXT[],
  analysis JSONB,
  goal VARCHAR,
  personalized_insights TEXT,
  insights_status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table for chat memory
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  title VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for chat history  
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles_learning for AI learning and memory
CREATE TABLE IF NOT EXISTS user_profiles_learning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL UNIQUE,
  dietary_preferences JSONB DEFAULT '{}',
  health_goals JSONB DEFAULT '{}',
  food_sensitivities JSONB DEFAULT '{}',
  past_insights JSONB DEFAULT '{}',
  conversation_patterns JSONB DEFAULT '{}',
  learning_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on user_id for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_learning_user_id ON user_profiles_learning(user_id);

-- Create indexes on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles_learning ENABLE ROW LEVEL SECURITY;

-- Create policies for meals table
DROP POLICY IF EXISTS "Users can view their own meals" ON meals;
CREATE POLICY "Users can view their own meals" 
  ON meals FOR SELECT 
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own meals" ON meals;
CREATE POLICY "Users can insert their own meals" 
  ON meals FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own meals" ON meals;
CREATE POLICY "Users can update their own meals" 
  ON meals FOR UPDATE 
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own meals" ON meals;
CREATE POLICY "Users can delete their own meals" 
  ON meals FOR DELETE 
  USING (auth.uid()::text = user_id);

-- Create policies for conversations table
DROP POLICY IF EXISTS "Users can manage their conversations" ON conversations;
CREATE POLICY "Users can manage their conversations" 
  ON conversations FOR ALL 
  USING (auth.uid()::text = user_id);

-- Create policies for chat_messages table  
DROP POLICY IF EXISTS "Users can manage their messages" ON chat_messages;
CREATE POLICY "Users can manage their messages" 
  ON chat_messages FOR ALL 
  USING (auth.uid()::text = user_id);

-- Create policies for user_profiles_learning table
DROP POLICY IF EXISTS "Users can manage their learning profiles" ON user_profiles_learning;
CREATE POLICY "Users can manage their learning profiles" 
  ON user_profiles_learning FOR ALL 
  USING (auth.uid()::text = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_meals_updated_at ON meals;
CREATE TRIGGER update_meals_updated_at 
  BEFORE UPDATE ON meals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_learning_updated_at ON user_profiles_learning;
CREATE TRIGGER update_user_profiles_learning_updated_at 
  BEFORE UPDATE ON user_profiles_learning 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 