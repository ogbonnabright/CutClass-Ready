import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, Check } from 'lucide-react';
import { Appointment } from '../../types';
import { bookingApi } from '../../services/bookingApi';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  if (!isOpen || !appointment) return null;

  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start from tomorrow
    return {
      iso: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-NG', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-NG', { month: 'short' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(dates[0].iso);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [slots, setSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate && appointment) {
      setIsLoadingSlots(true);
      setErrorMsg(null);
      setSelectedTime('');
      bookingApi
        .getAvailableSlots(appointment.barberId, selectedDate, appointment.serviceDurationMinutes)
        .then((openSlots) => {
          setSlots(openSlots);
          if (openSlots.length > 0) setSelectedTime(openSlots[0]);
        })
        .catch((err) => setErrorMsg(err.message || 'Error fetching open slots.'))
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedDate, appointment]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setErrorMsg('Please select a time slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await bookingApi.rescheduleBooking(appointment.id, selectedDate, selectedTime, appointment.memberId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Rescheduling failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#e4ded6] shadow-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-[#eee8e0]">
          <div>
            <h3 className="text-lg font-bold font-display text-[#1a1714]">
              Reschedule Appointment
            </h3>
            <p className="text-xs text-[#787168]">
              Booking Ref: <span className="font-mono font-medium text-[#b34126]">{appointment.bookingRef}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-[#8c847a] hover:bg-[#f6f2ec] cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 my-5">
          {/* Current schedule */}
          <div className="rounded-xl bg-[#faf8f6] p-3 text-xs text-[#666059]">
            <p>
              Current time: <strong className="text-[#1a1714]">{appointment.date} at {appointment.time}</strong> with {appointment.barberName}
            </p>
          </div>

          {/* Select Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1.5">
              Select New Date
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`min-w-[64px] py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedDate === d.iso
                      ? 'border-[#b34126] bg-[#b34126] text-white shadow-xs'
                      : 'border-[#ded8d0] bg-white text-[#1a1714] hover:bg-[#faf8f6]'
                  }`}
                >
                  <span className="text-[10px] block font-bold">{d.dayName}</span>
                  <span className="text-base font-bold font-display">{d.dayNumber}</span>
                  <span className="text-[9px] block opacity-80">{d.month}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Select Time */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1.5">
              Available Slots ({slots.length})
            </label>
            {isLoadingSlots ? (
              <p className="text-xs text-[#787168] py-4 text-center animate-pulse">
                Checking availability…
              </p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                No slots open for this date. Please pick another date.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedTime(s)}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      selectedTime === s
                        ? 'border-[#b34126] bg-[#b34126] text-white shadow-xs'
                        : 'border-[#ded8d0] bg-white text-[#1a1714] hover:bg-[#faf8f6]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eee8e0]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#ded8d0] text-xs font-medium text-[#1a1714] hover:bg-[#faf8f6] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !selectedTime}
            onClick={handleReschedule}
            className="h-10 px-5 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? 'Updating…' : 'Confirm New Time'}
            <Check className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
