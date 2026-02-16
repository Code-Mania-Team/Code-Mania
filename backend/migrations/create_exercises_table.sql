-- Create exercises table for dynamic content management
CREATE TABLE IF NOT EXISTS exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course VARCHAR(50) NOT NULL CHECK (course IN ('python', 'javascript', 'cpp')),
    exercise_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    validation_mode VARCHAR(20) NOT NULL CHECK (validation_mode IN ('FUNDAMENTALS', 'HYBRID', 'OUTPUT')),
    dialogue JSONB NOT NULL,
    experience INTEGER DEFAULT 100,
    lesson_header TEXT,
    description TEXT,
    task TEXT,
    lesson_example TEXT,
    starting_code TEXT,
    requirements JSONB,
    expected_output TEXT,
    grants TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
-- Create index for faster queries
CREATE INDEX idx_exercises_course_status ON exercises(course, status);
CREATE INDEX idx_exercises_course_order ON exercises(course, order_index);
-- RLS (Row Level Security) policies
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to read published exercises
CREATE POLICY "Read published exercises" ON exercises
    FOR SELECT USING (status = 'published');
-- Allow admin users full access
CREATE POLICY "Admin full access" ON exercises
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
-- Trigger to automatically update updated_at
CREATE TRIGGER update_exercises_updated_at 
    BEFORE UPDATE ON exercises 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
