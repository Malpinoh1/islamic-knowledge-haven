import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const baseUrl = 'https://daawatulhaqq.com.ng';

  const { data: books } = await supabase.from('books').select('id, updated_at').order('updated_at', { ascending: false });
  const { data: categories } = await supabase.from('categories').select('name, created_at');
  const { data: authors } = await supabase.from('authors').select('id, created_at');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>
  <url><loc>${baseUrl}/books</loc><priority>0.9</priority></url>
  <url><loc>${baseUrl}/categories</loc><priority>0.8</priority></url>
  <url><loc>${baseUrl}/request-book</loc><priority>0.5</priority></url>`;

  books?.forEach((b) => {
    xml += `\n  <url><loc>${baseUrl}/book/${b.id}</loc><lastmod>${b.updated_at.split('T')[0]}</lastmod><priority>0.7</priority></url>`;
  });

  categories?.forEach((c) => {
    xml += `\n  <url><loc>${baseUrl}/books?category=${encodeURIComponent(c.name)}</loc><priority>0.6</priority></url>`;
  });

  authors?.forEach((a) => {
    xml += `\n  <url><loc>${baseUrl}/author/${a.id}</loc><priority>0.6</priority></url>`;
  });

  xml += '\n</urlset>';

  return new Response(xml, {
    headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
  });
});
