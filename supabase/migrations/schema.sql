-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS ai_feedbacks CASCADE;
DROP TABLE IF EXISTS interview_answers CASCADE;
DROP TABLE IF EXISTS interview_questions CASCADE;
DROP TABLE IF EXISTS mock_interviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table (extends Supabase auth.users)
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    role text DEFAULT 'job_seeker', -- e.g., student, job_seeker, admin
    tier text DEFAULT 'free', -- e.g., free, pro, b2b
    subscription_status text DEFAULT 'inactive', -- e.g., active, inactive, canceled
    target_role text,
    interview_language text DEFAULT 'id',
    job_description text,
    resume text,
    camera_on boolean DEFAULT true,
    response_mode text DEFAULT 'voice',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Organizations Table (for B2B/Team management)
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subscription_tier text DEFAULT 'b2b',
    max_members integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Organization Members Table (junction table)
CREATE TABLE organization_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role text DEFAULT 'member', -- e.g., admin, member
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (organization_id, user_id)
);

-- 4. Subscriptions Table
CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE, -- Nullable for B2B/Team subscriptions
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE, -- Nullable for individual subscriptions
    tier text NOT NULL, -- e.g., pro, b2b
    status text NOT NULL, -- e.g., active, past_due, canceled, unpaid
    price decimal(10,2) NOT NULL,
    billing_cycle text NOT NULL, -- e.g., monthly, yearly
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_target_entity CHECK (
        (user_id IS NOT NULL AND organization_id IS NULL) OR 
        (user_id IS NULL AND organization_id IS NOT NULL)
    )
);

-- 5. Payments Table
CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    invoice_id text,
    payment_gateway text, -- e.g., doku
    transaction_id text UNIQUE,
    amount decimal(10,2) NOT NULL,
    status text NOT NULL, -- e.g., pending, settlement, capture, expire, refund
    payment_method text, -- e.g., gopay, qris, credit_card, va
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Mock Interviews Table
CREATE TABLE mock_interviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_role text NOT NULL,
    job_description text,
    status text DEFAULT 'started' NOT NULL, -- e.g., started, completed, abandoned
    pre_confidence_score integer CHECK (pre_confidence_score BETWEEN 1 AND 5),
    post_confidence_score integer CHECK (post_confidence_score BETWEEN 1 AND 5),
    overall_score integer CHECK (overall_score BETWEEN 0 AND 100),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at timestamp with time zone
);

-- 7. Interview Questions Table
CREATE TABLE interview_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mock_interview_id uuid NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    sequence_number integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Interview Answers Table
CREATE TABLE interview_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_question_id uuid UNIQUE NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    answer_text text NOT NULL,
    response_mode text DEFAULT 'text' NOT NULL, -- e.g., text, voice
    voice_duration_seconds integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. AI Feedbacks Table
CREATE TABLE ai_feedbacks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_answer_id uuid UNIQUE NOT NULL REFERENCES interview_answers(id) ON DELETE CASCADE,
    structure_score integer CHECK (structure_score BETWEEN 0 AND 100),
    relevance_score integer CHECK (relevance_score BETWEEN 0 AND 100),
    brevity_score integer CHECK (brevity_score BETWEEN 0 AND 100),
    overall_score integer CHECK (overall_score BETWEEN 0 AND 100),
    feedback_text text NOT NULL,
    highlights_rambling text,
    what_you_could_have_said text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create trigger function for handling new user signups from Google Auth / standard auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        ),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read their own profile"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to insert their own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

