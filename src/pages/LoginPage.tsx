import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scissors } from 'lucide-react';

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
    <div className="min-h-screen bg-background px-gutter py-6 sm:py-10 flex flex-col justify-between">
      {/* Auth Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-border pb-4">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="size-4 -rotate-12" />
          </span>
          CutClass
        </button>
        <button
          onClick={() => onNavigate('/signup')}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
        >
          Create account
        </button>
      </header>

      {/* Main Card */}
      <div className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-md items-center justify-center py-10">
        <div className="rounded-xl border text-card-foreground w-full border-border bg-card shadow-xl shadow-foreground/5">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="font-semibold tracking-tight font-display text-2xl text-foreground">
              Welcome back
            </div>
            <div className="text-sm text-muted-foreground">
              Use the email address and password for your account.
            </div>
          </div>

          <div className="p-6 pt-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <label
                htmlFor="sign-in-email"
                className="text-sm font-medium leading-none text-foreground"
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
                aria-invalid={!!errorMessage || undefined}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />

              <label
                htmlFor="sign-in-password"
                className="text-sm font-medium leading-none text-foreground mt-1"
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
                aria-invalid={!!errorMessage || undefined}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />

              {errorMessage && (
                <p role="alert" className="text-sm text-destructive mt-1">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 rounded-md px-4 py-2 w-full mt-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="text-center text-sm text-muted-foreground mt-2">
                New to CutClass?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/signup')}
                  className="font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Auth Footer */}
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-border pt-5 text-sm text-muted-foreground">
        <span>© CutClass</span>
        <button
          onClick={() => onNavigate('/')}
          className="font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
        >
          Back to CutClass
        </button>
      </footer>
    </div>
  );
};
