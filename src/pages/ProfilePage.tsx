import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scissors,
  Check,
  Mail,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  RotateCcw,
  XCircle,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  PlusCircle,
  HelpCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { Appointment, CreditTransaction } from '../types';
import { bookingApi } from '../services/bookingApi';
import { BookingModal } from '../components/booking/BookingModal';
import { AppointmentCard } from '../components/booking/AppointmentCard';
import { RescheduleModal } from '../components/booking/RescheduleModal';
import { SafetyReportModal } from '../components/booking/SafetyReportModal';

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
  const { user, isPending, signOut, sendVerificationEmail, verifyUserEmail, updateSubscription } =
    useAuth();

  const [resending, setResending] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  // Booking system state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [appointments, setAppointments] = useState<{
    upcoming: Appointment[];
    past: Appointment[];
    cancelled: Appointment[];
    all: Appointment[];
  }>({ upcoming: [], past: [], cancelled: [], all: [] });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Tab filtering: 'upcoming' | 'completed' | 'cancelled' | 'transactions'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled' | 'transactions'>('upcoming');

  // Interactive modals
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null);
  const [selectedSafetyApt, setSelectedSafetyApt] = useState<Appointment | null>(null);
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);

  // Load bookings and credit ledger
  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingDashboard(true);
    try {
      const data = await bookingApi.getMemberDashboardData(user.id);
      setAppointments(data.appointments);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    setSentNotice(false);
    const result = await sendVerificationEmail(user.email);
    setResending(false);
    if (result.error) {
      alert(result.error.message);
      return;
    }
    setSentNotice(true);
  };

  const handleRefreshVerification = async () => {
    try {
      await verifyUserEmail();
    } catch {
      alert('Could not refresh verification status. Please try again.');
    }
  };

  // Cancel an appointment with 12h policy check
  const handleCancelAppointment = async (apt: Appointment) => {
    if (!user) return;
    const aptDate = new Date(`${apt.date}T${apt.time}:00`);
    const hoursRemaining = (aptDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const willRestore = hoursRemaining >= 12;

    const confirmMsg = willRestore
      ? `Are you sure you want to cancel booking ${apt.bookingRef}? Because this is at least 12 hours ahead, your 1 haircut credit will be restored to your account.`
      : `Warning: This appointment is scheduled in less than 12 hours (${hoursRemaining.toFixed(0)}h remaining). According to CutClass policy, late cancellations forfeit the haircut credit. Do you still wish to cancel?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await bookingApi.cancelBooking(apt.id, user.id, 'Cancelled by member via dashboard');
      setCancellationNotice(res.message);

      // If credit was restored, update local auth user balance
      if (res.creditRestored) {
        if (user.subscription) {
          updateSubscription({
            ...user.subscription,
            credits: (user.haircutCredits || 0) + 1,
          });
        }
      }

      loadDashboardData();
      setTimeout(() => setCancellationNotice(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to cancel appointment.');
    }
  };

  // Called when BookingModal successfully creates an appointment
  const handleBookingSuccess = (newCredits: number) => {
    if (user && user.subscription) {
      updateSubscription({
        ...user.subscription,
        credits: newCredits,
      });
    }
    loadDashboardData();
  };

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#faf8f6]">
        <p className="text-[#8c847a] animate-pulse">Loading Member Dashboard…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#faf8f6]">
        <div className="w-full max-w-md rounded-[28px] border border-[#e4ded6] bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#f2ede6] text-[#b34126]">
            <Scissors className="size-6 -rotate-12" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[#1a1714]">Member Sign In</h2>
          <p className="text-sm text-[#666059] mt-2 mb-6">
            Sign in to access your CutClass membership, available credits, and appointment bookings.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('/login')}
              className="w-full h-11 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Sign In to Your Account
            </button>
            <button
              onClick={() => onNavigate('/signup')}
              className="w-full h-11 rounded-xl border border-[#ded8d0] bg-white text-[#1a1714] font-medium text-sm hover:bg-[#faf8f6] transition-colors cursor-pointer"
            >
              Start New Membership
            </button>
          </div>
        </div>
      </main>
    );
  }

  const nextAppointment = appointments.upcoming[0];
  const creditsAvailable = user.haircutCredits !== undefined ? user.haircutCredits : (user.subscription ? user.subscription.credits : 0);
  const creditsUsed = (user.creditsUsed || 0) + appointments.past.length;

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1714] font-body flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-[#eee8e0] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 font-display text-base font-semibold text-[#1a1714] cursor-pointer"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#b34126] text-white">
              <Scissors className="size-4 -rotate-12" />
            </span>
            CutClass Member Portal
          </button>

          {/* Quick Portal Switcher (For Evaluation & Multi-role Access) */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center rounded-xl bg-[#f2ede6] p-1 text-xs">
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-white font-semibold text-[#1a1714] shadow-2xs"
              >
                👤 Member
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/barber')}
                className="px-2.5 py-1 rounded-lg text-[#666059] hover:text-[#1a1714] cursor-pointer font-medium"
              >
                ✂️ Barber Portal
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="px-2.5 py-1 rounded-lg text-[#666059] hover:text-[#1a1714] cursor-pointer font-medium"
              >
                🛡️ Admin
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                onNavigate('/login');
              }}
              className="text-xs text-[#787168] hover:text-[#b34126] font-medium transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        {/* Notice Banner */}
        {cancellationNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-700" />
              <span>{cancellationNotice}</span>
            </div>
            <button onClick={() => setCancellationNotice(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Member Profile & Subscription Banner */}
        <div className="rounded-[28px] border border-[#e4ded6] bg-white p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-[#f2ede6] text-[#b34126] flex items-center justify-center font-display text-2xl font-bold border-2 border-[#e4ded6]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold font-display text-[#1a1714]">
                    {user.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      user.subscription
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {user.subscription ? `${user.subscription.planName} Active` : 'No Active Plan'}
                  </span>
                  {user.emailVerified && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Verified Email
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#666059] mt-1">
                  {user.email} • Abuja Home Dispatch Member
                </p>
                {user.subscription && (
                  <p className="text-xs text-[#787168] mt-1">
                    Billed {user.subscription.price}/month • Renews on {user.subscription.nextBillingDate}
                    {user.subscription.paymentMethod && (
                      <span className="ml-2 uppercase">
                        ({user.subscription.paymentMethod.brand} •••• {user.subscription.paymentMethod.last4})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Prominent Action Button: Book a Haircut */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {user.subscription ? (
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scissors className="size-4 -rotate-12" />
                  Book a Haircut
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('/signup')}
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  Activate Membership Plan
                </button>
              )}
            </div>
          </div>

          {/* Credits Counter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#eee8e0]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
                Available Credits
              </span>
              <p className="text-3xl font-bold font-display text-[#b34126] mt-1">
                {creditsAvailable}
              </p>
              <span className="text-[11px] text-[#787168]">Ready for booking</span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
                Credits Used
              </span>
              <p className="text-3xl font-bold font-display text-[#1a1714] mt-1">
                {creditsUsed}
              </p>
              <span className="text-[11px] text-[#787168]">Historical appointments</span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
                Upcoming Visits
              </span>
              <p className="text-3xl font-bold font-display text-emerald-700 mt-1">
                {appointments.upcoming.length}
              </p>
              <span className="text-[11px] text-[#787168]">Scheduled home cuts</span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
                Service Area
              </span>
              <p className="text-lg font-bold font-display text-[#1a1714] mt-2">
                Abuja, FCT
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">Active coverage</span>
            </div>
          </div>
        </div>

        {/* Next Appointment Card (Prominent Callout if Scheduled) */}
        {nextAppointment && (
          <div className="mb-8 rounded-[28px] border-2 border-[#b34126]/30 bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#b34126] flex items-center gap-1.5">
                <Clock className="size-4" /> Next Upcoming Appointment
              </span>
              <span className="font-mono text-xs font-bold bg-[#faf0eb] text-[#b34126] px-2.5 py-0.5 rounded">
                {nextAppointment.bookingRef}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-display text-[#1a1714]">
                  {nextAppointment.serviceName}
                </h3>
                <p className="text-xs text-[#524c44]">
                  Barber: <strong className="text-[#1a1714]">{nextAppointment.barberName}</strong> • Date:{' '}
                  <strong className="text-[#1a1714]">{nextAppointment.date} at {nextAppointment.time}</strong>
                </p>
                <p className="text-xs text-[#787168]">
                  Address: {nextAppointment.address}, {nextAppointment.district}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRescheduleApt(nextAppointment)}
                  className="h-10 px-4 rounded-xl border border-[#ded8d0] bg-white text-xs font-medium text-[#1a1714] hover:bg-[#faf8f6] cursor-pointer"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelAppointment(nextAppointment)}
                  className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-700 text-xs font-medium hover:bg-rose-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation for Booking History & Transactions */}
        <div className="flex items-center gap-2 border-b border-[#eee8e0] pb-3 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-[#b34126] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Upcoming Bookings ({appointments.upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#b34126] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Completed ({appointments.past.length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'cancelled'
                ? 'bg-[#b34126] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Cancelled & Missed ({appointments.cancelled.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-[#b34126] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Credit Transactions ({transactions.length})
          </button>
        </div>

        {/* Tab Contents */}
        {loadingDashboard ? (
          <div className="py-12 text-center text-xs text-[#8c847a] animate-pulse">
            Loading your haircut appointments…
          </div>
        ) : (
          <div>
            {/* Upcoming Appointments */}
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                {appointments.upcoming.length === 0 ? (
                  <div className="rounded-[28px] border border-[#e4ded6] bg-white p-12 text-center">
                    <Calendar className="size-10 text-[#b34126] mx-auto mb-3 opacity-60" />
                    <h3 className="font-bold text-base text-[#1a1714] font-display">
                      No upcoming appointments
                    </h3>
                    <p className="text-xs text-[#666059] mt-1 mb-5 max-w-sm mx-auto">
                      You have {creditsAvailable} haircut credit(s) ready to use. Book your next home visit with our certified Abuja barbers.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsBookingOpen(true)}
                      className="h-11 px-6 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      Book a Haircut Now
                    </button>
                  </div>
                ) : (
                  appointments.upcoming.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onCancel={handleCancelAppointment}
                      onReschedule={(a) => setSelectedRescheduleApt(a)}
                      onReportSafety={(a) => setSelectedSafetyApt(a)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Completed Appointments */}
            {activeTab === 'completed' && (
              <div className="space-y-4">
                {appointments.past.length === 0 ? (
                  <div className="rounded-[28px] border border-[#e4ded6] bg-white p-12 text-center text-xs text-[#787168]">
                    No completed appointments yet.
                  </div>
                ) : (
                  appointments.past.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onCancel={handleCancelAppointment}
                      onReschedule={(a) => setSelectedRescheduleApt(a)}
                      onReportSafety={(a) => setSelectedSafetyApt(a)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Cancelled Appointments */}
            {activeTab === 'cancelled' && (
              <div className="space-y-4">
                {appointments.cancelled.length === 0 ? (
                  <div className="rounded-[28px] border border-[#e4ded6] bg-white p-12 text-center text-xs text-[#787168]">
                    No cancelled or missed appointments.
                  </div>
                ) : (
                  appointments.cancelled.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onCancel={handleCancelAppointment}
                      onReschedule={(a) => setSelectedRescheduleApt(a)}
                      onReportSafety={(a) => setSelectedSafetyApt(a)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Transactions Ledger */}
            {activeTab === 'transactions' && (
              <div className="rounded-[28px] border border-[#e4ded6] bg-white overflow-hidden shadow-xs">
                <div className="p-4 border-b border-[#eee8e0] bg-[#faf8f6] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#787168] uppercase tracking-wider">
                    Haircut Credits Transaction Ledger
                  </span>
                  <span className="text-xs font-bold text-[#b34126]">
                    Current Balance: {creditsAvailable} Credits
                  </span>
                </div>
                <div className="divide-y divide-[#eee8e0]">
                  {transactions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#787168]">
                      No transactions recorded yet.
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#1a1714]">{tx.description}</p>
                          <span className="text-[11px] text-[#787168]">
                            {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                            {new Date(tx.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold font-mono text-sm ${
                              tx.amount > 0 ? 'text-emerald-700' : 'text-[#b34126]'
                            }`}
                          >
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credit
                          </span>
                          <span className="block text-[11px] text-[#787168]">
                            Balance: {tx.balanceAfter}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        user={user}
        onBookingSuccess={handleBookingSuccess}
        onOpenSubscribe={() => onNavigate('/signup')}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={Boolean(selectedRescheduleApt)}
        onClose={() => setSelectedRescheduleApt(null)}
        appointment={selectedRescheduleApt}
        onSuccess={() => {
          loadDashboardData();
          setCancellationNotice('Appointment successfully rescheduled.');
          setTimeout(() => setCancellationNotice(null), 4000);
        }}
      />

      {/* Safety Report Modal */}
      <SafetyReportModal
        isOpen={Boolean(selectedSafetyApt)}
        onClose={() => setSelectedSafetyApt(null)}
        appointment={selectedSafetyApt}
        reporterId={user.id}
        reporterName={user.name}
      />

      {/* Bottom Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 border-t border-[#eee9e2] py-6 flex items-center justify-between text-sm">
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
