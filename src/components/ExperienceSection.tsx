import React from 'react';
import { ShieldCheck, CalendarDays } from 'lucide-react';

export const ExperienceSection: React.FC = () => {
  return (
    <section id="experience" className="scroll-mt-24 border-y border-border bg-muted/40">
      <div className="container-page grid gap-10 py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-24">
        {/* Left Column */}
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            A more considered cut
          </p>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl text-foreground">
            Grooming that fits around real life.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            CutClass brings a dependable grooming routine closer, with the details clear before you book.
          </p>
        </div>

        {/* Right Column with Features */}
        <div className="divide-y divide-border border-y border-border">
          {/* Feature 01 */}
          <div className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr] sm:gap-5">
            <span className="font-display text-2xl text-primary font-medium">01</span>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Know what your plan includes
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Each month comes with a defined number of haircut or grooming credits, so you can plan your routine with confidence.
              </p>
            </div>
          </div>

          {/* Feature 02 */}
          <div className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr] sm:gap-5">
            <span className="font-display text-2xl text-primary font-medium">02</span>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <ShieldCheck className="size-5 text-primary" />
                Professionals, coordinated for you
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                CutClass recruits and verifies barbers, then coordinates a visit at home, at work or another approved location.
              </p>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr] sm:gap-5">
            <span className="font-display text-2xl text-primary font-medium">03</span>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <CalendarDays className="size-5 text-primary" />
                Keep your routine in view
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Keep track of bookings, payments and remaining credits, with family sharing available on eligible plans at one address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
