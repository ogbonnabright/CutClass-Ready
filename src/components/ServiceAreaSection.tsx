import React from 'react';
import { MapPin, ArrowUpRight } from 'lucide-react';

interface ServiceAreaSectionProps {
  onOpenAvailability: () => void;
}

export const ServiceAreaSection: React.FC<ServiceAreaSectionProps> = ({ onOpenAvailability }) => {
  return (
    <section id="service-area" className="scroll-mt-24">
      <div className="container-page grid gap-8 py-14 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-12 md:py-16">
        {/* Map Icon Badge */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MapPin className="size-6" />
        </div>

        {/* Content */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Registration across Nigeria · Nationwide coverage
          </p>
          <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
            Your place, when it works for you.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Registration is open nationwide. Home and workplace visits depend on local coverage; confirm availability for your address before choosing a plan.
          </p>
        </div>

        {/* Action Link */}
        <button
          type="button"
          onClick={onOpenAvailability}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-primary underline-offset-4 hover:underline h-9 py-2 w-fit px-0 text-base cursor-pointer"
        >
          Check availability
          <ArrowUpRight className="size-4" />
        </button>
      </div>
    </section>
  );
};
