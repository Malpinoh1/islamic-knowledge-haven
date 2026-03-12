import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-emerald">
                <span className="text-sm font-bold text-primary-foreground">د</span>
              </div>
              <span className="font-bold text-foreground font-display">{t('site.name')}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-foreground">{t('nav.categories')}</h4>
            <div className="grid grid-cols-2 gap-1">
              {['tafsir', 'hadith', 'fiqh', 'aqeedah', 'seerah', 'history'].map((cat) => (
                <Link
                  key={cat}
                  to={`/books?category=${cat}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t(`category.${cat}`)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-foreground">{t('nav.books')}</h4>
            <div className="flex flex-col gap-1">
              <Link to="/books" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('section.featured')}
              </Link>
              <Link to="/books" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('section.latest')}
              </Link>
              <Link to="/books" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('section.popular')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {t('site.name')}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
