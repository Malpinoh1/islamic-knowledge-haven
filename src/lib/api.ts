import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface DbBook {
  id: string;
  title: string;
  title_ar: string;
  author: string;
  author_ar: string;
  category_id: string | null;
  author_id: string | null;
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
  authors?: { id: string; name: string; name_ar: string } | null;
}

export interface DbCategory {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  created_at: string;
}

export interface DbAuthor {
  id: string;
  name: string;
  name_ar: string;
  bio: string;
  bio_ar: string;
  photo_url: string | null;
  created_at: string;
}

export interface DbBookRequest {
  id: string;
  book_title: string;
  author_name: string;
  requester_name: string;
  requester_email: string;
  notes: string;
  status: string;
  created_at: string;
}

export const useBooks = (options?: { category?: string; search?: string; featured?: boolean; limit?: number; authorId?: string }) => {
  return useQuery({
    queryKey: ['books', options],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*, categories(id, name, name_ar, icon), authors(id, name, name_ar)')
        .order('created_at', { ascending: false });

      if (options?.category) {
        const { data: cat } = await supabase.from('categories').select('id').eq('name', options.category).single();
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (options?.authorId) query = query.eq('author_id', options.authorId);
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
        .select('*, categories(id, name, name_ar, icon), authors(id, name, name_ar)')
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

export const useAuthors = () => {
  return useQuery({
    queryKey: ['authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbAuthor[];
    },
  });
};

export const useAuthor = (id: string) => {
  return useQuery({
    queryKey: ['author', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DbAuthor;
    },
    enabled: !!id,
  });
};

export const useBookRequests = () => {
  return useQuery({
    queryKey: ['book_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbBookRequest[];
    },
  });
};

export const useAdminActivityLog = () => {
  return useQuery({
    queryKey: ['admin_activity_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });
};

export const incrementDownload = async (bookId: string) => {
  await supabase.rpc('increment_download_count', { book_id: bookId });
};

export const submitBookRequest = async (request: {
  book_title: string;
  author_name: string;
  requester_name: string;
  requester_email: string;
  notes: string;
}) => {
  const { error } = await supabase.from('book_requests').insert(request);
  if (error) throw error;
};

export const logAdminActivity = async (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('admin_activity_log').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || {},
  });
};
