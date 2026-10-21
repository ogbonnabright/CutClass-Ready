import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scissors, Check, Mail, Sparkles } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
  onOpenAvailability: () => void;
  onOpenInquiry: (topic?: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  onOpenAvailability,
  onOpenInquiry,
}) => {
  const { user, isPending, signOut, sendVerificationEmail, verifyUserEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    setSentNotice(false);
    const result = await sendVerificationEmail(user.email);
    setResending(false);
    if (result.error) {
      window.alert(result.error.message);
      return;
    }
    setSentNotice(true);
  };

  const handleRefreshVerification = async () => {
    try {
      await verifyUserEmail();
    } catch {
      window.alert('Could not refresh verification status. Please try again.');
    }
  };

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center px-gutter bg-background">
        <p className="text-muted-foreground animate-pulse">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-gutter py-12 bg-background">
        <div className="w-full max-w-md rounded-xl border border-border/60 bg-card/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Scissors className="size-6 -rotate-12" />
            </div>
            <h2 className="text-2xl font-display font-semibold text-foreground">Not signed in</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to view your profile</p>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('/login')}
              className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="mt-3 inline-flex w-full items-center justify-center whitespace-nowrap rounded-md border border-input py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              Back to CutClass
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-gutter py-6 sm:py-10">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 border-b border-border pb-4">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="size-4 -rotate-12" />
          </span>
          CutClass
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline-block"
          >
            Home
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              onNavigate('/login');
            }}
            className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Profile Body */}
      <div className="mx-auto w-full max-w-5xl py-8 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
          {/* Left Column: Account & Verification */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Your account
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-2xl font-semibold text-primary">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground truncate">
                  {user.name}
                </h1>
                <p className="break-all text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Separator */}
            <div className="my-6 shrink-0 bg-border h-[1px] w-full" />

            {/* Verification State */}
            {user.emailVerified ? (
              <output className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                Your email is verified.
              </output>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    Verify your email
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Confirm <span className="font-medium text-foreground">{user.email}</span> using a verification link. If you haven’t received an email, request one below.
                  </p>

                  {sentNotice && (
                    <output className="rounded bg-primary/10 p-2 text-xs text-primary font-medium">
                      Check your inbox for your verification link.
                    </output>
                  )}

                  <div className="flex flex-col gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {resending ? 'Sending…' : 'Resend verification email'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshVerification}
                      className="text-xs text-primary underline-offset-4 hover:underline text-center cursor-pointer"
                    >
                      (I have verified my email — refresh status)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fast actions */}
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Launch Status
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                CutClass is preparing initial barber dispatches in Abuja. Need an urgent visit or have questions?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInquiry('Booking inquiry for account')}
                  className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  Contact Concierge
                </button>
                <button
                  type="button"
                  onClick={onOpenAvailability}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Check Abuja Zones
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Account Details & Credits */}
          <div className="space-y-6">
            {/* Account Details Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="pb-2">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Account details
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This information belongs to your signed-in account.
                </p>
              </div>

              <div className="grid gap-3 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{user.name}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="break-all font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Registration</span>
                  <span className="font-medium text-foreground">Nationwide Nigeria</span>
                </div>
              </div>
            </div>

            {/* Subscription and Haircut Credits Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Subscription and haircut credits
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.subscription
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {user.subscription ? 'Active Membership' : 'Pre-launch'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.subscription
                    ? 'Recurring monthly Abuja home haircut membership.'
                    : 'Only confirmed payments can activate subscription access or credits.'}
                </p>
              </div>

              <div className="grid gap-4 pt-4">
                {user.subscription ? (
                  <>
                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Active Plan</span>
                      <span className="font-bold text-foreground">
                        {user.subscription.planName} ({user.subscription.price}{user.subscription.period})
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Available haircut credits</span>
                      <span className="font-semibold tabular-nums text-primary text-xl">
                        {user.haircutCredits ?? user.subscription.credits}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span className="font-medium text-foreground">
                        {user.subscription.nextBillingDate}
                      </span>
                    </div>

                    {user.subscription.paymentMethod && (
                      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                        <span className="text-muted-foreground">Payment method</span>
                        <span className="font-medium text-foreground uppercase">
                          {user.subscription.paymentMethod.brand} •••• {user.subscription.paymentMethod.last4}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenInquiry('Book a haircut with my subscription credits')}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        <Scissors className="size-4 -rotate-12" />
                        Book a haircut
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg bg-secondary/60 p-3.5 text-xs text-muted-foreground leading-relaxed">
                      Subscription plans are proposed launch pricing for Abuja, Nigeria. As soon as your address is confirmed with dispatch, credits will be activated on your account.
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Available haircut credits</span>
                      <span className="font-semibold tabular-nums text-foreground text-lg">0</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">Active subscription</span>
                      <span className="font-medium text-muted-foreground">None yet</span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('/signup')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        <Sparkles className="size-4" />
                        Choose a membership plan
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
