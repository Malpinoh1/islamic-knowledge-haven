import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useCategories } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Plus, Pencil, Trash2, BookOpen, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const [books, setBooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [author, setAuthor] = useState('');
  const [authorAr, setAuthorAr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('Arabic');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [pages, setPages] = useState('');
  const [format, setFormat] = useState('PDF');
  const [featured, setFeatured] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('*, categories(name, name_ar)')
      .order('created_at', { ascending: false });
    setBooks(data || []);
  };

  const resetForm = () => {
    setTitle(''); setTitleAr(''); setAuthor(''); setAuthorAr('');
    setCategoryId(''); setLanguage('Arabic'); setDescription('');
    setDescriptionAr(''); setPages(''); setFormat('PDF');
    setFeatured(false); setCoverFile(null); setBookFile(null);
    setEditingBook(null); setShowForm(false);
  };

  const editBook = (book: any) => {
    setEditingBook(book);
    setTitle(book.title); setTitleAr(book.title_ar);
    setAuthor(book.author); setAuthorAr(book.author_ar);
    setCategoryId(book.category_id || ''); setLanguage(book.language);
    setDescription(book.description); setDescriptionAr(book.description_ar);
    setPages(String(book.pages || '')); setFormat(book.format);
    setFeatured(book.featured);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let coverUrl = editingBook?.cover_image || null;
      let fileUrl = editingBook?.file_url || null;
      let fileSize = editingBook?.file_size || null;

      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('book-covers').upload(path, coverFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      if (bookFile) {
        const ext = bookFile.name.split('.').pop();
        const path = `${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('book-files').upload(path, bookFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('book-files').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileSize = `${(bookFile.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const bookData = {
        title, title_ar: titleAr, author, author_ar: authorAr,
        category_id: categoryId || null, language, description,
        description_ar: descriptionAr, pages: pages ? parseInt(pages) : 0,
        format, featured, cover_image: coverUrl, file_url: fileUrl,
        file_size: fileSize,
      };

      if (editingBook) {
        const { error } = await supabase.from('books').update(bookData).eq('id', editingBook.id);
        if (error) throw error;
        toast.success('Book updated successfully');
      } else {
        const { error } = await supabase.from('books').insert(bookData);
        if (error) throw error;
        toast.success('Book added successfully');
      }

      resetForm();
      fetchBooks();
      queryClient.invalidateQueries({ queryKey: ['books'] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Book deleted');
      fetchBooks();
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;

  const totalDownloads = books.reduce((sum, b) => sum + (b.download_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground font-display">Admin Dashboard</h2>
          <div className="flex gap-2">
            <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
              <Plus className="me-1 h-4 w-4" /> Add Book
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="me-1 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Books', value: books.length, icon: BookOpen },
            { label: 'Total Downloads', value: totalDownloads.toLocaleString(), icon: BarChart3 },
            { label: 'Categories', value: categories?.length || 0, icon: BookOpen },
            { label: 'Featured', value: books.filter(b => b.featured).length, icon: BookOpen },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Book Form */}
        {showForm && (
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              {editingBook ? 'Edit Book' : 'Add New Book'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Title (English)</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
                <div><Label>Title (Arabic)</Label><Input value={titleAr} onChange={e => setTitleAr(e.target.value)} required dir="rtl" /></div>
                <div><Label>Author (English)</Label><Input value={author} onChange={e => setAuthor(e.target.value)} required /></div>
                <div><Label>Author (Arabic)</Label><Input value={authorAr} onChange={e => setAuthorAr(e.target.value)} required dir="rtl" /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Pages</Label><Input type="number" value={pages} onChange={e => setPages(e.target.value)} /></div>
                <div>
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="EPUB">EPUB</SelectItem>
                      <SelectItem value="PDF, EPUB">PDF & EPUB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div><Label>Description (English)</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div><Label>Description (Arabic)</Label><Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} dir="rtl" /></div>

              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Cover Image</Label><Input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} /></div>
                <div><Label>Book File (PDF/EPUB)</Label><Input type="file" accept=".pdf,.epub" onChange={e => setBookFile(e.target.files?.[0] || null)} /></div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={featured} onCheckedChange={setFeatured} />
                <Label>Featured Book</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Books Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">Author</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">Downloads</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{book.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{book.author}</td>
                  <td className="px-4 py-3 text-muted-foreground">{book.categories?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{book.download_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => editBook(book)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteBook(book.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No books yet. Add your first book!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
