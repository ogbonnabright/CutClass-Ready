import React from 'react';

interface SiteFooterProps {
  onNavigate: (path: string) => void;
  onOpenAvailability: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate, onOpenAvailability }) => {
  const handleApproachClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('/#experience');
    const el = document.getElementById('experience');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border bg-background">
      <nav
        aria-label="Footer"
        className="container-page flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-6">
          <a
            href="/#experience"
            onClick={handleApproachClick}
            className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            The CutClass approach
          </a>
          <span>© CutClass</span>
        </div>

        <button
          type="button"
          onClick={onOpenAvailability}
          className="font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
        >
          Ask us about service coverage
        </button>
      </nav>
    </footer>
  );
};
