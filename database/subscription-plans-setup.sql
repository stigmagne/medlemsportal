-- Phase 22: Subscription Plans Table
-- Allows dynamic management of subscription types

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL NOT NULL DEFAULT 0,
    description TEXT,
    currency TEXT DEFAULT 'NOK',
    features JSONB DEFAULT '[]'::JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies:
-- SECURITY (M8): Restrict viewing to authenticated users only
-- Superadmins can do everything.

-- SECURITY (M8): Restrict viewing to active plans only (not all plans)
CREATE POLICY "Authenticated users can view active plans" ON subscription_plans
    FOR SELECT 
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Superadmins can manage plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_org_access 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin' 
            AND organization_id IS NULL
        )
    );

-- Seed defaults
INSERT INTO subscription_plans (name, price, description) VALUES 
('Årsabonnement', 990, 'Standard årsabonnement for foreninger'),
('Gratis', 0, 'Gratis versjon for små foreninger'),
('Tilpasset', 0, 'Spesialavtale');
