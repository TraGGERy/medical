-- Daily Health Calendar & Check-in System Migration
-- Creates tables for health event tracking, daily check-ins, notifications, and streak tracking

-- Daily check-ins table for user health status tracking
CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    checkin_date DATE NOT NULL,
    overall_mood INTEGER CHECK (overall_mood >= 1 AND overall_mood <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    sleep_hours DECIMAL(3,1),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, checkin_date)
);

-- Health events table for tracking symptoms, conditions, etc.
CREATE TABLE health_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'symptom', 'medication', 'appointment', 'exercise', 'diet'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5),
    start_date DATE NOT NULL,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT false,
    tags TEXT[], -- Array of tags for categorization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptoms logged during daily check-ins
CREATE TABLE checkin_symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id UUID NOT NULL REFERENCES daily_checkins(id) ON DELETE CASCADE,
    symptom_name VARCHAR(255) NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications logged during daily check-ins
CREATE TABLE checkin_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id UUID NOT NULL REFERENCES daily_checkins(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    taken_at TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health notifications for persistent issues
CREATE TABLE health_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    health_event_id UUID REFERENCES health_events(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'persistence_alert', 'reminder', 'milestone'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streak tracking for gamification
CREATE TABLE streak_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    streak_type VARCHAR(50) NOT NULL, -- 'daily_checkin', 'medication_adherence', 'exercise'
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_activities INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Health patterns for AI analysis
CREATE TABLE health_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'symptom_correlation', 'mood_trend', 'sleep_pattern'
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date DESC);
CREATE INDEX idx_health_events_user_type ON health_events(user_id, event_type);
CREATE INDEX idx_health_events_ongoing ON health_events(user_id, is_ongoing) WHERE is_ongoing = true;
CREATE INDEX idx_health_events_date_range ON health_events(user_id, start_date, end_date);
CREATE INDEX idx_checkin_symptoms_checkin ON checkin_symptoms(checkin_id);
CREATE INDEX idx_checkin_medications_checkin ON checkin_medications(checkin_id);
CREATE INDEX idx_health_notifications_user_sent ON health_notifications(user_id, is_sent);
CREATE INDEX idx_health_notifications_scheduled ON health_notifications(scheduled_for) WHERE is_sent = false;
CREATE INDEX idx_streak_records_user_type ON streak_records(user_id, streak_type);
CREATE INDEX idx_health_patterns_user_active ON health_patterns(user_id, is_active) WHERE is_active = true;

-- Function to update streak records
CREATE OR REPLACE FUNCTION update_streak_record(
    p_user_id TEXT,
    p_streak_type VARCHAR(50),
    p_activity_date DATE DEFAULT CURRENT_DATE
) RETURNS void AS $$
DECLARE
    current_record streak_records%ROWTYPE;
    days_diff INTEGER;
BEGIN
    -- Get current streak record
    SELECT * INTO current_record
    FROM streak_records
    WHERE user_id = p_user_id AND streak_type = p_streak_type;
    
    IF NOT FOUND THEN
        -- Create new streak record
        INSERT INTO streak_records (user_id, streak_type, current_streak, longest_streak, last_activity_date, total_activities)
        VALUES (p_user_id, p_streak_type, 1, 1, p_activity_date, 1);
    ELSE
        -- Calculate days difference
        days_diff := p_activity_date - current_record.last_activity_date;
        
        IF days_diff = 1 THEN
            -- Consecutive day - increment streak
            UPDATE streak_records
            SET current_streak = current_record.current_streak + 1,
                longest_streak = GREATEST(current_record.longest_streak, current_record.current_streak + 1),
                last_activity_date = p_activity_date,
                total_activities = current_record.total_activities + 1,
                updated_at = NOW()
            WHERE user_id = p_user_id AND streak_type = p_streak_type;
        ELSIF days_diff = 0 THEN
            -- Same day - just update total activities
            UPDATE streak_records
            SET total_activities = current_record.total_activities + 1,
                updated_at = NOW()
            WHERE user_id = p_user_id AND streak_type = p_streak_type;
        ELSE
            -- Streak broken - reset to 1
            UPDATE streak_records
            SET current_streak = 1,
                last_activity_date = p_activity_date,
                total_activities = current_record.total_activities + 1,
                updated_at = NOW()
            WHERE user_id = p_user_id AND streak_type = p_streak_type;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check for persistent health events and create notifications
CREATE OR REPLACE FUNCTION check_persistent_health_events() RETURNS void AS $$
DECLARE
    event_record health_events%ROWTYPE;
    days_persistent INTEGER;
    notification_exists BOOLEAN;
BEGIN
    -- Check all ongoing health events
    FOR event_record IN
        SELECT * FROM health_events
        WHERE is_ongoing = true
        AND event_type = 'symptom'
    LOOP
        -- Calculate days persistent
        days_persistent := CURRENT_DATE - event_record.start_date + 1;
        
        -- Check if we need to send a 5-day persistence notification
        IF days_persistent >= 5 THEN
            -- Check if notification already exists
            SELECT EXISTS(
                SELECT 1 FROM health_notifications
                WHERE health_event_id = event_record.id
                AND notification_type = 'persistence_alert'
                AND is_sent = true
            ) INTO notification_exists;
            
            -- Create notification if it doesn't exist
            IF NOT notification_exists THEN
                INSERT INTO health_notifications (
                    user_id,
                    health_event_id,
                    notification_type,
                    title,
                    message,
                    scheduled_for
                ) VALUES (
                    event_record.user_id,
                    event_record.id,
                    'persistence_alert',
                    'Persistent Health Event Alert',
                    format('Your %s has been ongoing for %s days. Consider consulting with a healthcare provider.', 
                           event_record.title, days_persistent),
                    NOW()
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak when daily check-in is created
CREATE OR REPLACE FUNCTION trigger_update_checkin_streak() RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_streak_record(NEW.user_id, 'daily_checkin', NEW.checkin_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checkin_streak_trigger
    AFTER INSERT ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_checkin_streak();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_events_updated_at
    BEFORE UPDATE ON health_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streak_records_updated_at
    BEFORE UPDATE ON streak_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_checkins
CREATE POLICY "Users can view their own daily check-ins" ON daily_checkins
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own daily check-ins" ON daily_checkins
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own daily check-ins" ON daily_checkins
    FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for health_events
CREATE POLICY "Users can view their own health events" ON health_events
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own health events" ON health_events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own health events" ON health_events
    FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for checkin_symptoms
CREATE POLICY "Users can view their own checkin symptoms" ON checkin_symptoms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM daily_checkins dc
            WHERE dc.id = checkin_symptoms.checkin_id
            AND dc.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert their own checkin symptoms" ON checkin_symptoms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM daily_checkins dc
            WHERE dc.id = checkin_symptoms.checkin_id
            AND dc.user_id = auth.uid()::text
        )
    );

-- RLS Policies for checkin_medications
CREATE POLICY "Users can view their own checkin medications" ON checkin_medications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM daily_checkins dc
            WHERE dc.id = checkin_medications.checkin_id
            AND dc.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert their own checkin medications" ON checkin_medications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM daily_checkins dc
            WHERE dc.id = checkin_medications.checkin_id
            AND dc.user_id = auth.uid()::text
        )
    );

-- RLS Policies for health_notifications
CREATE POLICY "Users can view their own health notifications" ON health_notifications
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert health notifications" ON health_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update health notifications" ON health_notifications
    FOR UPDATE USING (true);

-- RLS Policies for streak_records
CREATE POLICY "Users can view their own streak records" ON streak_records
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can manage streak records" ON streak_records
    FOR ALL USING (true);

-- RLS Policies for health_patterns
CREATE POLICY "Users can view their own health patterns" ON health_patterns
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can manage health patterns" ON health_patterns
    FOR ALL USING (true);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON daily_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON health_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON checkin_symptoms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON checkin_medications TO authenticated;
GRANT SELECT ON health_notifications TO authenticated;
GRANT SELECT ON streak_records TO authenticated;
GRANT SELECT ON health_patterns TO authenticated;

-- Grant permissions to anon users (limited)
GRANT SELECT ON daily_checkins TO anon;
GRANT SELECT ON health_events TO anon;
GRANT SELECT ON streak_records TO anon;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION update_streak_record(TEXT, VARCHAR(50), DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_persistent_health_events() TO authenticated;