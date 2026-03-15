import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useBook, useBooks, incrementDownload } from '@/lib/api';
import BookCard from '@/components/BookCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PdfReader from '@/components/PdfReader';
import { Button } from '@/components/ui/button';
import { Download, FileText, ArrowLeft, BookOpen, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const [showReader, setShowReader] = useState(false);

  const { data: book, isLoading } = useBook(id || '');
  const { data: allBooks = [] } = useBooks();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Book not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/books"><ArrowLeft className="me-2 h-4 w-4" />{t('nav.books')}</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const title = language === 'ar' ? book.title_ar : book.title;
  const author = language === 'ar' ? book.author_ar : book.author;
  const description = language === 'ar' ? book.description_ar : book.description;
  const categoryName = language === 'ar' ? book.categories?.name_ar : book.categories?.name;
  const authorName = language === 'ar' ? book.authors?.name_ar : book.authors?.name;

  // Related books: same category or same author, excluding current book
  const relatedBooks = allBooks
    .filter((b) => b.id !== book.id && (b.category_id === book.category_id || (book.author_id && b.author_id === book.author_id)))
    .slice(0, 4);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!book.file_url) {
      toast.info('File not available yet.');
      return;
    }

    setDownloading(true);
    const toastId = toast.loading('Preparing download...');

    try {
      await incrementDownload(book.id);

      const response = await fetch(book.file_url);
      if (!response.ok) throw new Error('Download failed');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body?.getReader();

      if (!reader) {
        // Fallback: direct link
        const a = document.createElement('a');
        a.href = book.file_url;
        a.download = `${title}.${book.format.toLowerCase()}`;
        a.click();
        toast.dismiss(toastId);
        toast.success('Download started!');
        setDownloading(false);
        return;
      }

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          const pct = Math.round((received / total) * 100);
          toast.loading(`Downloading... ${pct}%`, { id: toastId });
        }
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.${book.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('Download complete!');
    } catch (err: any) {
      toast.dismiss(toastId);
      // Fallback to direct open
      window.open(book.file_url, '_blank');
      toast.info('Download started in new tab.');
    } finally {
      setDownloading(false);
    }
  };

  const canReadOnline = book.file_url && book.format.includes('PDF');

  // JSON-LD structured data for this book
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    author: { '@type': 'Person', name: author },
    description,
    bookFormat: book.format === 'PDF' ? 'EBook' : 'EBook',
    numberOfPages: book.pages,
    inLanguage: book.language === 'Arabic' ? 'ar' : 'en',
    ...(book.cover_image && { image: book.cover_image }),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {showReader && book.file_url && (
        <PdfReader fileUrl={book.file_url} title={title} onClose={() => setShowReader(false)} />
      )}

      <div className="container mx-auto px-4 py-8">
        <Link to="/books" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />{t('nav.books')}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-8 md:grid-cols-[280px,1fr]"
        >
          <div className="mx-auto w-full max-w-[280px]">
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted">
              {book.cover_image ? (
                <img src={book.cover_image} alt={title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full gradient-emerald islamic-pattern flex flex-col items-center justify-center p-6">
                  <FileText className="h-14 w-14 text-primary-foreground/50 mb-3" />
                  <p className="text-center text-lg font-bold text-primary-foreground font-arabic leading-relaxed">{book.title_ar}</p>
                  <p className="mt-2 text-sm text-primary-foreground/70 font-arabic">{book.author_ar}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={handleDownload} className="w-full gradient-gold text-accent-foreground font-semibold hover:opacity-90 border-0" size="lg">
                <Download className="me-2 h-5 w-5" />{t('book.download')} ({book.format})
              </Button>
              {canReadOnline && (
                <Button onClick={() => setShowReader(true)} variant="outline" className="w-full" size="lg">
                  <Eye className="me-2 h-5 w-5" />{t('book.readOnline')}
                </Button>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground font-display">{title}</h2>
            {book.author_id && authorName ? (
              <Link to={`/author/${book.author_id}`} className="mt-1 text-lg text-primary hover:underline block">
                {authorName}
              </Link>
            ) : (
              <p className="mt-1 text-lg text-muted-foreground">{author}</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t('book.category'), value: categoryName || '—' },
                { label: t('book.language'), value: book.language },
                { label: t('book.pages'), value: book.pages?.toLocaleString() || '—' },
                { label: t('book.size'), value: book.file_size || '—' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Download className="h-4 w-4" />{book.download_count.toLocaleString()} {t('book.downloads')}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{book.format}</span>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('book.description')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
        </motion.div>

        {relatedBooks.length > 0 && (
          <section className="mt-14">
            <h3 className="mb-6 text-2xl font-bold text-foreground font-display">{t('book.related')}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedBooks.map((b, i) => (
                <BookCard key={b.id} book={b} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BookDetail;
