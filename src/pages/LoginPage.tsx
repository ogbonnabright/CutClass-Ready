import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMessage(error.message || 'Could not sign in. Check your details.');
        setIsLoading(false);
        return;
      }
      onNavigate('/profile');
    } catch {
      setErrorMessage('Could not sign in. Check your details and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1714] font-body flex flex-col justify-between selection:bg-[#b34126]/15 selection:text-[#b34126]">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-6 sm:py-8 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="text-lg font-semibold tracking-tight text-[#1a1714] hover:opacity-85 transition-opacity cursor-pointer font-display"
        >
          CutClass
        </button>
        <button
          onClick={() => onNavigate('/signup')}
          className="text-sm font-medium text-[#1a1714] hover:text-[#b34126] transition-colors cursor-pointer"
        >
          Create account
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-6 sm:py-10 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-20 items-start">
          {/* Left Column: Heading and description */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-[#b34126] mb-3">
              Your CutClass Account
            </span>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1a1714] leading-[1.12] mb-5 font-display">
              Your routine, ready<br />when you are.
            </h1>

            <p className="text-base text-[#615a52] leading-relaxed max-w-lg mb-8">
              Sign in to review your account. Subscription access and haircut credits are enabled only after a confirmed payment for an available plan.
            </p>
          </div>

          {/* Right Column: Sign in card */}
          <div className="lg:col-span-6 xl:col-span-6 w-full max-w-xl mx-auto lg:max-w-none">
            <div className="rounded-[28px] border border-[#e4ded6] bg-white p-7 sm:p-10 shadow-sm">
              <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1a1714] font-display">
                Welcome back
              </h2>
              <p className="text-sm text-[#666059] mt-2 mb-7 leading-relaxed">
                Use the email address and password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="sign-in-email"
                    className="block text-sm font-medium text-[#1a1714] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="sign-in-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 sm:h-12 rounded-xl border border-[#ded8d0] px-4 text-sm text-[#1a1714] bg-white placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 focus:border-[#b34126] transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sign-in-password"
                    className="block text-sm font-medium text-[#1a1714] mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="sign-in-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 sm:h-12 rounded-xl border border-[#ded8d0] px-4 text-sm text-[#1a1714] bg-white focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 focus:border-[#b34126] transition-all"
                  />
                </div>

                {errorMessage && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center mt-6 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </button>

                <p className="text-center text-sm text-[#666059] pt-2">
                  New to CutClass?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/signup')}
                    className="font-medium text-[#b34126] hover:underline cursor-pointer ml-1"
                  >
                    Create an account
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer with Divider Line */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 border-t border-[#eee9e2] py-6 flex items-center justify-between text-sm">
        <span className="text-[#787168]">© CutClass</span>
        <button
          onClick={() => onNavigate('/')}
          className="text-[#b34126] font-medium hover:underline cursor-pointer"
        >
          Back to CutClass
        </button>
      </footer>
    </div>
  );
};
