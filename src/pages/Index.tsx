import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { mockBooks, categories } from '@/lib/mockData';
import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroPattern from '@/assets/hero-pattern.jpg';

const Index = () => {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  const featuredBooks = mockBooks.filter((b) => b.featured);
  const latestBooks = [...mockBooks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const popularBooks = [...mockBooks].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 4);

  const totalDownloads = mockBooks.reduce((sum, b) => sum + b.downloadCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroPattern} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-deep/90 via-primary/85 to-primary/95" />
        </div>

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="mb-4 text-4xl font-extrabold leading-tight text-primary-foreground md:text-5xl font-display">
              {t('hero.title')}
            </h2>
            <p className="mb-8 text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              {t('hero.subtitle')}
            </p>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              className="mx-auto max-w-lg"
            />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gradient-gold text-accent-foreground font-semibold hover:opacity-90 border-0">
                <Link to="/books">{t('hero.browse')}</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4"
          >
            {[
              { icon: BookOpen, value: mockBooks.length, label: language === 'ar' ? 'كتاب' : 'Books' },
              { icon: Users, value: categories.length, label: language === 'ar' ? 'أقسام' : 'Categories' },
              { icon: Download, value: `${(totalDownloads / 1000).toFixed(0)}K`, label: language === 'ar' ? 'تحميل' : 'Downloads' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="mx-auto mb-1 h-5 w-5 text-gold" />
                <p className="text-2xl font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-xs text-primary-foreground/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <h3 className="mb-6 text-2xl font-bold text-foreground font-display">{t('section.categories')}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                to={`/books?category=${cat.id}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground text-center">
                  {t(cat.key)}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Books */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-foreground font-display">{t('section.featured')}</h3>
          <Link to="/books" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t('nav.books')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {featuredBooks.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="bg-muted/50 islamic-pattern">
        <div className="container mx-auto px-4 py-14">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-foreground font-display">{t('section.popular')}</h3>
            <Link to="/books" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t('nav.books')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {popularBooks.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest */}
      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-foreground font-display">{t('section.latest')}</h3>
          <Link to="/books" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t('nav.books')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {latestBooks.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
