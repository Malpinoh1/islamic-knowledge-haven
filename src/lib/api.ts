import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface DbBook {
  id: string;
  title: string;
  title_ar: string;
  author: string;
  author_ar: string;
  category_id: string | null;
  language: string;
  description: string;
  description_ar: string;
  cover_image: string | null;
  file_url: string | null;
  file_size: string | null;
  pages: number | null;
  format: string;
  download_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; name_ar: string; icon: string } | null;
}

export interface DbCategory {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  created_at: string;
}

export const useBooks = (options?: { category?: string; search?: string; featured?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: ['books', options],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*, categories(id, name, name_ar, icon)')
        .order('created_at', { ascending: false });

      if (options?.category) {
        // Look up category id by name
        const { data: cat } = await supabase.from('categories').select('id').eq('name', options.category).single();
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (options?.featured) query = query.eq('featured', true);
      if (options?.limit) query = query.limit(options.limit);
      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,title_ar.ilike.%${options.search}%,author.ilike.%${options.search}%,author_ar.ilike.%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DbBook[];
    },
  });
};

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(id, name, name_ar, icon)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DbBook;
    },
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbCategory[];
    },
  });
};

export const incrementDownload = async (bookId: string) => {
  await supabase.rpc('increment_download_count', { book_id: bookId });
};
