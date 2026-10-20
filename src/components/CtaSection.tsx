import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface CtaSectionProps {
  onOpenInquiry: (initialTopic?: string) => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenInquiry }) => {
  return (
    <section className="px-gutter pb-16 md:pb-24">
      <div className="container-page overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground shadow-xl shadow-primary/15 sm:px-10 sm:py-14 lg:px-16">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
              Make time for your next cut
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">
              A better grooming routine can start with one conversation.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed opacity-85">
              Ask about plans, address availability or how CutClass works in your area.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenInquiry('General inquiry & availability')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-12 w-fit rounded-full px-6 transition-transform duration-200 ease-out hover:-translate-y-0.5 cursor-pointer"
          >
            Email CutClass
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
