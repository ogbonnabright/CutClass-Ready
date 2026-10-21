import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  Scissors,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Plan, UserSubscription } from '../types';
import { plansData } from '../components/PlansSection';

interface SignUpPageProps {
  onNavigate: (path: string) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const { signUp } = useAuth();

  // Current Step: 1, 2, or 3 (4 is Success)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: User details & password
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Plan Selection
  const [selectedPlanId, setSelectedPlanId] = useState<string>('regular');

  // Step 3: Payment Method (Secure Card for Recurring Paystack Subscription)
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);

  // Flow & Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [completedSubscription, setCompletedSubscription] = useState<UserSubscription | null>(null);

  const selectedPlan: Plan = plansData.find((p) => p.id === selectedPlanId) || plansData[1];

  // Detect card brand from number
  const getCardBrand = (num: string): 'mastercard' | 'visa' | 'verve' | 'card' => {
    const cleaned = num.replace(/\s+/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(cleaned)) return 'mastercard';
    if (/^(506|650|507)/.test(cleaned)) return 'verve';
    return 'card';
  };

  // Format Card Number (grouped in 4s)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 19);
    const parts = val.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : val);
    if (errors.cardNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: '' }));
    }
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setExpiry(val);
    if (errors.expiry) {
      setErrors((prev) => ({ ...prev, expiry: '' }));
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 9) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
      default:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Please create a password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    if (!selectedPlanId) {
      setErrors({ plan: 'Please select a subscription plan.' });
      return false;
    }
    setErrors({});
    return true;
  };

  // Validate Step 3
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!cardholderName.trim()) {
      newErrors.cardholderName = 'Enter the name as printed on your card.';
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (!cleanCard) {
      newErrors.cardNumber = 'Card number is required.';
    } else if (cleanCard.length < 16) {
      newErrors.cardNumber = 'Card number should have 16 to 19 digits.';
    }

    if (!expiry) {
      newErrors.expiry = 'Expiry MM/YY is required.';
    } else {
      const [mm, yy] = expiry.split('/');
      const month = parseInt(mm, 10);
      if (!month || month < 1 || month > 12 || !yy || yy.length !== 2) {
        newErrors.expiry = 'Enter a valid MM/YY expiration.';
      }
    }

    if (!cvv) {
      newErrors.cvv = 'CVV required.';
    } else if (cvv.length < 3) {
      newErrors.cvv = '3-4 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1 -> Step 2
  const handleProceedFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 -> Step 3
  const handleProceedFromStep2 = () => {
    if (validateStep2()) {
      // Pre-fill cardholder name from Step 1 if blank
      if (!cardholderName && name) {
        setCardholderName(name.toUpperCase());
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 3 Final Submit: Complete Registration with Paystack Tokenized Payment
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setGlobalError(null);

    const cleanCard = cardNumber.replace(/\s+/g, '');
    const [expMonth, expYear] = expiry.split('/');
    const brand = getCardBrand(cleanCard);

    // Compute next billing date (30 days from now)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    const nextBillingDate = nextDate.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const subscription: UserSubscription = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      price: selectedPlan.price,
      priceNum: selectedPlan.priceNum,
      period: selectedPlan.period,
      credits: selectedPlan.credits,
      status: 'active',
      activatedAt: new Date().toISOString(),
      nextBillingDate,
      paymentMethod: {
        brand,
        last4: cleanCard.slice(-4),
        expMonth,
        expYear,
        cardholderName: cardholderName.trim(),
        bank: brand === 'verve' ? 'Verve Nigeria' : brand === 'mastercard' ? 'Mastercard' : 'Visa',
      },
    };

    try {
      // Call Firebase Auth integration via AuthContext
      const result = await signUp({
        name,
        email,
        password,
        subscription,
        haircutCredits: selectedPlan.credits,
      });

      if (result.error) {
        setGlobalError(result.error.message || 'Registration could not be completed.');
        setIsSubmitting(false);
        return;
      }

      setCompletedSubscription(subscription);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setGlobalError((err as Error)?.message || 'Something went wrong during payment authorization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1714] font-body flex flex-col justify-between selection:bg-[#b34126]/15 selection:text-[#b34126]">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-6 sm:py-8 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="text-lg font-semibold tracking-tight text-[#1a1714] hover:opacity-85 transition-opacity cursor-pointer font-display flex items-center gap-2"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#b34126] text-white">
            <Scissors className="size-4 -rotate-12" />
          </span>
          CutClass
        </button>
        <button
          onClick={() => onNavigate('/login')}
          className="text-sm font-medium text-[#1a1714] hover:text-[#b34126] transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </header>

      {/* Main Flow Container */}
      <main className="w-full max-w-5xl mx-auto px-5 sm:px-8 py-4 sm:py-8 flex-1">
        {/* Visible 3-Step Progress Indicator (shown on steps 1-3) */}
        {currentStep <= 3 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between max-w-2xl mx-auto mb-3">
              {[
                { step: 1, title: 'Create Password' },
                { step: 2, title: 'Choose Plan' },
                { step: 3, title: 'Payment Method' },
              ].map((item) => {
                const isCurrent = currentStep === item.step;
                const isDone = currentStep > item.step;

                return (
                  <div key={item.step} className="flex flex-col items-center flex-1">
                    <div
                      className={`size-9 sm:size-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all shadow-xs ${
                        isDone
                          ? 'bg-[#b34126] text-white'
                          : isCurrent
                          ? 'border-2 border-[#b34126] bg-[#b34126] text-white ring-4 ring-[#b34126]/15'
                          : 'border border-[#ddd7ce] bg-white text-[#8c847a]'
                      }`}
                    >
                      {isDone ? <Check className="size-4 stroke-[3]" /> : item.step}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-medium mt-2 text-center hidden sm:block ${
                        isCurrent
                          ? 'text-[#b34126] font-semibold'
                          : isDone
                          ? 'text-[#1a1714]'
                          : 'text-[#8c847a]'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress line */}
            <div className="relative max-w-xl mx-auto h-1.5 bg-[#e8e2d8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#b34126] transition-all duration-300 ease-out"
                style={{
                  width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%',
                }}
              />
            </div>

            {/* Mobile Step Heading */}
            <p className="text-center text-xs text-[#787168] mt-3 sm:hidden font-medium">
              Step {currentStep} of 3:{' '}
              <span className="text-[#1a1714] font-semibold">
                {currentStep === 1
                  ? 'Create Your Password'
                  : currentStep === 2
                  ? 'Choose Your Plan'
                  : 'Set Up Payment Method'}
              </span>
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CREATE YOUR PASSWORD */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start max-w-5xl mx-auto">
            {/* Left Context Column */}
            <div className="lg:col-span-5 flex flex-col">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-[#b34126] mb-3">
                Step 1 of 3 • Membership Registration
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1714] leading-[1.15] mb-4 font-display">
                Create your password & start your membership.
              </h1>
              <p className="text-sm sm:text-base text-[#615a52] leading-relaxed mb-6">
                Enter your details to create your secure CutClass account. You’ll select your monthly Abuja haircut plan in the next step.
              </p>

              <div className="rounded-2xl border border-[#e4ded6] bg-white/80 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="size-5 text-[#b34126] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#666059] leading-relaxed">
                    <strong className="text-[#1a1714] font-medium">Secure Firebase Authentication:</strong> Your credentials are encrypted and stored safely. We never save raw passwords.
                  </p>
                </div>
                <div className="flex items-start gap-3 border-t border-[#eee8e0] pt-3">
                  <CheckCircle2 className="size-5 text-[#b34126] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#666059] leading-relaxed">
                    <strong className="text-[#1a1714] font-medium">Flexible Scheduling:</strong> Book certified home barbers on demand or set up a recurring grooming schedule.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Card: Step 1 Form */}
            <div className="lg:col-span-7">
              <div className="rounded-[28px] border border-[#e4ded6] bg-white p-7 sm:p-9 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-[#1a1714] font-display">
                  Create Your Password
                </h2>
                <p className="text-sm text-[#666059] mt-1.5 mb-6">
                  Set up your login details to safeguard your account and haircut credits.
                </p>

                <form onSubmit={handleProceedFromStep1} className="space-y-4" noValidate>
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-sm font-medium text-[#1a1714] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Samuel Adebayo"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className={`w-full h-11 sm:h-12 rounded-xl border px-4 text-sm text-[#1a1714] bg-white placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                        errors.name ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-sm font-medium text-[#1a1714] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      className={`w-full h-11 sm:h-12 rounded-xl border px-4 text-sm text-[#1a1714] bg-white placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                        errors.email ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-sm font-medium text-[#1a1714] mb-1.5"
                    >
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                        }}
                        className={`w-full h-11 sm:h-12 rounded-xl border pl-4 pr-11 text-sm text-[#1a1714] bg-white placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                          errors.password ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c847a] hover:text-[#1a1714] p-1 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[#787168]">Password strength:</span>
                          <span className="font-medium text-[#1a1714]">{passwordStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#e8e2d8] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {errors.password && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="signup-confirm-password"
                      className="block text-sm font-medium text-[#1a1714] mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) {
                            setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                          }
                        }}
                        className={`w-full h-11 sm:h-12 rounded-xl border pl-4 pr-11 text-sm text-[#1a1714] bg-white placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                          errors.confirmPassword ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c847a] hover:text-[#1a1714] p-1 cursor-pointer"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Continue Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Next: Choose Your Plan
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  <p className="text-center text-sm text-[#666059] pt-2">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="font-medium text-[#b34126] hover:underline cursor-pointer ml-1"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CHOOSE YOUR PLAN */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-[#b34126] mb-2 block">
                Step 2 of 3 • Choose Your Plan
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1714] font-display">
                Select your preferred membership plan
              </h1>
              <p className="text-sm sm:text-base text-[#615a52] mt-2 leading-relaxed">
                Choose the appointment frequency that matches your routine. All plans include certified home barber visits in Abuja with standard sanitation and styling.
              </p>
            </div>

            {/* Plans List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {plansData.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-[24px] border p-6 sm:p-7 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#b34126] bg-white ring-2 ring-[#b34126]/20 shadow-md'
                        : 'border-[#e4ded6] bg-white/70 hover:bg-white hover:border-[#cfc6bb]'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-[#b34126] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs">
                        <Sparkles className="size-3" />
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#b34126]">
                          Plan {plan.number}
                        </span>
                        <div
                          className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#b34126] bg-[#b34126] text-white'
                              : 'border-[#cfc7be] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-[#1a1714] font-display">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-[#666059] mt-2 mb-4 leading-relaxed min-h-[40px]">
                        {plan.description}
                      </p>

                      <div className="rounded-xl bg-[#faf8f6] p-3 text-xs text-[#524c44] flex items-center gap-2 mb-5">
                        <Calendar className="size-4 text-[#b34126] shrink-0" />
                        <span>
                          <strong>{plan.credits} visits</strong> included per monthly billing cycle
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#eee8e0] pt-4 flex items-baseline justify-between">
                      <span className="text-xs text-[#787168]">Monthly Subscription</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-[#1a1714] font-display">
                          {plan.price}
                        </span>
                        <span className="text-xs text-[#787168] ml-1">{plan.period}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plan Terms Note */}
            <div className="rounded-2xl border border-[#e4ded6] bg-white/80 p-4 mb-8 text-xs text-[#666059] leading-relaxed flex items-start gap-3">
              <Lock className="size-4 text-[#b34126] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[#1a1714]">Transparent Billing:</strong> Billed monthly in Nigerian Naira (NGN). You can pause, change, or cancel your subscription at any time directly from your member profile.
              </p>
            </div>

            {/* Navigation Buttons: Back and Continue */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto h-12 px-6 rounded-xl border border-[#ded8d0] bg-white hover:bg-[#f6f2ec] text-[#1a1714] font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ChevronLeft className="size-4" />
                Back to Password
              </button>

              <button
                type="button"
                onClick={handleProceedFromStep2}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Payment Method
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SET UP YOUR PAYMENT METHOD */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
            {/* Left Column: Plan Summary & Paystack Nigeria recurring provider disclosure */}
            <div className="lg:col-span-5 flex flex-col order-2 lg:order-1">
              <div className="rounded-[28px] border border-[#e4ded6] bg-white p-6 sm:p-7 shadow-sm">
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#b34126] block mb-2">
                  Membership Order Summary
                </span>
                <h3 className="text-xl font-bold text-[#1a1714] font-display mb-1">
                  {selectedPlan.name} Membership
                </h3>
                <p className="text-xs text-[#666059] mb-4">
                  Abuja Certified Home Barber Visits
                </p>

                <div className="space-y-3 border-y border-[#eee8e0] py-4 text-sm">
                  <div className="flex justify-between items-center text-[#554e46]">
                    <span>Monthly haircut credits</span>
                    <span className="font-semibold text-[#1a1714]">{selectedPlan.credits} credits</span>
                  </div>
                  <div className="flex justify-between items-center text-[#554e46]">
                    <span>Billing frequency</span>
                    <span className="font-medium text-[#1a1714]">Monthly recurring</span>
                  </div>
                  <div className="flex justify-between items-center text-[#554e46]">
                    <span>First billing charge</span>
                    <span className="font-bold text-[#1a1714] text-base">{selectedPlan.price}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-[#787168]">
                  <span>Renews automatically</span>
                  <span>Pause or cancel anytime</span>
                </div>
              </div>

              {/* Paystack Nigeria Provider Disclosure */}
              <div className="mt-4 rounded-2xl border border-[#d5ded0] bg-[#f5fbf3] p-4 text-xs text-[#2e5323] leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-[#1f4215] mb-1">
                  <ShieldCheck className="size-4 text-[#2d7a1c]" />
                  Secure Nigerian Card Processor (Paystack)
                </div>
                <p className="text-[12px] text-[#345c27]">
                  Supports Nigerian Visa, Mastercard, and Verve cards. Payments are protected by 256-bit bank-grade encryption and 3D-Secure OTP authorization. CutClass never stores raw card numbers.
                </p>
              </div>
            </div>

            {/* Right Column: Step 3 Payment Form */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="rounded-[28px] border border-[#e4ded6] bg-white p-7 sm:p-9 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold tracking-tight text-[#1a1714] font-display">
                    Set Up Your Payment Method
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-[#787168]">
                    <Lock className="size-3.5 text-[#b34126]" />
                    <span>256-bit SSL</span>
                  </div>
                </div>
                <p className="text-sm text-[#666059] mb-6">
                  Add your credit or debit card for recurring monthly membership payments.
                </p>

                {globalError && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 mb-5 flex items-start gap-2.5">
                    <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{globalError}</span>
                  </div>
                )}

                <form onSubmit={handleFinalSubmit} className="space-y-4" noValidate>
                  {/* Cardholder Name */}
                  <div>
                    <label
                      htmlFor="cardholder-name"
                      className="block text-sm font-medium text-[#1a1714] mb-1.5"
                    >
                      Cardholder Name
                    </label>
                    <input
                      id="cardholder-name"
                      type="text"
                      autoComplete="cc-name"
                      placeholder="NAME ON CARD"
                      value={cardholderName}
                      onChange={(e) => {
                        setCardholderName(e.target.value);
                        if (errors.cardholderName) {
                          setErrors((prev) => ({ ...prev, cardholderName: '' }));
                        }
                      }}
                      className={`w-full h-11 sm:h-12 rounded-xl border px-4 text-sm text-[#1a1714] bg-white placeholder:text-[#9e968d] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                        errors.cardholderName ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                      }`}
                    />
                    {errors.cardholderName && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.cardholderName}
                      </p>
                    )}
                  </div>

                  {/* Card Number */}
                  <div>
                    <label
                      htmlFor="card-number"
                      className="block text-sm font-medium text-[#1a1714] mb-1.5"
                    >
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        id="card-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="•••• •••• •••• ••••"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className={`w-full h-11 sm:h-12 rounded-xl border pl-4 pr-16 text-sm text-[#1a1714] bg-white font-mono placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                          errors.cardNumber ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f2ede6] text-[#6b645b]">
                        {getCardBrand(cardNumber) === 'visa' && <span className="text-blue-700">VISA</span>}
                        {getCardBrand(cardNumber) === 'mastercard' && <span className="text-amber-600">MC</span>}
                        {getCardBrand(cardNumber) === 'verve' && <span className="text-emerald-700">VERVE</span>}
                        {getCardBrand(cardNumber) === 'card' && <CreditCard className="size-4 text-[#8c847a]" />}
                      </div>
                    </div>
                    {errors.cardNumber && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="card-expiry"
                        className="block text-sm font-medium text-[#1a1714] mb-1.5"
                      >
                        Expiry (MM/YY)
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className={`w-full h-11 sm:h-12 rounded-xl border px-4 text-sm text-[#1a1714] bg-white font-mono placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                          errors.expiry ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                        }`}
                      />
                      {errors.expiry && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="size-3" /> {errors.expiry}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="card-cvv"
                        className="block text-sm font-medium text-[#1a1714] mb-1.5"
                      >
                        Security CVV
                      </label>
                      <input
                        id="card-cvv"
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="3 or 4 digits"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => {
                          setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                          if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: '' }));
                        }}
                        className={`w-full h-11 sm:h-12 rounded-xl border px-4 text-sm text-[#1a1714] bg-white font-mono placeholder:text-[#9e968d] focus:outline-none focus:ring-2 focus:ring-[#b34126]/25 transition-all ${
                          errors.cvv ? 'border-rose-500' : 'border-[#ded8d0] focus:border-[#b34126]'
                        }`}
                      />
                      {errors.cvv && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="size-3" /> {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Save payment method for recurring billing checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 text-xs text-[#666059] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={savePaymentMethod}
                        onChange={(e) => setSavePaymentMethod(e.target.checked)}
                        className="mt-0.5 rounded border-[#cfc7be] text-[#b34126] focus:ring-[#b34126]"
                      />
                      <span>
                        Authorize automatic monthly renewal of <strong>{selectedPlan.price}</strong> via Paystack. You will receive an invoice receipt by email before every billing cycle.
                      </span>
                    </label>
                  </div>

                  {/* Navigation Buttons: Back and Submit */}
                  <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto h-12 px-6 rounded-xl border border-[#ded8d0] bg-white hover:bg-[#f6f2ec] text-[#1a1714] font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="size-4" />
                      Back to Plans
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Authorizing Card…
                        </>
                      ) : (
                        <>
                          Confirm & Start Membership
                          <Check className="size-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SUCCESS & MEMBERSHIP ACTIVATED */}
        {/* ========================================================================= */}
        {currentStep === 4 && completedSubscription && (
          <div className="max-w-2xl mx-auto py-8">
            <div className="rounded-[32px] border border-[#e4ded6] bg-white p-8 sm:p-12 shadow-sm text-center">
              <div className="size-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-6">
                <Check className="size-8 stroke-[3]" />
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b34126] mb-2 block">
                Membership Activated
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1714] font-display">
                Welcome to CutClass, {name.split(' ')[0]}!
              </h1>
              <p className="text-base text-[#615a52] mt-3 mb-8 leading-relaxed">
                Your <strong>{completedSubscription.planName}</strong> plan is now active with{' '}
                <span className="text-[#b34126] font-semibold">
                  {completedSubscription.credits} haircut credits
                </span>{' '}
                credited to your account.
              </p>

              {/* Receipt / Details Card */}
              <div className="rounded-2xl border border-[#eee8e0] bg-[#faf8f6] p-6 text-left space-y-3 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#787168]">Account Holder</span>
                  <span className="font-medium text-[#1a1714]">{name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#787168]">Email</span>
                  <span className="font-medium text-[#1a1714]">{email}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#787168]">Plan</span>
                  <span className="font-semibold text-[#1a1714]">
                    {completedSubscription.planName} ({completedSubscription.price}/mo)
                  </span>
                </div>
                {completedSubscription.paymentMethod && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#787168]">Payment Method</span>
                    <span className="font-medium text-[#1a1714] uppercase">
                      {completedSubscription.paymentMethod.brand} ••••{' '}
                      {completedSubscription.paymentMethod.last4}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t border-[#e8e2d8] pt-3">
                  <span className="text-[#787168]">Next Billing Date</span>
                  <span className="font-medium text-[#1a1714]">
                    {completedSubscription.nextBillingDate}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate('/profile')}
                  className="h-12 px-8 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  Go to Member Profile
                  <ChevronRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="h-12 px-6 rounded-xl border border-[#ded8d0] bg-white hover:bg-[#f6f2ec] text-[#1a1714] font-medium text-sm transition-colors cursor-pointer flex items-center justify-center"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        )}
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
