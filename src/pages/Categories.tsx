import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useCategories, useBooks } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const Categories = () => {
  const { t, language } = useI18n();
  const { data: categories = [] } = useCategories();
  const { data: books = [] } = useBooks();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-8 text-3xl font-bold text-foreground font-display">{t('section.categories')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => {
            const count = books.filter((b) => b.category_id === cat.id).length;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <Link
                  to={`/books?category=${cat.name}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {language === 'ar' ? cat.name_ar : cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {count} {count === 1 ? 'book' : 'books'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Categories;
