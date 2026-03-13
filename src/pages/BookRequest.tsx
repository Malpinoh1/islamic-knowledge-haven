import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { submitBookRequest } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { z } from 'zod';

const requestSchema = z.object({
  book_title: z.string().trim().min(1, 'Book title is required').max(200),
  author_name: z.string().trim().max(200),
  requester_name: z.string().trim().max(100),
  requester_email: z.string().trim().email('Invalid email').max(255).or(z.literal('')),
  notes: z.string().trim().max(1000),
});

const BookRequest = () => {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = requestSchema.safeParse({
      book_title: bookTitle,
      author_name: authorName,
      requester_name: requesterName,
      requester_email: requesterEmail,
      notes,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      await submitBookRequest(parsed.data);
      toast.success(t('request.success'));
      setBookTitle(''); setAuthorName(''); setRequesterName(''); setRequesterEmail(''); setNotes('');
    } catch {
      toast.error('Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <h2 className="text-3xl font-bold text-foreground font-display mb-2">{t('request.title')}</h2>
          <p className="text-sm text-muted-foreground mb-8">{t('request.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t('request.bookTitle')} *</Label>
              <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} required maxLength={200} />
            </div>
            <div>
              <Label>{t('request.authorName')}</Label>
              <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label>{t('request.yourName')}</Label>
              <Input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label>{t('request.yourEmail')}</Label>
              <Input type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} maxLength={255} />
            </div>
            <div>
              <Label>{t('request.notes')}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full gradient-emerald text-primary-foreground">
              <Send className="me-2 h-4 w-4" />
              {submitting ? 'Submitting...' : t('request.submit')}
            </Button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default BookRequest;
