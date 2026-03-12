import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchBar = ({ value, onChange, className = '' }: SearchBarProps) => {
  const { t } = useI18n();

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full rounded-xl border border-border bg-card py-3 pe-4 ps-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
};

export default SearchBar;
