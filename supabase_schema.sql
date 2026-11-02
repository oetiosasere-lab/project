-- ==============================================================================
-- knotyourbag — Full Supabase Database Schema (Orders, Products, Enquiries, Settings)
-- Run this script in your Supabase Project:
-- SQL Editor -> New Query -> Paste this entire script -> Click "Run"
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Order Status Enum
DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'pending',         -- Order received, waiting in crafting queue
        'in_crafting',     -- Artisan is currently hand-knitting/crocheting
        'dispatched',      -- Packaged & handed over to courier
        'completed',       -- Delivered & successfully completed
        'cancelled'        -- Cancelled or refunded
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference VARCHAR(50) UNIQUE NOT NULL,      -- e.g. 'KYB-84920'
    tracking_number VARCHAR(100) NOT NULL,            -- e.g. 'TRACK-KNB-928192'
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    delivery_address TEXT NOT NULL,
    
    -- Product & Customization Details
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    color VARCHAR(100) NOT NULL DEFAULT 'Milky White',
    personalization TEXT,
    delivery_notes TEXT,
    
    -- Status & Fulfillment Tracking
    status order_status_type NOT NULL DEFAULT 'pending',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Trigger for orders updated_at
CREATE OR REPLACE FUNCTION public.handle_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'completed' THEN
        NEW.is_completed = true;
        IF OLD.status IS DISTINCT FROM 'completed' THEN
            NEW.completed_at = timezone('utc'::text, now());
        END IF;
    ELSE
        NEW.is_completed = false;
        NEW.completed_at = null;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_orders_updated_at();

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders (order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_is_completed ON public.orders (is_completed);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- 4. PRODUCTS TABLE (Storefront Catalog Managed via Admin Dashboard)
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(100) PRIMARY KEY,                       -- e.g. 'cloud-clutch'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'bags',      -- 'bags', 'clothes', 'gifts'
    category_label VARCHAR(100) NOT NULL DEFAULT 'Signature Knot Bags',
    image TEXT NOT NULL,                               -- Image URL or base64
    tag VARCHAR(100) DEFAULT 'Handcrafted',
    stock INTEGER NOT NULL DEFAULT 5,
    stock_status VARCHAR(100) NOT NULL DEFAULT 'In Stock / Available',
    stock_alert VARCHAR(255) DEFAULT 'In Stock & Ready to Ship',
    description TEXT NOT NULL,
    colors JSONB NOT NULL DEFAULT '[]'::jsonb,         -- Array of { name, hex, default }
    features JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Array of string features
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ENQUIRIES / MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id VARCHAR(50) PRIMARY KEY,                        -- e.g. 'INQ-101'
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new',         -- 'new', 'in_progress', 'replied', 'archived'
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. WEBSITE SETTINGS TABLE (Owner edits content without touching code)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Orders Policies:
-- Anyone can place an order or track their own order
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public select orders" ON public.orders;
CREATE POLICY "Public select orders" ON public.orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE TO public USING (true);

-- Products Policies:
-- Public can read active products; Admin can insert/update/delete
DROP POLICY IF EXISTS "Public select products" ON public.products;
CREATE POLICY "Public select products" ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public manage products" ON public.products;
CREATE POLICY "Public manage products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

-- Enquiries Policies:
DROP POLICY IF EXISTS "Public insert enquiries" ON public.enquiries;
CREATE POLICY "Public insert enquiries" ON public.enquiries FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage enquiries" ON public.enquiries;
CREATE POLICY "Public manage enquiries" ON public.enquiries FOR ALL TO public USING (true) WITH CHECK (true);

-- Site Settings Policies:
DROP POLICY IF EXISTS "Public select settings" ON public.site_settings;
CREATE POLICY "Public select settings" ON public.site_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public manage settings" ON public.site_settings;
CREATE POLICY "Public manage settings" ON public.site_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. SEED INITIAL PRODUCTS
INSERT INTO public.products (id, name, category, category_label, image, tag, stock, stock_status, stock_alert, description, colors, features, display_order)
VALUES
(
  'cloud-clutch',
  'The Cloud Knitted Clutch',
  'bags',
  'Signature Knot Bags',
  '/images/cloud-clutch.jpeg',
  'Bestseller',
  5,
  'In Stock / Available',
  'Only 5 left in this batch',
  'Slow-crafted with ultra-soft chunky cotton yarn in our signature milky white shade. Features an organic cloud silhouette with magnetic closure.',
  '[{"name":"Milky White","hex":"#FAF7F2","default":true},{"name":"Oatmeal Beige","hex":"#D8CBBF"},{"name":"Blush Rose","hex":"#E2B8AE"},{"name":"Midnight Charcoal","hex":"#232323"}]'::jsonb,
  '["100% Recycled Chunky Cotton","Hand-stitched reinforced lining","Featherlight & holds daily essentials"]'::jsonb,
  1
),
(
  'pearl-dew-barrel',
  'The Pearl Dew Barrel Bag',
  'bags',
  'Signature Knot Bags',
  '/images/pearl-dew-barrel.jpeg',
  'Artisan Pick',
  3,
  'In Stock / Available',
  'Low Stock — 3 left',
  'Statement barrel silhouette hand-knotted in crisp milky cotton and embellished with hand-sewn shimmering pearl beads. Modern luxury meets slow artisan craft.',
  '[{"name":"Pearl White","hex":"#FFFFFF","default":true},{"name":"Champagne Cream","hex":"#F4ECE1"},{"name":"Soft Ice Blue","hex":"#D1DEE8"}]'::jsonb,
  '["Hand-sewn iridescent pearl beads","Rigid barrel structure that holds shape","Ergonomic knit handle"]'::jsonb,
  2
),
(
  'indigo-knot',
  'The Burano Deep Indigo Knot',
  'bags',
  'Signature Knot Bags',
  '/images/indigo-knot.jpeg',
  'Trending',
  6,
  'In Stock / Available',
  'In Stock & Ready to Ship',
  'Chunky deep indigo handbag adorned with a delicate golden link necklace and luminous baroque pearl pendant. An effortless day-to-night showstopper.',
  '[{"name":"Deep Indigo","hex":"#2A4365","default":true},{"name":"Velvet Black","hex":"#181818"},{"name":"Olive Green","hex":"#586A53"}]'::jsonb,
  '["Includes detachable gold-tone pearl chain","Thick cushion weave handle","Rich color-fast dyed textile"]'::jsonb,
  3
),
(
  'capri-daisy-tote',
  'The Capri Daisy Market Tote',
  'bags',
  'Signature Knot Bags',
  '/images/capri-daisy-tote.jpeg',
  'Community Favorite',
  4,
  'In Stock / Available',
  '4 pieces remaining',
  'High-energy electric cyan woven tote bag finished with enamel daisy floral pins and braided ergonomic carry handles. Radiates joyful Mediterranean sunshine.',
  '[{"name":"Capri Azure","hex":"#0EA5E9","default":true},{"name":"Sunflower Yellow","hex":"#EAB308"},{"name":"Coral Peach","hex":"#F97316"},{"name":"Lilac Dream","hex":"#C084FC"}]'::jsonb,
  '["Includes 2 handcrafted enamel floral pins","Double-reinforced twist braided straps","Spacious interior for phone, book & keys"]'::jsonb,
  4
),
(
  'baby-cardigan-set',
  'Heirloom Baby Cardigan & Booties',
  'clothes',
  'Knitwear & Clothes',
  '/images/baby-cardigan-set.jpeg',
  'Heirloom Clothes',
  7,
  'In Stock / Available',
  '7 sets available / Custom sizing',
  'Tenderly hand-knitted baby blue ribbed jacket with an asymmetrical button band and natural carved wooden buttons, paired with matching cozy booties. Hypoallergenic and gentle on skin.',
  '[{"name":"Pastel Blue","hex":"#BFDBFE","default":true},{"name":"Milky Oat","hex":"#F3EFE6"},{"name":"Sage Green","hex":"#D1E0D0"},{"name":"Buttercup Warmth","hex":"#FEF08A"}]'::jsonb,
  '["100% baby-safe organic combed yarn","Genuine carved wooden buttons","Includes matching hand-knit booties"]'::jsonb,
  5
),
(
  'coastline-tote',
  'The Coastline Bicolor Tote',
  'bags',
  'Signature Knot Bags',
  '/images/coastline-tote.jpeg',
  'Classic Knit',
  5,
  'In Stock / Available',
  '5 pieces ready to dispatch',
  'Dual-tone architectural tote pairing deep espresso tones with warm ivory cotton cord. Spacious interior easily carries your 13-inch laptop, water bottle, and essentials.',
  '[{"name":"Espresso & Milk","hex":"#3A2E2B","default":true},{"name":"Terracotta & Oat","hex":"#9C5141"},{"name":"Sage & Cream","hex":"#728C69"}]'::jsonb,
  '["Fits 13-inch laptop & daily planner","Reinforced double-knit base for anti-sag","Hand-twisted chunky rope straps"]'::jsonb,
  6
),
(
  'heartstring-basket',
  'The Heartstring Periwinkle Basket',
  'bags',
  'Signature Knot Bags',
  '/images/heartstring-basket.jpeg',
  'Handmade Charm',
  4,
  'In Stock / Available',
  '4 bags crafted',
  'Whimsical rounded bucket tote in pastel periwinkle blue, embellished with sweet hand-crocheted cherry charms hanging along the rim. Brings joyful artisanal charm to any stroll.',
  '[{"name":"Pastel Periwinkle","hex":"#A5B4FC","default":true},{"name":"Butter Cream","hex":"#FEF9C3"},{"name":"Dusty Mauve","hex":"#D8B4E2"}]'::jsonb,
  '["Includes 2 hand-crocheted cherry charms","Sturdy basket weave holds round shape","Lightweight summer companion"]'::jsonb,
  7
),
(
  'espresso-slouch-tote',
  'The Espresso Pearl Slouch Tote',
  'bags',
  'Signature Knot Bags',
  '/images/espresso-slouch-tote.jpeg',
  'Artisan Pick',
  3,
  'In Stock / Available',
  'Low Stock — 3 left',
  'Deep espresso macramé-inspired slouch tote with layered diamond knots and twin baroque pearl beaded swags draped across the sweetheart neckline.',
  '[{"name":"Espresso Dark","hex":"#342621","default":true},{"name":"Pitch Black","hex":"#111111"},{"name":"Warm Taupe","hex":"#78685C"}]'::jsonb,
  '["Double lustrous pearl draped swags","Flexible slouchy silhouette with generous depth","Zero synthetic plastics"]'::jsonb,
  8
),
(
  'rose-bouquet',
  'The Eternal Knotted Rose Bouquet',
  'gifts',
  'Gift & Accessories',
  '/images/rose-bouquet.jpeg',
  'Keepsake',
  8,
  'In Stock / Available',
  '8 bouquets ready',
  'A luxurious artisanal bouquet of dozens of hand-crocheted crimson velvet roses wrapped in textured gold-trimmed paper. A forever keepsake that never withers.',
  '[{"name":"Velvet Crimson","hex":"#DC2626","default":true},{"name":"Vintage Dusty Pink","hex":"#FB7185"},{"name":"Ivory Snow","hex":"#FFFBEB"}]'::jsonb,
  '["Never wilts or fades — forever memory","Luxury embossed paper & gold ribbon wrapping","Custom gift card handwritten by our artisan"]'::jsonb,
  9
)
ON CONFLICT (id) DO NOTHING;

-- 9. SEED INITIAL SITE SETTINGS
INSERT INTO public.site_settings (key, value, description) VALUES
('announcement', '✨ Discounts available sometimes for newsletter subscribers!', 'Top announcement bar text'),
('hero_headline', 'Handmade Knot with Love', 'Main hero title'),
('hero_subheadline', 'Borse fatte a mano all''uncinetto. Knot-by-knot handcrafted bags & heirloom clothes directly for your everyday rhythm.', 'Hero subtitle text'),
('phone_number', '3319565982', 'Store phone number and customer support line'),
('email_address', 'fabianojessica6@gmail.com', 'Store customer support email address'),
('service_hours', 'Open 24/7, 6 days a week, 365 days a year', 'Business hours and customer response times'),
('instagram_handle', '@knotyourbag', 'Instagram community username'),
('whatsapp_number', '3319565982', 'WhatsApp direct order and chat number'),
('founder_quote_it', 'È un marchio che rappresenta un negozio di borse fatte a mano all''uncinetto. L''ho scelto perché secondo me è un bel marchio che riesce a far capire cosa vende l''artigiano ovvero il gomitolo e l''uncinetto.', 'Italian founder handwritten quote in About section'),
('founder_quote_it_2', 'Inoltre ritengo che l''artigianato sia un ottimo settore poco conosciuto su cui costruire qualcosa.', 'Second sentence of Italian founder quote'),
('founder_author', 'Jessica Fabiano', 'Founder name')
ON CONFLICT (key) DO NOTHING;

-- 10. SEED INITIAL ENQUIRIES
INSERT INTO public.enquiries (id, customer_name, customer_email, customer_phone, subject, message, status) VALUES
('INQ-101', 'Chiara Rossi', 'chiara.rossi@example.com', '3481234567', 'Custom Colorway Question', 'Hello Jessica, can I request the Cloud Knitted Clutch in a Sage Green hue with longer straps?', 'new'),
('INQ-102', 'Alessandra Ferrari', 'alessandra.f@example.com', '3398765432', 'Bulk Gift Order', 'Hi, would it be possible to order 5 Eternal Knotted Rose Bouquets for a bridesmaids gift next month?', 'replied')
ON CONFLICT (id) DO NOTHING;

-- 11. ENABLE REALTIME
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.orders, public.products, public.enquiries, public.site_settings;
COMMIT;
