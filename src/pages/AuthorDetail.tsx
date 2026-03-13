import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuthor, useBooks } from '@/lib/api';
import BookCard from '@/components/BookCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const { data: author, isLoading } = useAuthor(id || '');
  const { data: authorBooks = [] } = useBooks({ authorId: id });

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

  if (!author) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Author not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/books"><ArrowLeft className="me-2 h-4 w-4" />{t('nav.books')}</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const name = language === 'ar' ? author.name_ar : author.name;
  const bio = language === 'ar' ? author.bio_ar : author.bio;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/books" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />{t('nav.books')}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 md:grid-cols-[200px,1fr]"
        >
          <div className="mx-auto">
            {author.photo_url ? (
              <img src={author.photo_url} alt={name} className="h-48 w-48 rounded-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-full gradient-emerald">
                <User className="h-16 w-16 text-primary-foreground/60" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground font-display">{name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{authorBooks.length} {authorBooks.length === 1 ? 'book' : 'books'}</p>
            {bio && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('author.biography')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>
              </div>
            )}
          </div>
        </motion.div>

        {authorBooks.length > 0 && (
          <section className="mt-12">
            <h3 className="mb-6 text-2xl font-bold text-foreground font-display">{t('author.books')}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {authorBooks.map((b, i) => (
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

export default AuthorDetail;
