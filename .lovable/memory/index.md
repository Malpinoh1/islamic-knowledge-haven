Design system: emerald/gold Islamic theme, Plus Jakarta Sans + Amiri Arabic fonts
Domain: daawatulhaqq.com.ng
i18n: English/Arabic with RTL via src/lib/i18n.tsx
Database: books, categories, authors, user_roles, book_requests, admin_activity_log tables with RLS
Storage: book-covers, book-files buckets
Auth: admin role-based via user_roles table
Pages: Index, Books, BookDetail, Categories, BookRequest, AuthorDetail, AdminLogin, AdminDashboard
API layer: src/lib/api.ts (hooks for books, categories, authors, book requests, activity log)
Features: PDF reader (react-pdf), book request form, author pages, analytics dashboard, admin activity log
Edge functions: sitemap (generates XML sitemap)
Category change: Seerah was renamed to Sufism (التصوف)
