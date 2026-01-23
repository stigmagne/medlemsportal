-- Add Categories to Resources
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Annet';

-- Optional: Create index for faster filtering eventually
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
