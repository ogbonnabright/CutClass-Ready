import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, Scissors } from 'lucide-react';

interface SiteNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenInquiry: (initialTopic?: string) => void;
  onOpenAvailability: () => void;
}

export const SiteNav: React.FC<SiteNavProps> = ({
  currentPath,
  onNavigate,
  onOpenInquiry,
  onOpenAvailability,
}) => {
  const { user, isPending, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      if (currentPath !== '/') {
        onNavigate('/');
        setTimeout(() => {
          const el = document.querySelector(href);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(href);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleLinkClick('/')}
            className="flex items-center gap-2 text-left font-display text-base font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="size-4 -rotate-12" />
            </span>
            <span className="text-foreground">CutClass</span>
          </button>

          {currentPath === '/' && (
            <div className="hidden items-center gap-1 md:flex">
              <button
                onClick={() => handleLinkClick('#experience')}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Experience
              </button>
              <button
                onClick={() => handleLinkClick('#how-it-works')}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                How it works
              </button>
              <button
                onClick={() => handleLinkClick('#plans')}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Plans
              </button>
              <button
                onClick={() => handleLinkClick('#service-area')}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Service area
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Auth nav */}
          {!isPending && (
            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <>
                  <button
                    onClick={() => handleLinkClick('/profile')}
                    className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      currentPath === '/profile'
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    My account
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      onNavigate('/');
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleLinkClick('/login')}
                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleLinkClick('/signup')}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform duration-150 hover:bg-primary/90 hover:scale-[1.02]"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-md border border-input bg-background text-foreground sm:hidden"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-4 py-4 sm:hidden animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleLinkClick('/')}
              className="text-left rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Home
            </button>
            <button
              onClick={() => handleLinkClick('#experience')}
              className="text-left rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              The CutClass Approach
            </button>
            <button
              onClick={() => handleLinkClick('#how-it-works')}
              className="text-left rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              How it works
            </button>
            <button
              onClick={() => handleLinkClick('#plans')}
              className="text-left rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Monthly plans
            </button>
            <button
              onClick={() => handleLinkClick('#service-area')}
              className="text-left rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Service area & coverage
            </button>

            <div className="my-2 border-t border-border pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => handleLinkClick('/profile')}
                    className="w-full text-left rounded-md px-3 py-2 text-sm font-medium bg-accent"
                  >
                    My account ({user.name})
                  </button>
                  <button
                    onClick={async () => {
                      await signOut();
                      setMobileMenuOpen(false);
                      onNavigate('/');
                    }}
                    className="w-full text-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleLinkClick('/login')}
                    className="w-full rounded-md border border-input py-2 text-center text-sm font-medium hover:bg-accent"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleLinkClick('/signup')}
                    className="w-full rounded-md bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
