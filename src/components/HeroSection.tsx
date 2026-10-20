import React from 'react';
import { Scissors, MapPin, Clock3, ArrowDown, Mail } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (path: string) => void;
  onOpenInquiry: (initialTopic?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, onOpenInquiry }) => {
  const scrollToPlans = (e: React.MouseEvent) => {
    e.preventDefault();
    const plansEl = document.getElementById('plans');
    plansEl?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-background via-background to-accent/40">
      {/* Decorative concentric geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-8 -z-10 size-80 rounded-full border border-primary/20 md:right-[8%] md:top-12 md:size-[34rem]"
      >
        <div className="absolute inset-8 rounded-full border border-primary/15" />
        <div className="absolute inset-20 rounded-full border border-primary/10" />
        <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-primary/15" />
      </div>

      <div className="container-page grid min-h-[calc(100svh-3.5rem)] items-center gap-12 py-16 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:py-24 lg:py-28">
        {/* Left Column Content */}
        <div className="relative z-10 max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
          <p className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="h-px w-8 bg-primary" />
            Nigeria <span aria-hidden="true">·</span> Grooming, on your terms
          </p>

          <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl xl:text-[5.5rem] text-foreground">
            A good cut,
            <br />
            <span className="text-primary">without giving</span>
            <br />
            up your day.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            <span className="font-medium text-foreground">CutClass</span> — Professional home haircuts, on a schedule that suits you.
          </p>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Create an account from anywhere in Nigeria. Appointment coverage depends on your location and is confirmed before a visit is arranged.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => onNavigate('/signup')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12 rounded-full px-6 transition-transform duration-200 ease-out hover:-translate-y-0.5 cursor-pointer"
            >
              Create account
            </button>

            <a
              href="#plans"
              onClick={scrollToPlans}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-12 rounded-full px-5 cursor-pointer"
            >
              View monthly plans
              <ArrowDown className="size-4 opacity-70" />
            </a>

            <button
              onClick={() => onOpenInquiry('Ask about a booking')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent/70 text-muted-foreground hover:text-foreground h-12 rounded-full px-4 cursor-pointer"
            >
              <Mail className="size-4" />
              Ask about a booking
            </button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Set credits. A time that works. No unlimited-visit promises.
          </p>
        </div>

        {/* Right Column Badge Visual */}
        <div className="relative mx-auto flex min-h-[21rem] w-full max-w-md items-center justify-center md:min-h-[29rem]">
          <div
            aria-hidden="true"
            className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
          />

          <div className="relative flex aspect-square w-[min(72vw,22rem)] flex-col items-center justify-center rounded-full border border-primary/25 bg-card/80 text-center shadow-xl shadow-primary/10 backdrop-blur-sm transition-transform duration-500 ease-out hover:rotate-2">
            <div className="absolute inset-3 rounded-full border border-dashed border-primary/25" />

            <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Scissors className="size-7 -rotate-12" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              CutClass, at your place
            </p>

            <p className="mt-3 max-w-[13rem] font-display text-3xl font-medium leading-tight tracking-tight text-foreground">
              Make room for a better routine.
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              Home <span aria-hidden="true">/</span> Work <span aria-hidden="true">/</span> Approved
            </div>
          </div>

          {/* Floating pill badge */}
          <div className="absolute bottom-1 left-0 flex items-center gap-3 rounded-full border border-border bg-background/90 px-4 py-3 shadow-lg shadow-foreground/5 sm:bottom-6 sm:left-2">
            <Clock3 className="size-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Your schedule comes first</span>
          </div>
        </div>
      </div>
    </section>
  );
};
