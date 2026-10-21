import React, { useState } from 'react';
import { UsersRound, Check, ArrowUpRight } from 'lucide-react';
import { Plan } from '../types';

interface PlansSectionProps {
  onSelectPlan: (plan: Plan) => void;
  onOpenInquiry: (initialTopic?: string) => void;
}

export const plansData: Plan[] = [
  {
    id: 'starter',
    number: '01',
    name: 'Starter',
    credits: 2,
    price: '₦15,000',
    priceNum: 15000,
    period: '/ month',
    description: '2 standard home haircuts each month',
  },
  {
    id: 'regular',
    number: '02',
    name: 'Regular',
    credits: 4,
    price: '₦28,000',
    priceNum: 28000,
    period: '/ month',
    description: '4 standard home haircuts, priority booking and a preferred barber when available',
    badge: 'Most flexible',
    isPopular: true,
  },
  {
    id: 'executive',
    number: '03',
    name: 'Executive',
    credits: 4,
    price: '₦35,000',
    priceNum: 35000,
    period: '/ month',
    description: '4 premium grooming appointments, with hair treatment and care',
  },
  {
    id: 'family',
    number: '04',
    name: 'Family',
    credits: 8,
    price: '₦48,000',
    priceNum: 48000,
    period: '/ month',
    description: '8 standard haircut credits shared by registered household members at one address',
  },
];

export const PlansSection: React.FC<PlansSectionProps> = ({ onSelectPlan, onOpenInquiry }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('regular');

  const handlePlanClick = (plan: Plan) => {
    setSelectedPlanId(plan.id);
    onSelectPlan(plan);
  };

  return (
    <section id="plans" className="scroll-mt-24 border-y border-border bg-secondary/50">
      <div className="container-page grid gap-10 py-16 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:py-24">
        {/* Left Info Column */}
        <div className="flex flex-col items-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Monthly, with the numbers up front
          </p>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl text-foreground">
            Your credits. Clearly counted.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Proposed Abuja plans, each with a set number of visits. Pick the rhythm that fits, then ask us about availability.
          </p>

          <div className="mt-8 flex items-center gap-3 rounded-full border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            <UsersRound className="size-5 text-primary" />
            <span>Sharing for eligible households on Family</span>
          </div>
        </div>

        {/* Right Plans List Card */}
        <div className="border text-card-foreground overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-foreground/5">
          <div className="p-0">
            <ul aria-label="Proposed monthly plans" className="divide-y divide-border">
              {plansData.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isRegular = plan.isPopular;

                return (
                  <li
                    key={plan.id}
                    onClick={() => handlePlanClick(plan)}
                    className={`grid gap-3 px-5 py-5 transition-colors duration-200 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7 sm:py-6 cursor-pointer ${
                      isRegular ? 'bg-secondary/70' : 'hover:bg-muted/60'
                    } ${isSelected && !isRegular ? 'bg-accent/40 ring-1 ring-primary/30' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground font-semibold'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {plan.number}
                      </span>
                      <div>
                        <h3 className="flex flex-wrap items-center gap-2 font-semibold tracking-tight text-foreground">
                          {plan.name}
                          {plan.badge && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                              <Check className="size-3" />
                              {plan.badge}
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <p className="pl-11 font-display text-2xl font-medium tracking-tight sm:pl-0 sm:text-right text-foreground">
                      {plan.price}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {plan.period}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* Card Footer */}
            <div className="flex flex-col gap-4 border-t border-border bg-muted/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
                Prices are proposed launch pricing. Extra cuts, premium add-ons and approved out-of-zone visits are priced separately. No unlimited appointments.
              </p>
              <button
                type="button"
                onClick={() => onOpenInquiry('Ask about plans')}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 shrink-0 rounded-full cursor-pointer"
              >
                Ask about plans
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
