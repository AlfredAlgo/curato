-- The app uses community_review, in_pool and shortlisted, but the original
-- CHECK constraint only allowed pending / in_review / approved / rejected.
ALTER TABLE public.tracks DROP CONSTRAINT IF EXISTS tracks_status_check;

ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_status_check
  CHECK (status IN (
    'pending',
    'community_review',
    'in_review',
    'in_pool',
    'shortlisted',
    'approved',
    'rejected'
  ));
