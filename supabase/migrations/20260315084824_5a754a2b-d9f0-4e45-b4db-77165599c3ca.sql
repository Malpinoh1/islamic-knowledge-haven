-- Insert distinct authors from books that don't already exist in the authors table
INSERT INTO public.authors (name, name_ar, bio, bio_ar)
SELECT DISTINCT b.author, b.author_ar, '', ''
FROM public.books b
WHERE b.author_id IS NULL
  AND b.author IS NOT NULL
  AND b.author != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.authors a WHERE a.name = b.author
)
ON CONFLICT DO NOTHING;

-- Now link existing books to their newly created author records
UPDATE public.books b
SET author_id = a.id
FROM public.authors a
WHERE b.author = a.name
  AND b.author_id IS NULL;