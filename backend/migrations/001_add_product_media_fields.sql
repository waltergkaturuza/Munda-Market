-- Migration: Add product media and marketing fields
-- Date: 2025-11-25
-- Description: Adds image URLs, descriptions, and marketing content to crops, lots, and listings

-- ============================================================================
-- CROP TABLE ENHANCEMENTS
-- ============================================================================

-- Add media and marketing fields to crops table
ALTER TABLE crops ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE crops ADD COLUMN IF NOT EXISTS gallery_images TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS short_description VARCHAR(500);

-- Add nutritional and benefits information
ALTER TABLE crops ADD COLUMN IF NOT EXISTS nutritional_info TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS health_benefits TEXT;

-- Add storage and handling tips
ALTER TABLE crops ADD COLUMN IF NOT EXISTS storage_tips TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS preparation_tips TEXT;

-- ============================================================================
-- LOT TABLE ENHANCEMENTS
-- ============================================================================

-- Add thumbnail and marketing fields to lots table
ALTER TABLE lots ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE lots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS highlights TEXT;

-- ============================================================================
-- LISTING TABLE ENHANCEMENTS
-- ============================================================================

-- Add marketing content to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS selling_points TEXT;

-- Add display media
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_image VARCHAR(500);

-- Add promotional flags
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_limited_supply BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS promotional_badge VARCHAR(50);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_is_new_arrival ON listings(is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_crops_name_active ON crops(name, is_active);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN crops.image_url IS 'Primary product image URL';
COMMENT ON COLUMN crops.gallery_images IS 'JSON array of additional product images';
COMMENT ON COLUMN crops.description IS 'Detailed marketing description of the crop';
COMMENT ON COLUMN crops.short_description IS 'Brief description for listings and cards';

COMMENT ON COLUMN lots.thumbnail_url IS 'Primary thumbnail URL for quick display';
COMMENT ON COLUMN lots.description IS 'Detailed description of this specific lot';
COMMENT ON COLUMN lots.highlights IS 'JSON array of key selling points';

COMMENT ON COLUMN listings.title IS 'Custom listing title (overrides crop name)';
COMMENT ON COLUMN listings.description IS 'Marketing description for this listing';
COMMENT ON COLUMN listings.selling_points IS 'JSON array of key selling points';
COMMENT ON COLUMN listings.featured_image IS 'Custom featured image URL for the listing';

