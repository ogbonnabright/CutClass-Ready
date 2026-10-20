import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle2, Send, ExternalLink } from 'lucide-react';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, initialTopic }) => {
  const [topic, setTopic] = useState(initialTopic || 'Ask about plans');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setMessage('');
    onClose();
  };

  const mailtoUrl = `mailto:nookshear-2@polsia.app?subject=${encodeURIComponent(
    topic
  )}&body=${encodeURIComponent(
    `Name: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n${message}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={handleReset}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground">
              Inquiry Sent to CutClass
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Thank you, <span className="font-medium text-foreground">{name || 'there'}</span>. We have received your inquiry regarding{' '}
              <span className="font-medium text-foreground">{topic}</span>. Our concierge team will review your area and get back to you at{' '}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
              <a
                href={mailtoUrl}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              >
                <ExternalLink className="size-3.5" />
                Or open default email client (nookshear-2@polsia.app)
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Direct Inquiry
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                Ask about CutClass
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Have a question about our Abuja launch, monthly credits, or custom household schedules?
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Topic / Plan
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Ask about plans">Ask about plans</option>
                  <option value="Starter Plan (₦15,000/mo - 2 visits)">Starter Plan (₦15,000/mo - 2 visits)</option>
                  <option value="Regular Plan (₦28,000/mo - 4 visits)">Regular Plan (₦28,000/mo - 4 visits)</option>
                  <option value="Executive Plan (₦35,000/mo - 4 premium visits)">Executive Plan (₦35,000/mo - 4 premium visits)</option>
                  <option value="Family Plan (₦48,000/mo - 8 shared credits)">Family Plan (₦48,000/mo - 8 shared credits)</option>
                  <option value="Ask about a booking">Ask about a booking</option>
                  <option value="Address & coverage query">Address & coverage query</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tunde Adeyemi"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Phone (WhatsApp / Mobile)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Location / Area (e.g. Maitama, Abuja)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="District or street"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Questions or Preferred Timing
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share any special preferences, household size, or preferred days..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="size-4" />
                  {submitting ? 'Sending inquiry...' : 'Send inquiry'}
                </button>
                <div className="text-center">
                  <a
                    href="mailto:nookshear-2@polsia.app?subject=Ask%20about%20CutClass"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Or write directly to nookshear-2@polsia.app
                  </a>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
