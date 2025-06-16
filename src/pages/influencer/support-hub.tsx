import React, { useState } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { HelpCircle, CheckCircle2, LifeBuoy, Mail, FileText, MessageCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const FAQS = [
  { q: "How do I connect my bank account?", a: "Go to Settings > Payouts and follow the instructions to securely connect your bank account." },
  { q: "Why is my payment pending?", a: "Payments may be pending due to processing times or missing information. Check your payout settings and email for updates." },
  { q: "How does link tracking work?", a: "Each campaign provides unique tracking links. Use these links in your content to track clicks and conversions." },
  { q: "What does 'engagement rate' mean?", a: "Engagement rate measures how actively your audience interacts with your content, calculated as (likes + comments + shares) / followers." },
  { q: "How do I apply for a campaign?", a: "Browse available campaigns and click 'View & Apply' to see details and submit your application." },
  { q: "Can I update my profile information?", a: "Yes, go to Settings > Profile to update your personal and social information." },
  { q: "How do I reset my password?", a: "Go to Settings > Security and follow the instructions to reset your password." },
  { q: "What if I have a technical problem?", a: "Use the Contact Support form below to describe your issue. Our team will assist you promptly." },
  { q: "How do I check my campaign status?", a: "Go to the Campaigns page to view your applications, active, and completed campaigns." },
  { q: "How do I contact support?", a: "Use the Contact Support form below to submit a ticket. Our team will respond within 24 hours." },
];

const ISSUE_OPTIONS = [
  { value: 'payouts', label: 'Payouts' },
  { value: 'campaign', label: 'A Campaign' },
  { value: 'technical', label: 'Technical Problem' },
  { value: 'account', label: 'My Account' },
];

const InfluencerSupportHub: React.FC = () => {
  const [issueType, setIssueType] = useState('payouts');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('issueType', issueType);
      formData.append('subject', subject);
      formData.append('description', description);
      if (file) formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit ticket');
      }
      const data = await res.json();
      setTicketNumber(data.ticketNumber);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="faqs" className="w-full">
        <TabsList className="flex w-full justify-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl shadow-lg">
          <TabsTrigger value="faqs" className="flex-1 flex items-center gap-2 text-lg font-semibold">
            <LifeBuoy className="h-5 w-5 text-blue-500" /> FAQs
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-1 flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-5 w-5 text-indigo-500" /> Contact Support
          </TabsTrigger>
        </TabsList>
        <TabsContent value="faqs">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <HelpCircle className="text-blue-500 w-7 h-7" />
          <CardTitle className="text-2xl font-extrabold text-blue-900 tracking-wide">Support FAQ</CardTitle>
        </CardHeader>
        <CardContent>
              <Accordion type="multiple" className="w-full mt-2">
            {FAQS.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`} className="rounded-lg border mb-2 bg-white/80 shadow hover:shadow-lg transition">
                    <AccordionTrigger className="text-lg font-bold text-blue-800 px-4 py-3 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-400 mr-2" />
                {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-gray-800 px-6 pb-4 pt-2">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
        </CardContent>
      </Card>
        </TabsContent>
        <TabsContent value="support">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-blue-100 w-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <FileText className="text-indigo-500 w-7 h-7" />
              <CardTitle className="text-2xl font-extrabold text-indigo-900 tracking-wide">Contact Support</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted && ticketNumber ? (
            <div className="mb-6 p-6 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center shadow-xl animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
              <div className="text-2xl font-extrabold text-green-700 mb-1">Thank you!</div>
              <div className="text-lg font-semibold text-blue-900 mb-2">Your request <span className="font-mono bg-green-100 px-2 py-1 rounded">#{ticketNumber}</span> has been received.</div>
              <div className="text-base text-gray-700">Our team will get back to you within 24 hours.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert className="mb-2" variant="destructive">{error}</Alert>}
              <div>
                <label className="block mb-1 font-medium">What is your issue about?</label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Subject</label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} required maxLength={100} />
              </div>
              <div>
                <label className="block mb-1 font-medium">Please describe your issue in detail.</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} maxLength={1000} />
              </div>
              <div>
                <label className="block mb-1 font-medium">Attach a screenshot (optional)</label>
                <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
            </form>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfluencerSupportHub; 