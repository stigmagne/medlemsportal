-- Create board_positions table
CREATE TABLE IF NOT EXISTS board_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    
    -- Position
    position_type TEXT NOT NULL CHECK (position_type IN (
        'leder',         -- Styreleder
        'nestleder',     -- Nestleder
        'kasserer',      -- Kasserer/økonomiansvarlig
        'sekretar',      -- Sekretær
        'medlem',        -- Styremedlem
        'varamedlem',    -- Varamedlem
        'revisor'        -- Revisor
    )),
    position_title TEXT, -- Optional: "Økonomiansvarlig" instead of "Kasserer"
    
    -- Term
    elected_date DATE NOT NULL,
    term_start_date DATE NOT NULL,
    term_end_date DATE, -- NULL = indefinite
    term_years INTEGER DEFAULT 2,
    
    -- Public contact (overrides member default if set)
    public_email TEXT,
    public_phone TEXT,
    profile_image_url TEXT,
    bio TEXT,
    
    -- Documentation
    election_protocol_url TEXT, -- Generalforsamlingsprotokoll
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0, -- For sorting
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(organization_id, member_id, position_type, term_start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_board_positions_org ON board_positions(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_board_positions_member ON board_positions(member_id);

-- Enable RLS
ALTER TABLE board_positions ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Active board positions are visible to everyone
DROP POLICY IF EXISTS "Active board positions are visible to everyone" ON board_positions;
CREATE POLICY "Active board positions are visible to everyone" ON board_positions
  FOR SELECT USING (is_active = true);

-- 2. Org members can view all board positions (including inactive)
DROP POLICY IF EXISTS "Org members can view all board positions" ON board_positions;
CREATE POLICY "Org members can view all board positions" ON board_positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE organization_id = board_positions.organization_id
      AND user_id = auth.uid()
    )
  );

-- 3. Org Admins can manage (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Org admins can manage board positions" ON board_positions;
CREATE POLICY "Org admins can manage board positions" ON board_positions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE organization_id = board_positions.organization_id
      AND user_id = auth.uid()
      AND role IN ('org_admin', 'superadmin')
    )
  );
