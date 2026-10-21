import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Scissors,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { Barber, ServiceItem, User } from '../../types';
import { bookingApi } from '../../services/bookingApi';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onBookingSuccess: (updatedCredits: number) => void;
  onOpenSubscribe?: () => void;
}

export const ABUJA_DISTRICTS = [
  'Maitama',
  'Wuse II',
  'Central Business District (CBD)',
  'Garki',
  'Asokoro',
  'Jabi',
  'Utako',
  'Apo & Guzape',
  'Life Camp & Jahi',
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  user,
  onBookingSuccess,
  onOpenSubscribe,
}) => {
  // Steps: 1 (Service) -> 2 (Location) -> 3 (Barber) -> 4 (Date/Time) -> 5 (Review) -> 6 (Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Data loaded from server
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Booking selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-standard');
  const [locationType, setLocationType] = useState<'home' | 'studio'>('home');
  const [address, setAddress] = useState<string>(user.defaultAddress || '');
  const [district, setDistrict] = useState<string>(user.defaultDistrict || 'Maitama');
  const [landmark, setLandmark] = useState<string>(user.defaultLandmark || '');
  const [accessInstructions, setAccessInstructions] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');

  // Next 14 days dates
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i === 0 ? 0 : i)); // Today + i days
    return {
      iso: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-NG', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-NG', { month: 'short' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(dates[0].iso);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Flow & error states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string>('');
  const [confirmedAptDetails, setConfirmedAptDetails] = useState<{
    barberName: string;
    serviceName: string;
    date: string;
    time: string;
  } | null>(null);

  // Load services and barbers on mount
  useEffect(() => {
    if (isOpen) {
      bookingApi.getServices().then(setServices).catch(console.error);
      bookingApi.getBarbers().then(setBarbers).catch(console.error);
      setStep(1);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // When step 4 is reached or barber/date changes, query available slots
  useEffect(() => {
    if (step === 4 && selectedDate) {
      setIsLoadingSlots(true);
      setErrorMsg(null);
      setSelectedTime('');

      const actualBarberId =
        selectedBarberId === 'any' ? barbers[0]?.id || 'barber-tunde' : selectedBarberId;
      const service = services.find((s) => s.id === selectedServiceId);
      const duration = service?.durationMinutes || 45;

      bookingApi
        .getAvailableSlots(actualBarberId, selectedDate, duration)
        .then((slots) => {
          setAvailableSlots(slots);
          if (slots.length > 0) {
            setSelectedTime(slots[0]);
          }
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Could not fetch time slots.');
        })
        .finally(() => {
          setIsLoadingSlots(false);
        });
    }
  }, [step, selectedDate, selectedBarberId, selectedServiceId, barbers, services]);

  if (!isOpen) return null;

  // Selected entities helpers
  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const activePlanId = user.subscription?.planId || 'regular';
  const isCoveredByPlan = selectedService?.coveredByPlans?.includes(activePlanId);
  const extraCharge = isCoveredByPlan ? 0 : selectedService?.extraCostNum || 0;
  const chosenBarber =
    selectedBarberId === 'any'
      ? barbers[0]
      : barbers.find((b) => b.id === selectedBarberId) || barbers[0];

  // Validation
  const hasActiveSubscription = user.subscription && user.subscription.status === 'active';
  const hasCredits = (user.haircutCredits || 0) > 0;

  // Step 2 validation (Location)
  const handleProceedFromLocation = () => {
    if (!address.trim()) {
      setErrorMsg('Please enter your home or service street address.');
      return;
    }
    if (!district) {
      setErrorMsg('Please select your Abuja district.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  // Step 3 validation (Barber)
  const handleProceedFromBarber = () => {
    setErrorMsg(null);
    setStep(4);
  };

  // Step 4 validation (Date & Time)
  const handleProceedFromDateTime = () => {
    if (!selectedDate || !selectedTime) {
      setErrorMsg('Please choose an available appointment time slot.');
      return;
    }
    setErrorMsg(null);
    setStep(5);
  };

  // Step 5: Submit booking to backend
  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const barberToAssign = chosenBarber?.id || 'barber-tunde';

      const response = await bookingApi.createBooking({
        memberId: user.id,
        memberName: user.name,
        memberEmail: user.email,
        memberPhone: user.phone || '+234 800 000 0000',
        barberId: barberToAssign,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        locationType,
        address: address.trim(),
        district,
        landmark: landmark.trim() || undefined,
        accessInstructions: accessInstructions.trim() || undefined,
        userSubscription: user.subscription,
        userHaircutCredits: user.haircutCredits,
        extraCharge,
        paymentStatus: extraCharge > 0 ? 'paid' : 'covered_by_plan',
      });

      setConfirmedBookingRef(response.bookingRef);
      setConfirmedAptDetails({
        barberName: chosenBarber.name,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
      });

      onBookingSuccess(response.updatedCredits);
      setStep(6);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to complete appointment booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white text-[#1a1714] rounded-[28px] border border-[#e4ded6] shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#eee8e0] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#b34126] text-white">
              <Scissors className="size-4 -rotate-12" />
            </span>
            <span className="font-display font-semibold text-base text-[#1a1714]">
              CutClass Booking
            </span>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-[#8c847a] hover:bg-[#f6f2ec] hover:text-[#1a1714] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Progress Step Header (Steps 1 to 5) */}
        {step <= 5 && (
          <div className="bg-[#faf8f6] border-b border-[#eee8e0] px-6 py-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#787168] mb-1.5">
              <span>
                Step {step} of 5:{' '}
                <strong className="text-[#1a1714]">
                  {step === 1 && 'Select Service'}
                  {step === 2 && 'Select Location'}
                  {step === 3 && 'Select Barber'}
                  {step === 4 && 'Date & Time'}
                  {step === 5 && 'Review & Confirm'}
                </strong>
              </span>
              <span className="text-[#b34126] font-semibold">
                {user.haircutCredits} Credits Available
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#e8e2d8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#b34126] transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Subscription Verification Gate */}
        {(!hasActiveSubscription || !hasCredits) && step <= 5 ? (
          <div className="p-8 text-center">
            <div className="size-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-7" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1714] font-display">
              {!hasActiveSubscription
                ? 'Active Membership Required'
                : 'No Available Haircut Credits'}
            </h3>
            <p className="text-sm text-[#666059] mt-2 mb-6 max-w-md mx-auto leading-relaxed">
              {!hasActiveSubscription
                ? 'Haircut appointments are exclusive to subscribed CutClass members. Please activate your monthly Abuja plan to start booking home visits.'
                : 'You have used all haircut credits for your current monthly cycle. Renew your plan or contact our concierge to add extra credits.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenSubscribe) onOpenSubscribe();
                }}
                className="h-11 px-6 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="size-4" />
                {!hasActiveSubscription ? 'View Membership Plans' : 'Top Up Credits'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-6 rounded-xl border border-[#ded8d0] bg-white text-[#1a1714] font-medium text-sm hover:bg-[#faf8f6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* ============================================================= */}
            {/* STEP 1: SELECT A SERVICE */}
            {/* ============================================================= */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-[#1a1714]">
                    Choose Your Service
                  </h3>
                  <p className="text-xs text-[#666059] mt-0.5">
                    Your <strong>{user.subscription?.planName || 'Monthly'}</strong> plan covers standard home haircut appointments.
                  </p>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {services.map((service) => {
                    const isSelected = selectedServiceId === service.id;
                    const covered = service.coveredByPlans.includes(activePlanId);

                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedServiceId(service.id)}
                        className={`rounded-2xl border p-4 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                          isSelected
                            ? 'border-[#b34126] bg-[#faf8f6] ring-2 ring-[#b34126]/20'
                            : 'border-[#e4ded6] hover:border-[#cfc6bb] bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`size-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#b34126] bg-[#b34126] text-white'
                                : 'border-[#cfc7be] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm text-[#1a1714]">
                                {service.name}
                              </h4>
                              {service.badge && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#f2ede6] text-[#b34126]">
                                  {service.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#666059] mt-1 leading-relaxed">
                              {service.description}
                            </p>
                            <span className="text-[11px] text-[#8c847a] mt-1.5 inline-flex items-center gap-1">
                              <Clock className="size-3" /> {service.durationMinutes} minutes
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {covered ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="size-3" />
                              1 Credit
                            </span>
                          ) : (
                            <div className="text-right">
                              <span className="text-xs font-bold text-[#b34126] block">
                                +₦{service.extraCostNum.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-[#787168]">Add-on cost</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#eee8e0] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-11 px-6 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    Next: Location
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 2: SELECT LOCATION */}
            {/* ============================================================= */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-[#1a1714]">
                    Where Should We Cut Your Hair?
                  </h3>
                  <p className="text-xs text-[#666059] mt-0.5">
                    CutClass mobile barbers provide full in-home service with protective sheeting and clean vacuum tools.
                  </p>
                </div>

                {/* Location Type Toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocationType('home')}
                    className={`h-11 rounded-xl border font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      locationType === 'home'
                        ? 'border-[#b34126] bg-[#b34126] text-white shadow-xs'
                        : 'border-[#ded8d0] bg-white text-[#1a1714] hover:bg-[#faf8f6]'
                    }`}
                  >
                    <Home className="size-4" />
                    Home Service (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('studio')}
                    className={`h-11 rounded-xl border font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      locationType === 'studio'
                        ? 'border-[#b34126] bg-[#b34126] text-white shadow-xs'
                        : 'border-[#ded8d0] bg-white text-[#1a1714] hover:bg-[#faf8f6]'
                    }`}
                  >
                    <MapPin className="size-4" />
                    CutClass Studio (Maitama)
                  </button>
                </div>

                {locationType === 'home' ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1">
                        Abuja District *
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-11 rounded-xl border border-[#ded8d0] bg-white px-3 text-sm text-[#1a1714] focus:outline-none focus:ring-2 focus:ring-[#b34126]/20 focus:border-[#b34126]"
                      >
                        {ABUJA_DISTRICTS.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1">
                        Street Address / Apartment *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. House 14, Amazon Street, Maitama"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full h-11 rounded-xl border border-[#ded8d0] bg-white px-3 text-sm text-[#1a1714] focus:outline-none focus:ring-2 focus:ring-[#b34126]/20 focus:border-[#b34126]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1">
                          Nearby Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Beside Zenith Bank"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="w-full h-11 rounded-xl border border-[#ded8d0] bg-white px-3 text-sm text-[#1a1714] focus:outline-none focus:ring-2 focus:ring-[#b34126]/20 focus:border-[#b34126]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1">
                          Gate / Access Code (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Call at gate / Code 401"
                          value={accessInstructions}
                          onChange={(e) => setAccessInstructions(e.target.value)}
                          className="w-full h-11 rounded-xl border border-[#ded8d0] bg-white px-3 text-sm text-[#1a1714] focus:outline-none focus:ring-2 focus:ring-[#b34126]/20 focus:border-[#b34126]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#e4ded6] bg-[#faf8f6] p-4 text-xs text-[#554e46] space-y-2">
                    <p className="font-semibold text-sm text-[#1a1714]">CutClass Studio Hub — Maitama</p>
                    <p>Plot 824, Ralph Shodeinde Street, Maitama District, Abuja.</p>
                    <p className="text-[#787168]">Dedicated private lounge with barista bar and hot towel station.</p>
                  </div>
                )}

                <div className="pt-4 border-t border-[#eee8e0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-11 px-5 rounded-xl border border-[#ded8d0] bg-white text-[#1a1714] font-medium text-sm hover:bg-[#faf8f6] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedFromLocation}
                    className="h-11 px-6 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    Next: Barber
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 3: SELECT A BARBER */}
            {/* ============================================================= */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-[#1a1714]">
                    Choose Your Barber
                  </h3>
                  <p className="text-xs text-[#666059] mt-0.5">
                    Select a preferred certified barber or request the fastest available professional.
                  </p>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* Any available option */}
                  <div
                    onClick={() => setSelectedBarberId('any')}
                    className={`rounded-2xl border p-4 transition-all cursor-pointer flex items-center justify-between ${
                      selectedBarberId === 'any'
                        ? 'border-[#b34126] bg-[#faf8f6] ring-2 ring-[#b34126]/20'
                        : 'border-[#e4ded6] bg-white hover:border-[#cfc6bb]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-[#f2ede6] text-[#b34126] flex items-center justify-center font-bold">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-[#1a1714]">
                          Fastest Available Barber
                        </h4>
                        <p className="text-xs text-[#666059]">
                          Automatically matches the top-rated barber active in {district}.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`size-5 rounded-full border flex items-center justify-center ${
                        selectedBarberId === 'any'
                          ? 'border-[#b34126] bg-[#b34126] text-white'
                          : 'border-[#cfc7be]'
                      }`}
                    >
                      {selectedBarberId === 'any' && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Individual Barbers */}
                  {barbers.map((barber) => {
                    const isSelected = selectedBarberId === barber.id;
                    const servesArea = barber.serviceAreas.some((a) =>
                      a.toLowerCase().includes(district.toLowerCase())
                    );

                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarberId(barber.id)}
                        className={`rounded-2xl border p-4 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-[#b34126] bg-[#faf8f6] ring-2 ring-[#b34126]/20'
                            : 'border-[#e4ded6] bg-white hover:border-[#cfc6bb]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={barber.avatarUrl}
                            alt={barber.name}
                            className="size-12 rounded-full object-cover shrink-0 border border-[#e4ded6]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-[#1a1714]">
                                {barber.name}
                              </h4>
                              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                ★ {barber.rating}
                              </span>
                            </div>
                            <p className="text-xs text-[#666059] mt-0.5 leading-relaxed line-clamp-2">
                              {barber.bio}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                              {barber.specialties.slice(0, 2).map((sp) => (
                                <span
                                  key={sp}
                                  className="rounded bg-[#f0eae1] px-2 py-0.5 text-[#5e564c] font-medium"
                                >
                                  {sp}
                                </span>
                              ))}
                              {servesArea && (
                                <span className="text-emerald-700 font-medium">
                                  ✓ Serves {district}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`size-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                            isSelected
                              ? 'border-[#b34126] bg-[#b34126] text-white'
                              : 'border-[#cfc7be]'
                          }`}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#eee8e0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-11 px-5 rounded-xl border border-[#ded8d0] bg-white text-[#1a1714] font-medium text-sm hover:bg-[#faf8f6] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedFromBarber}
                    className="h-11 px-6 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    Next: Date & Time
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 4: SELECT DATE & TIME */}
            {/* ============================================================= */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-[#1a1714]">
                    Select Date & Time
                  </h3>
                  <p className="text-xs text-[#666059] mt-0.5">
                    Showing genuinely available slots for{' '}
                    <strong className="text-[#1a1714]">{chosenBarber.name}</strong> with travel buffer included.
                  </p>
                </div>

                {/* 14-day horizontal date slider */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1.5">
                    Pick a Date
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {dates.map((d) => {
                      const isSelected = selectedDate === d.iso;
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          onClick={() => setSelectedDate(d.iso)}
                          className={`min-w-[68px] py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#b34126] bg-[#b34126] text-white shadow-xs'
                              : 'border-[#ded8d0] bg-white text-[#1a1714] hover:bg-[#faf8f6]'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {d.dayName}
                          </span>
                          <span className="text-lg font-bold font-display leading-tight my-0.5">
                            {d.dayNumber}
                          </span>
                          <span className="text-[10px] opacity-80">{d.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Time Slots */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
                      Available Time Slots
                    </label>
                    <span className="text-xs text-[#8c847a]">
                      {isLoadingSlots
                        ? 'Checking availability…'
                        : `${availableSlots.length} slots open`}
                    </span>
                  </div>

                  {isLoadingSlots ? (
                    <div className="py-8 text-center text-xs text-[#8c847a] animate-pulse">
                      Calculating real-time barber availability…
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#faf8f6] border border-[#e4ded6] text-center">
                      <Clock className="size-6 text-[#b34126] mx-auto mb-2 opacity-70" />
                      <p className="text-sm font-semibold text-[#1a1714]">No open slots on this date</p>
                      <p className="text-xs text-[#666059] mt-1">
                        All slots are reserved or within the required 2-hour lead time. Please pick another date above.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'border-[#b34126] bg-[#b34126] text-white shadow-xs ring-2 ring-[#b34126]/20'
                                : 'border-[#ded8d0] bg-white text-[#1a1714] hover:bg-[#faf8f6]'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#eee8e0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="h-11 px-5 rounded-xl border border-[#ded8d0] bg-white text-[#1a1714] font-medium text-sm hover:bg-[#faf8f6] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedTime}
                    onClick={handleProceedFromDateTime}
                    className="h-11 px-6 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-40"
                  >
                    Review Booking
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 5: REVIEW AND CONFIRM */}
            {/* ============================================================= */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-[#1a1714]">
                    Review & Confirm Appointment
                  </h3>
                  <p className="text-xs text-[#666059] mt-0.5">
                    Verify appointment details and subscription credit usage before dispatching.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="rounded-2xl border border-[#e4ded6] bg-[#faf8f6] p-5 space-y-3.5 text-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-[#eee8e0]">
                    <span className="text-[#787168]">Service</span>
                    <span className="font-bold text-[#1a1714]">{selectedService.name}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-[#eee8e0]">
                    <span className="text-[#787168]">Barber</span>
                    <div className="flex items-center gap-2">
                      <img
                        src={chosenBarber.avatarUrl}
                        alt=""
                        className="size-5 rounded-full object-cover"
                      />
                      <span className="font-semibold text-[#1a1714]">{chosenBarber.name}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-[#eee8e0]">
                    <span className="text-[#787168]">Date & Time</span>
                    <span className="font-semibold text-[#1a1714]">
                      {new Date(selectedDate).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at {selectedTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-[#eee8e0]">
                    <span className="text-[#787168]">Location</span>
                    <div className="text-right">
                      <span className="font-medium text-[#1a1714] block">
                        {locationType === 'home' ? address : 'CutClass Studio'}
                      </span>
                      <span className="text-xs text-[#787168]">{district}, Abuja</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-[#eee8e0]">
                    <span className="text-[#787168]">Plan Coverage</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                      {isCoveredByPlan ? '1 Haircut Credit Deducted' : 'Plan Add-On'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 font-semibold text-base">
                    <span>Remaining Credits After Booking</span>
                    <span className="text-[#b34126]">
                      {Math.max(0, (user.haircutCredits || 0) - (isCoveredByPlan ? 1 : 0))} Credits
                    </span>
                  </div>
                </div>

                {/* Safety & Cancellation Disclosure */}
                <div className="rounded-xl border border-[#dce3d8] bg-[#f5fbf2] p-3.5 text-xs text-[#2c5322] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#1e4215]">
                    <ShieldCheck className="size-4 text-[#2b791b]" />
                    Fair Cancellation & Hygiene Policy
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Cancel or reschedule at least <strong>12 hours</strong> prior to your appointment to restore your haircut credit. Barbers arrive fully equipped with hospital-grade disinfectant and sterilized instruments.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#eee8e0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="h-11 px-5 rounded-xl border border-[#ded8d0] bg-white text-[#1a1714] font-medium text-sm hover:bg-[#faf8f6] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmBooking}
                    className="h-11 px-7 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming…
                      </>
                    ) : (
                      <>
                        Confirm Booking
                        <Check className="size-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 6: CONFIRMATION SCREEN */}
            {/* ============================================================= */}
            {step === 6 && (
              <div className="py-6 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="size-8 stroke-[3]" />
                </div>

                <div>
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#b34126] block mb-1">
                    Booking Confirmed
                  </span>
                  <h3 className="text-2xl font-bold font-display text-[#1a1714]">
                    Your Haircut is Scheduled!
                  </h3>
                  <p className="text-sm text-[#666059] mt-1">
                    Booking Reference: <strong className="text-[#1a1714] font-mono">{confirmedBookingRef}</strong>
                  </p>
                </div>

                {confirmedAptDetails && (
                  <div className="rounded-2xl border border-[#e4ded6] bg-[#faf8f6] p-4 text-xs text-[#524c44] max-w-md mx-auto space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-[#787168]">Barber</span>
                      <span className="font-semibold text-[#1a1714]">
                        {confirmedAptDetails.barberName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#787168]">Service</span>
                      <span className="font-medium text-[#1a1714]">
                        {confirmedAptDetails.serviceName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#787168]">Appointment</span>
                      <span className="font-semibold text-[#1a1714]">
                        {confirmedAptDetails.date} at {confirmedAptDetails.time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#787168]">Address</span>
                      <span className="font-medium text-[#1a1714]">{address}, {district}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#787168] max-w-sm mx-auto">
                  A dispatch confirmation has been queued for your mobile number. Your barber will call upon arrival.
                </p>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-11 px-8 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white font-medium text-sm transition-colors cursor-pointer shadow-xs"
                  >
                    View in My Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
