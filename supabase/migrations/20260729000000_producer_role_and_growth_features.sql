-- Adds: Producer role, Follow, Save/Bookmark, Shop marketplace (curator picks,
-- producer listings, merch), and Opportunities (sponsorships, brand
-- partnerships, events, affiliate/referral program).
-- Run this in the SQL Editor of the project that already has supabase/setup.sql applied.

-- =========================================================================
-- 1. Producer role
-- =========================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producer';

-- =========================================================================
-- 2. Follow
-- =========================================================================

CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  followed_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_followed ON public.follows(followed_id);

-- =========================================================================
-- 3. Save / bookmark tracks
-- =========================================================================

CREATE TABLE public.track_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

ALTER TABLE public.track_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saves" ON public.track_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save tracks" ON public.track_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their saves" ON public.track_saves FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_track_saves_user ON public.track_saves(user_id);

-- =========================================================================
-- 4. Shop marketplace: sound packs, merch, producer listings, curator picks
-- =========================================================================

CREATE TYPE public.shop_category AS ENUM ('sound_pack', 'plugin', 'merch', 'producer_item');
CREATE TYPE public.seller_type AS ENUM ('official', 'curator', 'producer');

CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID,
  seller_type public.seller_type NOT NULL DEFAULT 'official',
  category public.shop_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  image_url TEXT,
  is_curator_pick BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.shop_products FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers manage their own products" ON public.shop_products FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Curators and admins manage all products" ON public.shop_products FOR ALL USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);

CREATE TRIGGER update_shop_products_updated_at
BEFORE UPDATE ON public.shop_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_shop_products_category ON public.shop_products(category) WHERE is_active = true;
CREATE INDEX idx_shop_products_seller ON public.shop_products(seller_id);

-- Seed the existing hardcoded sound packs + XLR8 plugin so the shop is fully DB-driven
INSERT INTO public.shop_products (seller_type, category, title, description, price_cents, is_active) VALUES
  ('official', 'sound_pack', 'Producer Essentials Vol. 1', 'A versatile starter pack spanning hip-hop, Afrobeats, house, and R&B. Drums, bass lines, melodic loops, and vocal chops ready for any genre.', 2900, true),
  ('official', 'sound_pack', 'Universal Drum Kit', 'Hard-hitting drums designed for every genre. Kicks, snares, hi-hats, and percussion crafted for hip-hop, pop, electronic, and beyond.', 1900, true),
  ('official', 'sound_pack', 'Curato Producer Pack', 'The official entry pack into the Curato ecosystem. Multi-genre samples, project templates, and tools to start creating immediately.', 4900, true),
  ('official', 'plugin', 'XLR8 Plugin - Full License', 'XLR8 Signature Plugin - Compress. Plate. Delay. Accelerated.', 9900, true);

-- =========================================================================
-- 5. Opportunities: sponsorships, brand partnerships, events, affiliate program
-- =========================================================================

CREATE TYPE public.opportunity_type AS ENUM ('sponsorship', 'brand_partnership', 'event', 'affiliate');

CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.opportunity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT,
  reward_details TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active opportunities" ON public.opportunities FOR SELECT USING (is_active = true);
CREATE POLICY "Curators and admins manage opportunities" ON public.opportunities FOR ALL USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);

CREATE TABLE public.opportunity_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, user_id)
);

ALTER TABLE public.opportunity_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interests" ON public.opportunity_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Curators and admins view all interests" ON public.opportunity_interests FOR SELECT USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users can express interest" ON public.opportunity_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can withdraw interest" ON public.opportunity_interests FOR DELETE USING (auth.uid() = user_id);

-- Referral code so the affiliate program has something concrete to hand out
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8);

-- A few seed opportunities so the page isn't empty on launch
INSERT INTO public.opportunities (type, title, description, company_name, reward_details, is_active) VALUES
  ('affiliate', 'Curato Referral Program', 'Refer a label or brand that signs with an artist you introduced and earn a share of the deal.', 'Curato', '5% referral fee on the resulting label agreement', true);

-- =========================================================================
-- 6. handle_new_user: recognize producer at signup
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_email TEXT;
  signup_role TEXT;
  assigned_role public.app_role;
BEGIN
  user_email := NEW.email;
  signup_role := NEW.raw_user_meta_data->>'signup_role';

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  IF user_email = 'credo.mandlhazi@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF signup_role = 'listener' THEN
    assigned_role := 'listener';
  ELSIF signup_role = 'producer' THEN
    assigned_role := 'producer';
  ELSE
    assigned_role := 'artist';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  RETURN NEW;
END;
$$;
