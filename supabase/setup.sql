-- Curato: consolidated schema for a fresh Supabase project
-- Paste this whole file into the SQL Editor of the new project and run it once.
-- Reconstructed from supabase/migrations/*.sql plus the live schema captured in
-- src/integrations/supabase/types.ts (which included tables/columns/functions
-- that were never captured by a migration file).
--
-- Fix included: tracks.status now allows every status value the app actually
-- uses (pending, in_review, community_review, shortlisted, in_pool, approved,
-- rejected) -- the original migration only allowed 4 of these 7.

-- =========================================================================
-- 1. Roles
-- =========================================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'super_curator', 'curator', 'artist', 'listener');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'artist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY created_at LIMIT 1
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Curators can view all roles" ON public.user_roles
FOR SELECT USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);

-- =========================================================================
-- 2. Profiles
-- =========================================================================

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  stage_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  id_number TEXT,
  contact_number TEXT,
  residential_address TEXT,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================================
-- 3. Shared trigger helpers
-- =========================================================================

CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.handle_new_user()
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

  -- NOTE: update this email (or remove the branch) to whoever should be admin
  -- on the new project -- it was hardcoded to the previous project owner.
  IF user_email = 'credo.mandlhazi@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF signup_role = 'listener' THEN
    assigned_role := 'listener';
  ELSE
    assigned_role := 'artist';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 4. Tracks, pools, feedback, likes
-- =========================================================================

CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  file_url TEXT,
  external_link TEXT,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('upload', 'link')),
  platform TEXT,
  duration_seconds INTEGER,
  genre TEXT,
  snippet_url TEXT,
  -- Fixed: widened to cover every status the app reads/writes.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_review', 'community_review', 'shortlisted', 'in_pool', 'approved', 'rejected')
  ),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.test_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  curator_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_tracks INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pool_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.test_pools(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  position INTEGER,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pool_id, track_id)
);

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  production_quality INTEGER CHECK (production_quality >= 1 AND production_quality <= 10),
  originality INTEGER CHECK (originality >= 1 AND originality <= 10),
  commercial_potential INTEGER CHECK (commercial_potential >= 1 AND commercial_potential <= 10),
  notes TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.track_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(track_id, user_id)
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all tracks" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "Users can insert their own tracks" ON public.tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tracks" ON public.tracks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Curators can update any track status" ON public.tracks FOR UPDATE USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view active pools" ON public.test_pools FOR SELECT USING (is_active = true);
CREATE POLICY "Curators can manage pools" ON public.test_pools FOR ALL USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view pool tracks" ON public.pool_tracks FOR SELECT USING (true);
CREATE POLICY "Curators can manage pool tracks" ON public.pool_tracks FOR ALL USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view public feedback" ON public.feedback FOR SELECT USING (is_public = true);
CREATE POLICY "Track owners can view their feedback" ON public.feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tracks WHERE tracks.id = feedback.track_id AND tracks.user_id = auth.uid())
);
CREATE POLICY "Curators can manage feedback" ON public.feedback FOR ALL USING (
  has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view likes" ON public.track_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like tracks" ON public.track_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON public.track_likes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_test_pools_updated_at BEFORE UPDATE ON public.test_pools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 5. Notifications
-- =========================================================================

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
-- Final policy state after the two follow-up migrations that tightened this:
CREATE POLICY "Users and system can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

CREATE FUNCTION public.notify_track_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'community_review' THEN status_label := 'Community Review';
      WHEN 'in_review' THEN status_label := 'Curator Review';
      WHEN 'shortlisted' THEN status_label := 'Shortlisted';
      WHEN 'in_pool' THEN status_label := 'Test Pool';
      WHEN 'approved' THEN status_label := 'Validated';
      WHEN 'rejected' THEN status_label := 'Not Selected';
      ELSE status_label := NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'track_status',
      'Track Status Updated',
      format('Your track "%s" has been moved to: %s', NEW.title, status_label),
      jsonb_build_object('track_id', NEW.id, 'new_status', NEW.status, 'old_status', OLD.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_track_status_change
AFTER UPDATE ON public.tracks
FOR EACH ROW EXECUTE FUNCTION public.notify_track_status_change();

-- =========================================================================
-- 6. Comments, shares, engagement, chat
-- =========================================================================

CREATE TABLE public.track_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.track_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.track_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.track_comments FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.track_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.track_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shares" ON public.track_shares FOR SELECT USING (true);
CREATE POLICY "Authenticated users can share" ON public.track_shares FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE FUNCTION public.get_track_engagement(p_track_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COUNT(*) FROM public.track_likes WHERE track_id = p_track_id) * 1 +
    (SELECT COUNT(*) FROM public.track_comments WHERE track_id = p_track_id) * 2 +
    (SELECT COUNT(*) FROM public.track_shares WHERE track_id = p_track_id) * 3,
    0
  )::INTEGER
$$;

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can send chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.track_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.track_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- =========================================================================
-- 7. Storage buckets
-- =========================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/aiff', 'audio/x-aiff', 'audio/flac']
);

CREATE POLICY "Authenticated users can upload tracks" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'tracks' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can view their own tracks" ON storage.objects FOR SELECT USING (
  bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Curators can view all tracks" ON storage.objects FOR SELECT USING (
  bucket_id = 'tracks' AND (
    has_role(auth.uid(), 'curator') OR has_role(auth.uid(), 'super_curator') OR has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "Users can delete their own tracks" ON storage.objects FOR DELETE USING (
  bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
