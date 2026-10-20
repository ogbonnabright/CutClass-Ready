import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { ExperienceSection } from '../components/ExperienceSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { PlansSection } from '../components/PlansSection';
import { ServiceAreaSection } from '../components/ServiceAreaSection';
import { CtaSection } from '../components/CtaSection';
import { SiteFooter } from '../components/SiteFooter';
import { Plan } from '../types';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenInquiry: (initialTopic?: string) => void;
  onOpenAvailability: () => void;
  onSelectPlan: (plan: Plan) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenInquiry,
  onOpenAvailability,
  onSelectPlan,
}) => {
  return (
    <main>
      <HeroSection onNavigate={onNavigate} onOpenInquiry={onOpenInquiry} />
      <ExperienceSection />
      <HowItWorksSection />
      <PlansSection onSelectPlan={onSelectPlan} onOpenInquiry={onOpenInquiry} />
      <ServiceAreaSection onOpenAvailability={onOpenAvailability} />
      <CtaSection onOpenInquiry={onOpenInquiry} />
      <SiteFooter onNavigate={onNavigate} onOpenAvailability={onOpenAvailability} />
    </main>
  );
};
