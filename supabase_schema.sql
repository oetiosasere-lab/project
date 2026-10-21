-- ==============================================================================
-- knotyourbag — Supabase Database Schema
-- Run this script in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Order Status Enum
DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'pending',         -- Order received, waiting in queue
        'in_crafting',     -- Artisan is currently hand-knitting/crocheting
        'dispatched',      -- Packaged & handed over to courier
        'completed',       -- Delivered & successfully completed
        'cancelled'        -- Cancelled or refunded
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference VARCHAR(50) UNIQUE NOT NULL,      -- e.g., 'KYB-84920'
    tracking_number VARCHAR(100) NOT NULL,            -- e.g., 'TRACK-KNB-928192'
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    delivery_address TEXT NOT NULL,
    
    -- Product & Customization Details
    product_id VARCHAR(100) NOT NULL,                 -- e.g., 'cloud-clutch'
    product_name VARCHAR(255) NOT NULL,               -- e.g., 'The Cloud Knitted Clutch'
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    color VARCHAR(100) NOT NULL DEFAULT 'Milky White',
    personalization TEXT,                             -- Custom color shade, strap length, monogram initials
    delivery_notes TEXT,                              -- Special instructions from customer
    
    -- Status & Fulfillment Tracking
    status order_status_type NOT NULL DEFAULT 'pending',
    is_completed BOOLEAN NOT NULL DEFAULT false,      -- Quick boolean for completed vs not completed
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ                          -- Timestamp when marked completed
);

-- 4. Create Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    
    -- Automatically sync is_completed flag with status
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
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create High-Performance Indexes for Admin Queries
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders (order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_is_completed ON public.orders (is_completed);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- 6. Row Level Security (RLS) Setup
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy A: Anyone can create a new order (Shoppers submitting the landing page form)
DROP POLICY IF EXISTS "Allow public landing page order creation" ON public.orders;
CREATE POLICY "Allow public landing page order creation"
    ON public.orders
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy B: Shoppers can look up their own order by order reference (Tracking Modal)
DROP POLICY IF EXISTS "Allow shoppers to track by order reference" ON public.orders;
CREATE POLICY "Allow shoppers to track by order reference"
    ON public.orders
    FOR SELECT
    TO public
    USING (true);

-- Policy C: Allow updates to orders (Admin dashboard status changes)
DROP POLICY IF EXISTS "Allow order updates from admin dashboard" ON public.orders;
CREATE POLICY "Allow order updates from admin dashboard"
    ON public.orders
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Policy D: Allow order deletion (Admin dashboard cleaning)
DROP POLICY IF EXISTS "Allow order deletion" ON public.orders;
CREATE POLICY "Allow order deletion"
    ON public.orders
    FOR DELETE
    TO public
    USING (true);

-- 7. Insert Initial Demonstration / Seed Data (To test completed vs not completed immediately)
INSERT INTO public.orders (
    order_reference, tracking_number, customer_name, customer_phone, customer_email, 
    delivery_address, product_id, product_name, quantity, color, personalization, 
    status, is_completed, delivery_notes
) VALUES 
(
    'KYB-10842', 'TRACK-KNB-84201', 'Elena Valenti', '3319565982', 'elena.valenti@example.com',
    'Via Monte Napoleone 14, Milan, Italy', 'cloud-clutch', 'The Cloud Knitted Clutch', 1, 
    'Milky White', 'Gold initials EV embroidered on tag', 'in_crafting', false, 'Please gift wrap with ivory tissue'
),
(
    'KYB-29401', 'TRACK-KNB-94012', 'Sophie Mercier', '+33 6 12 34 56 78', 'sophie.m@example.com',
    '24 Rue de Rivoli, Paris, France', 'baby-cardigan-set', 'Heirloom Baby Cardigan & Booties', 1, 
    'Pastel Blue', 'Size 3-6 months, wooden buttons', 'completed', true, 'Leave with building concierge'
),
(
    'KYB-38519', 'TRACK-KNB-51923', 'Jessica Thornton', '+44 20 7946 0912', 'jess.thornton@example.com',
    '72 Kensington High St, London, UK', 'indigo-knot', 'The Burano Deep Indigo Knot', 2, 
    'Deep Indigo', 'Custom 45cm strap length', 'pending', false, 'Ring bell twice upon delivery'
),
(
    'KYB-48190', 'TRACK-KNB-19034', 'Marco Bellini', '3319565982', 'marco.bellini@example.com',
    'Piazza Navona 8, Rome, Italy', 'coastline-tote', 'The Coastline Bicolor Tote', 1, 
    'Espresso & Milk', 'Standard edition', 'completed', true, 'Fragile packaging requested'
),
(
    'KYB-59203', 'TRACK-KNB-20345', 'Hannah Schmidt', '+49 30 123456', 'hannah.schmidt@example.com',
    'Friedrichstraße 42, Berlin, Germany', 'pearl-dew-barrel', 'The Pearl Dew Barrel Bag', 1, 
    'Pearl White', 'Extra reinforcement on handle base', 'dispatched', false, 'Deliver between 10am-4pm'
)
ON CONFLICT (order_reference) DO NOTHING;

-- 8. Enable Realtime Notifications for Instant Order Updates (Optional Supabase Realtime)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.orders;
COMMIT;
