import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SiteNav } from './components/SiteNav';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProfilePage } from './pages/ProfilePage';
import { InquiryModal } from './components/InquiryModal';
import { AvailabilityModal } from './components/AvailabilityModal';
import { Plan } from './types';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryTopic, setInquiryTopic] = useState('Ask about plans');
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path.startsWith('/#') || path.startsWith('#')) {
      const hash = path.startsWith('/#') ? path.slice(1) : path;
      window.history.pushState(null, '', hash);
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInquiry = (topic?: string) => {
    if (topic) setInquiryTopic(topic);
    setInquiryOpen(true);
  };

  const handleSelectPlan = (plan: Plan) => {
    setInquiryTopic(`${plan.name} Plan (${plan.price}/month - ${plan.credits} visits)`);
    setInquiryOpen(true);
  };

  const isAuthPage = currentPath === '/login' || currentPath === '/signup';

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background font-body text-foreground antialiased">
          {/* Site Nav is displayed on main pages; login and signup have their own header matching original */}
          {!isAuthPage && (
            <SiteNav
              currentPath={currentPath}
              onNavigate={navigate}
              onOpenInquiry={handleOpenInquiry}
              onOpenAvailability={() => setAvailabilityOpen(true)}
            />
          )}

          {currentPath === '/login' && <LoginPage onNavigate={navigate} />}
          {currentPath === '/signup' && <SignUpPage onNavigate={navigate} />}
          {currentPath === '/profile' && (
            <ProfilePage
              onNavigate={navigate}
              onOpenAvailability={() => setAvailabilityOpen(true)}
              onOpenInquiry={handleOpenInquiry}
            />
          )}
          {currentPath === '/' && (
            <HomePage
              onNavigate={navigate}
              onOpenInquiry={handleOpenInquiry}
              onOpenAvailability={() => setAvailabilityOpen(true)}
              onSelectPlan={handleSelectPlan}
            />
          )}

          {/* Interactive Modals */}
          <InquiryModal
            isOpen={inquiryOpen}
            onClose={() => setInquiryOpen(false)}
            initialTopic={inquiryTopic}
          />

          <AvailabilityModal
            isOpen={availabilityOpen}
            onClose={() => setAvailabilityOpen(false)}
            onOpenInquiry={handleOpenInquiry}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
