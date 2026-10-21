import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { Appointment } from '../../types';
import { bookingApi } from '../../services/bookingApi';

interface SafetyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  reporterId: string;
  reporterName: string;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  isOpen,
  onClose,
  appointment,
  reporterId,
  reporterName,
}) => {
  if (!isOpen || !appointment) return null;

  const [category, setCategory] = useState<string>('hygiene');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please describe the concern.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await bookingApi.submitSafetyReport({
        appointmentRef: appointment.bookingRef,
        reporterId,
        reporterRole: 'member',
        reporterName,
        category,
        description: description.trim(),
      });
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setDescription('');
      }, 2000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#e4ded6] shadow-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between pb-3 border-b border-[#eee8e0]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-[#b34126]" />
            <h3 className="text-base font-bold font-display text-[#1a1714]">
              Report Safety or Service Concern
            </h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-[#8c847a] hover:bg-[#f6f2ec] cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-2">
            <div className="size-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="size-6 stroke-[3]" />
            </div>
            <p className="text-sm font-semibold text-[#1a1714]">Report Submitted</p>
            <p className="text-xs text-[#666059] max-w-xs mx-auto">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-4">
            <p className="text-xs text-[#666059]">
              Booking Ref: <strong className="font-mono text-[#1a1714]">{appointment.bookingRef}</strong> with {appointment.barberName}
            </p>

            {errorMsg && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-[#ded8d0] px-3 text-xs bg-white focus:outline-none focus:border-[#b34126]"
              >
                <option value="hygiene">Sanitation / Hygiene Concern</option>
                <option value="unprofessional_behavior">Unprofessional Behavior</option>
                <option value="lateness">Significant Lateness / Arrival Issue</option>
                <option value="safety_hazard">Physical Safety Concern</option>
                <option value="other">Other Service Quality Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1">
                Details
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide clear details regarding what happened..."
                className="w-full rounded-xl border border-[#ded8d0] p-3 text-xs bg-white focus:outline-none focus:border-[#b34126] placeholder:text-[#9e968d]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eee8e0]">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl border border-[#ded8d0] text-xs font-medium text-[#1a1714] hover:bg-[#faf8f6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-5 rounded-xl bg-[#b34126] hover:bg-[#9c361e] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting…' : 'Submit to Care Team'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
