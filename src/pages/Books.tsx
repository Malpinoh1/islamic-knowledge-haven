import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useBooks, useCategories } from '@/lib/api';
import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const BooksPage = () => {
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

  const { data: allBooks = [], isLoading } = useBooks();
  const { data: categories = [] } = useCategories();

  const filteredBooks = useMemo(() => {
    return allBooks.filter((book) => {
      const title = language === 'ar' ? book.title_ar : book.title;
      const author = language === 'ar' ? book.author_ar : book.author;
      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || book.categories?.name === selectedCategory;
      const matchesLanguage = !selectedLanguage || book.language === selectedLanguage;
      const matchesFormat = !selectedFormat || book.format.includes(selectedFormat);
      return matchesSearch && matchesCategory && matchesLanguage && matchesFormat;
    });
  }, [allBooks, search, selectedCategory, selectedLanguage, selectedFormat, language]);

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <Button variant={active ? 'default' : 'outline'} size="sm" onClick={onClick} className="rounded-full text-xs">
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold text-foreground font-display">{t('nav.books')}</h2>
        <SearchBar value={search} onChange={setSearch} className="mb-6 max-w-xl" />

        <div className="mb-8 space-y-3">
          <div>
            <span className="me-2 text-xs font-semibold text-muted-foreground">{t('filter.category')}:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <FilterChip label={t('filter.all')} active={!selectedCategory} onClick={() => setSelectedCategory('')} />
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={language === 'ar' ? cat.name_ar : cat.name}
                  active={selectedCategory === cat.name}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="me-2 text-xs font-semibold text-muted-foreground">{t('filter.language')}:</span>
              <div className="mt-1 flex gap-2">
                <FilterChip label={t('filter.all')} active={!selectedLanguage} onClick={() => setSelectedLanguage('')} />
                {['Arabic', 'English', 'Both'].map((lang) => (
                  <FilterChip key={lang} label={lang} active={selectedLanguage === lang} onClick={() => setSelectedLanguage(selectedLanguage === lang ? '' : lang)} />
                ))}
              </div>
            </div>
            <div>
              <span className="me-2 text-xs font-semibold text-muted-foreground">{t('filter.format')}:</span>
              <div className="mt-1 flex gap-2">
                <FilterChip label={t('filter.all')} active={!selectedFormat} onClick={() => setSelectedFormat('')} />
                {['PDF', 'EPUB'].map((fmt) => (
                  <FilterChip key={fmt} label={fmt} active={selectedFormat === fmt} onClick={() => setSelectedFormat(selectedFormat === fmt ? '' : fmt)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center"><p className="text-muted-foreground">Loading...</p></div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {filteredBooks.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center"><p className="text-muted-foreground">{t('search.noResults')}</p></div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BooksPage;
