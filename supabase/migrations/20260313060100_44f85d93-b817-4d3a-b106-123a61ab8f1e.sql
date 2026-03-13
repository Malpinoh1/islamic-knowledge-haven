
-- Update Seerah category to Sufism
UPDATE public.categories SET name = 'Sufism', name_ar = 'التصوف', icon = '🕌' WHERE name = 'Seerah';

-- Create authors table
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL,
  bio text NOT NULL DEFAULT '',
  bio_ar text NOT NULL DEFAULT '',
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors are viewable by everyone" ON public.authors FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert authors" ON public.authors FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update authors" ON public.authors FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete authors" ON public.authors FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add author_id to books
ALTER TABLE public.books ADD COLUMN author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL;

-- Create book_requests table
CREATE TABLE public.book_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_title text NOT NULL,
  author_name text NOT NULL DEFAULT '',
  requester_name text NOT NULL DEFAULT '',
  requester_email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit book requests" ON public.book_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view book requests" ON public.book_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update book requests" ON public.book_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete book requests" ON public.book_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Create admin_activity_log table
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert activity log" ON public.admin_activity_log FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
