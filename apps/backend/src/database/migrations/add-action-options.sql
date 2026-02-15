-- ============================================================================
-- Migration: Add Action Options to Image Riddles Table
-- ============================================================================
-- Run this SQL to add action_options column to the image_riddles table
-- ============================================================================

-- Add action_options column (JSONB for storing array of action objects)
ALTER TABLE image_riddles 
ADD COLUMN IF NOT EXISTS action_options JSONB DEFAULT NULL;

-- Add use_default_actions flag
ALTER TABLE image_riddles 
ADD COLUMN IF NOT EXISTS use_default_actions BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN image_riddles.action_options IS 'Action options displayed below the question (JSON array of action objects)';
COMMENT ON COLUMN image_riddles.use_default_actions IS 'Whether to use default action options when custom not provided';

-- Create GIN index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_image_riddles_action_options 
ON image_riddles USING GIN (action_options);

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'image_riddles'
AND column_name IN ('action_options', 'use_default_actions')
ORDER BY ordinal_position;
