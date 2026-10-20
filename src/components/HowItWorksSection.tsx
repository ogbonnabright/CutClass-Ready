import React from 'react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="container-page py-16 md:py-24">
        {/* Section Header */}
        <div className="mb-12 flex flex-col justify-between gap-5 md:mb-16 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              A simple rhythm
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl text-foreground">
              From monthly plan to front-door finish.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Choose a plan, request a visit and let CutClass coordinate the details around your day.
          </p>
        </div>

        {/* 3 Step Flow */}
        <div className="grid gap-8 border-t border-border pt-8 md:grid-cols-3 md:gap-10">
          <article className="relative">
            <p className="font-display text-6xl font-medium leading-none tracking-[-0.06em] text-primary/80">
              01
            </p>
            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Choose your monthly credits
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Compare the included appointments and choose the plan that matches your household and grooming needs.
            </p>
          </article>

          <article className="relative md:border-l md:border-border md:pl-8">
            <p className="font-display text-6xl font-medium leading-none tracking-[-0.06em] text-primary/80">
              02
            </p>
            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Request a time and place
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Confirm your address is in an area CutClass serves, then request a visit at home or at work.
            </p>
          </article>

          <article className="relative md:border-l md:border-border md:pl-8">
            <p className="font-display text-6xl font-medium leading-none tracking-[-0.06em] text-primary/80">
              03
            </p>
            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Enjoy the visit, track your plan
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              See your bookings and remaining credits, and keep payment details together as your plan renews.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};
