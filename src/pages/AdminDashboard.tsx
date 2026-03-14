import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useCategories, useAuthors, useBookRequests, useAdminActivityLog, logAdminActivity } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Plus, Pencil, Trash2, BookOpen, BarChart3, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';

const ALLOWED_FILE_TYPES = ['application/pdf', 'application/epub+zip'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
type SubmitStage = 'idle' | 'validating' | 'uploading-cover' | 'uploading-book' | 'saving-record' | 'refreshing';

const SUBMIT_STAGE_LABELS: Record<SubmitStage, string> = {
  idle: 'Preparing...',
  validating: 'Validating files...',
  'uploading-cover': 'Uploading cover image...',
  'uploading-book': 'Uploading book file...',
  'saving-record': 'Saving book details...',
  refreshing: 'Refreshing library data...',
};

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: authors } = useAuthors();
  const { data: bookRequests = [] } = useBookRequests();
  const { data: activityLog = [] } = useAdminActivityLog();

  const [books, setBooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<SubmitStage>('idle');
  const [submitProgress, setSubmitProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'books' | 'requests' | 'analytics' | 'activity'>('books');

  // Form state
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [author, setAuthor] = useState('');
  const [authorAr, setAuthorAr] = useState('');
  const [authorId, setAuthorId] = useState('');
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
    if (!authLoading && (!user || !isAdmin)) navigate('/admin/login');
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*, categories(name, name_ar)').order('created_at', { ascending: false });
    setBooks(data || []);
  };

  const resetForm = () => {
    setTitle(''); setTitleAr(''); setAuthor(''); setAuthorAr('');
    setCategoryId(''); setAuthorId(''); setLanguage('Arabic'); setDescription('');
    setDescriptionAr(''); setPages(''); setFormat('PDF');
    setFeatured(false); setCoverFile(null); setBookFile(null);
    setEditingBook(null); setShowForm(false);
    setSubmitStage('idle'); setSubmitProgress(0);
  };

  const editBook = (book: any) => {
    setEditingBook(book);
    setTitle(book.title); setTitleAr(book.title_ar);
    setAuthor(book.author); setAuthorAr(book.author_ar);
    setCategoryId(book.category_id || ''); setAuthorId(book.author_id || '');
    setLanguage(book.language); setDescription(book.description);
    setDescriptionAr(book.description_ar); setPages(String(book.pages || ''));
    setFormat(book.format); setFeatured(book.featured);
    setShowForm(true);
  };

  const validateFile = (file: File, allowedTypes: string[], maxSizeMB: number): string | null => {
    if (!allowedTypes.includes(file.type)) return `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`;
    if (file.size > maxSizeMB * 1024 * 1024) return `File too large. Maximum ${maxSizeMB}MB allowed.`;
    return null;
  };

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  };

  const updateSubmitState = (stage: SubmitStage, progress: number) => {
    setSubmitStage(stage);
    setSubmitProgress(progress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateSubmitState('validating', 10);
    if (coverFile) {
      const err = validateFile(coverFile, ALLOWED_IMAGE_TYPES, 5);
      if (err) { toast.error(err); return; }
    }
    if (bookFile) {
      const err = validateFile(bookFile, ALLOWED_FILE_TYPES, 100);
      if (err) { toast.error(err); return; }
    }

    setSubmitting(true);
    try {
      let coverUrl = editingBook?.cover_image || null;
      let fileUrl = editingBook?.file_url || null;
      let fileSize = editingBook?.file_size || null;

      if (coverFile) {
        updateSubmitState('uploading-cover', 35);
        const ext = coverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await withTimeout(
          supabase.storage.from('book-covers').upload(path, coverFile, { cacheControl: '3600', upsert: false, contentType: coverFile.type }),
          120000,
          'Cover upload is taking too long. Please retry with a smaller image or faster connection.',
        );
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      if (bookFile) {
        updateSubmitState('uploading-book', coverFile ? 60 : 40);
        const ext = bookFile.name.split('.').pop()?.toLowerCase() || 'pdf';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await withTimeout(
          supabase.storage.from('book-files').upload(path, bookFile, { cacheControl: '3600', upsert: false, contentType: bookFile.type }),
          300000,
          'Book upload is taking too long. Please retry with a smaller file or better connection.',
        );
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('book-files').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileSize = `${(bookFile.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      updateSubmitState('saving-record', 90);
      const bookData = {
        title, title_ar: titleAr, author, author_ar: authorAr,
        author_id: (authorId && authorId !== 'none') ? authorId : null,
        category_id: categoryId || null, language, description,
        description_ar: descriptionAr, pages: pages ? parseInt(pages) : 0,
        format, featured, cover_image: coverUrl, file_url: fileUrl, file_size: fileSize,
      };

      if (editingBook) {
        const { error } = await supabase.from('books').update(bookData).eq('id', editingBook.id);
        if (error) throw error;
        await logAdminActivity('update', 'book', editingBook.id, { title });
        toast.success('Book updated successfully');
      } else {
        const { data: newBook, error } = await supabase.from('books').insert(bookData).select().single();
        if (error) throw error;
        await logAdminActivity('create', 'book', newBook?.id, { title });
        toast.success('Book added successfully');
      }

      updateSubmitState('refreshing', 100);
      resetForm();
      await fetchBooks();
      queryClient.invalidateQueries({ queryKey: ['books'] });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
      if (submitStage !== 'idle') {
        setSubmitStage('idle');
        setSubmitProgress(0);
      }
    }
  };

  const deleteBook = async (id: string, bookTitle: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await logAdminActivity('delete', 'book', id, { title: bookTitle });
    toast.success('Book deleted'); fetchBooks();
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  const updateRequestStatus = async (reqId: string, status: string) => {
    const { error } = await supabase.from('book_requests').update({ status }).eq('id', reqId);
    if (error) toast.error(error.message);
    else { toast.success(`Request marked as ${status}`); queryClient.invalidateQueries({ queryKey: ['book_requests'] }); }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;

  const totalDownloads = books.reduce((sum, b) => sum + (b.download_count || 0), 0);
  const topBooks = [...books].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5);

  // Popular categories
  const catCounts: Record<string, { name: string; count: number; downloads: number }> = {};
  books.forEach((b) => {
    const cName = b.categories?.name || 'Uncategorized';
    if (!catCounts[cName]) catCounts[cName] = { name: cName, count: 0, downloads: 0 };
    catCounts[cName].count++;
    catCounts[cName].downloads += b.download_count || 0;
  });
  const popularCategories = Object.values(catCounts).sort((a, b) => b.downloads - a.downloads).slice(0, 5);

  const recentBooks = books.slice(0, 5);
  const pendingRequests = bookRequests.filter(r => r.status === 'pending').length;

  const tabs = [
    { key: 'books' as const, label: 'Books', icon: BookOpen },
    { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { key: 'requests' as const, label: `Requests (${pendingRequests})`, icon: MessageSquare },
    { key: 'activity' as const, label: 'Activity Log', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground font-display">Admin Dashboard</h2>
          <div className="flex gap-2">
            <Button onClick={() => { resetForm(); setShowForm(true); setActiveTab('books'); }} size="sm">
              <Plus className="me-1 h-4 w-4" /> Add Book
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="me-1 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Books', value: books.length, icon: BookOpen },
            { label: 'Total Downloads', value: totalDownloads.toLocaleString(), icon: BarChart3 },
            { label: 'Categories', value: categories?.length || 0, icon: BookOpen },
            { label: 'Pending Requests', value: pendingRequests, icon: MessageSquare },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Books Tab */}
        {activeTab === 'books' && (
          <>
            {showForm && (
              <div className="mb-8 rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
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
                      <Label>Author (from DB)</Label>
                      <Select value={authorId} onValueChange={setAuthorId}>
                        <SelectTrigger><SelectValue placeholder="Link to author (optional)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {authors?.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
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
                    <div><Label>Cover Image (JPG, PNG, WebP — max 5MB)</Label><Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => setCoverFile(e.target.files?.[0] || null)} /></div>
                    <div><Label>Book File (PDF or EPUB — max 100MB)</Label><Input type="file" accept=".pdf,.epub" onChange={e => setBookFile(e.target.files?.[0] || null)} /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={featured} onCheckedChange={setFeatured} />
                    <Label>Featured Book</Label>
                  </div>

                  {submitting && (
                    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{SUBMIT_STAGE_LABELS[submitStage]}</span>
                        <span className="text-muted-foreground">{submitProgress}%</span>
                      </div>
                      <Progress value={submitProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">Please keep this page open while upload is in progress.</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>{submitting ? SUBMIT_STAGE_LABELS[submitStage] : editingBook ? 'Update Book' : 'Add Book'}</Button>
                    <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}

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
                          <Button variant="ghost" size="icon" onClick={() => deleteBook(book.id, book.title)}>
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
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground"><TrendingUp className="h-5 w-5" /> Most Downloaded Books</h3>
                <div className="space-y-3">
                  {topBooks.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{i + 1}. {b.title}</span>
                      <span className="text-sm font-semibold text-muted-foreground">{b.download_count}</span>
                    </div>
                  ))}
                  {topBooks.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground"><BarChart3 className="h-5 w-5" /> Popular Categories</h3>
                <div className="space-y-3">
                  {popularCategories.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{i + 1}. {c.name} ({c.count} books)</span>
                      <span className="text-sm font-semibold text-muted-foreground">{c.downloads} downloads</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground"><Clock className="h-5 w-5" /> Recent Uploads</h3>
              <div className="space-y-2">
                {recentBooks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{b.title}</span>
                    <span className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Book Title</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Author</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Requester</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookRequests.map((req) => (
                  <tr key={req.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{req.book_title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{req.author_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{req.requester_name || req.requester_email || 'Anonymous'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${req.status === 'pending' ? 'bg-accent/20 text-accent-foreground' : req.status === 'approved' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {req.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(req.id, 'approved')}>Approve</Button>
                            <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(req.id, 'rejected')}>Reject</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {bookRequests.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No book requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Entity</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Details</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground capitalize">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{log.entity_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(log.details as any)?.title || log.entity_id || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {activityLog.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No activity logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
