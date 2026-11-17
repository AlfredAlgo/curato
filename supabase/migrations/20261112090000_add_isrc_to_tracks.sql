-- Add optional ISRC (International Standard Recording Code) to tracks.
-- Stored in compact form (12 chars, uppercase, no hyphens), e.g. ZAABC2400001.
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS isrc TEXT;

ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_isrc_format_check
  CHECK (isrc IS NULL OR isrc ~ '^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$');

CREATE INDEX IF NOT EXISTS idx_tracks_isrc ON public.tracks (isrc) WHERE isrc IS NOT NULL;
