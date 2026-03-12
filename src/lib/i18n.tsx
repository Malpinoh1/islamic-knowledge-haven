import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Language = 'en' | 'ar';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'site.name': 'Daawatulhaqq',
    'site.tagline': 'Your Gateway to Islamic Knowledge',
    'site.description': 'Explore thousands of authentic Islamic books in Arabic and English. Free to download.',
    'nav.home': 'Home',
    'nav.books': 'Books',
    'nav.categories': 'Categories',
    'nav.about': 'About',
    'nav.admin': 'Admin',
    'hero.title': 'Discover the Light of Knowledge',
    'hero.subtitle': 'Access a vast collection of authentic Islamic books — from Tafsir and Hadith to Fiqh and Seerah. Free to read and download.',
    'hero.browse': 'Browse Library',
    'hero.search': 'Search Books',
    'section.featured': 'Featured Books',
    'section.latest': 'Latest Additions',
    'section.categories': 'Browse by Category',
    'section.popular': 'Most Downloaded',
    'book.download': 'Download',
    'book.downloads': 'Downloads',
    'book.pages': 'Pages',
    'book.read': 'Read More',
    'book.related': 'Related Books',
    'book.details': 'Book Details',
    'book.author': 'Author',
    'book.category': 'Category',
    'book.language': 'Language',
    'book.format': 'Format',
    'book.size': 'File Size',
    'book.description': 'Description',
    'search.placeholder': 'Search by title, author, or keyword...',
    'search.results': 'Search Results',
    'search.noResults': 'No books found matching your search.',
    'filter.all': 'All',
    'filter.language': 'Language',
    'filter.category': 'Category',
    'filter.format': 'Format',
    'footer.rights': 'All rights reserved.',
    'footer.description': 'A free digital library dedicated to preserving and sharing Islamic knowledge.',
    'lang.english': 'English',
    'lang.arabic': 'العربية',
    'category.tafsir': 'Tafsir',
    'category.hadith': 'Hadith',
    'category.fiqh': 'Fiqh',
    'category.aqeedah': 'Aqeedah',
    'category.seerah': 'Seerah',
    'category.history': 'Islamic History',
    'category.grammar': 'Arabic Grammar',
    'category.education': 'Islamic Education',
  },
  ar: {
    'site.name': 'دعوة الحق',
    'site.tagline': 'بوابتك إلى المعرفة الإسلامية',
    'site.description': 'استكشف آلاف الكتب الإسلامية الأصيلة بالعربية والإنجليزية. مجانية للتحميل.',
    'nav.home': 'الرئيسية',
    'nav.books': 'الكتب',
    'nav.categories': 'الأقسام',
    'nav.about': 'عن الموقع',
    'nav.admin': 'لوحة التحكم',
    'hero.title': 'اكتشف نور المعرفة',
    'hero.subtitle': 'الوصول إلى مجموعة واسعة من الكتب الإسلامية الأصيلة — من التفسير والحديث إلى الفقه والسيرة. مجانية للقراءة والتحميل.',
    'hero.browse': 'تصفح المكتبة',
    'hero.search': 'البحث في الكتب',
    'section.featured': 'كتب مميزة',
    'section.latest': 'أحدث الإضافات',
    'section.categories': 'تصفح حسب القسم',
    'section.popular': 'الأكثر تحميلاً',
    'book.download': 'تحميل',
    'book.downloads': 'تحميلات',
    'book.pages': 'صفحات',
    'book.read': 'اقرأ المزيد',
    'book.related': 'كتب ذات صلة',
    'book.details': 'تفاصيل الكتاب',
    'book.author': 'المؤلف',
    'book.category': 'القسم',
    'book.language': 'اللغة',
    'book.format': 'الصيغة',
    'book.size': 'حجم الملف',
    'book.description': 'الوصف',
    'search.placeholder': 'ابحث بالعنوان أو المؤلف أو الكلمة المفتاحية...',
    'search.results': 'نتائج البحث',
    'search.noResults': 'لم يتم العثور على كتب مطابقة لبحثك.',
    'filter.all': 'الكل',
    'filter.language': 'اللغة',
    'filter.category': 'القسم',
    'filter.format': 'الصيغة',
    'footer.rights': 'جميع الحقوق محفوظة.',
    'footer.description': 'مكتبة رقمية مجانية مخصصة للحفاظ على المعرفة الإسلامية ونشرها.',
    'lang.english': 'English',
    'lang.arabic': 'العربية',
    'category.tafsir': 'التفسير',
    'category.hadith': 'الحديث',
    'category.fiqh': 'الفقه',
    'category.aqeedah': 'العقيدة',
    'category.seerah': 'السيرة',
    'category.history': 'التاريخ الإسلامي',
    'category.grammar': 'النحو العربي',
    'category.education': 'التعليم الإسلامي',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('daawatulhaqq-lang');
    return (saved === 'ar' ? 'ar' : 'en') as Language;
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('daawatulhaqq-lang', lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};
