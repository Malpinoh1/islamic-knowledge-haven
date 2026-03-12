import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Download, FileText } from 'lucide-react';
import { Book } from '@/lib/mockData';
import { motion } from 'framer-motion';

interface BookCardProps {
  book: Book;
  index?: number;
}

const BookCard = ({ book, index = 0 }: BookCardProps) => {
  const { t, language } = useI18n();
  const title = language === 'ar' ? book.titleAr : book.title;
  const author = language === 'ar' ? book.authorAr : book.author;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        to={`/book/${book.id}`}
        className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
      >
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <div className="absolute inset-0 gradient-emerald islamic-pattern flex items-center justify-center">
            <div className="text-center px-4">
              <FileText className="mx-auto h-10 w-10 text-primary-foreground/60 mb-2" />
              <p className="text-sm font-bold text-primary-foreground font-arabic leading-relaxed">
                {book.titleAr}
              </p>
            </div>
          </div>
          <div className="absolute bottom-2 start-2">
            <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
              {book.format}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{author}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {t(`category.${book.category}`)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Download className="h-3 w-3" />
              {book.downloadCount.toLocaleString()}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BookCard;
