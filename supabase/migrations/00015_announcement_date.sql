-- Store each scholarship's official result announcement time (Jakarta/WIB).
ALTER TABLE public.scholarship_periods
  ADD COLUMN IF NOT EXISTS tgl_pengumuman TIMESTAMPTZ;
