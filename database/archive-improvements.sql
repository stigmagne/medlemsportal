-- Add category column to documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Generelt';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Update RLS if needed (Recipients already covered by existing policies)
