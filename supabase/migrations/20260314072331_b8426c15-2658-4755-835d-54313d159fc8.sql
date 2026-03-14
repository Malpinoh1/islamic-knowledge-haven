
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete book covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can read book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete book files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read book files" ON storage.objects;

-- Allow admins to upload to book-covers
CREATE POLICY "Admins can upload book covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-covers' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update book covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-covers' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete book covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-covers' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Public can read book covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-files' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update book files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-files' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete book files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-files' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Public can read book files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-files');
