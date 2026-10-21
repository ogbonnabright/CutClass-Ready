import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scissors,
  ShieldAlert,
} from 'lucide-react';
import { Appointment } from '../../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (apt: Appointment) => void;
  onReschedule: (apt: Appointment) => void;
  onReportSafety: (apt: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  onReschedule,
  onReportSafety,
}) => {
  const aptDate = new Date(`${appointment.date}T${appointment.time}:00`);
  const isUpcoming =
    appointment.status === 'confirmed' ||
    appointment.status === 'pending_approval' ||
    appointment.status === 'in_progress';
  const hoursUntil = (aptDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const canRefundOnCancel = hoursUntil >= 12;

  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="size-3.5" />
            Confirmed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse">
            <Scissors className="size-3.5" />
            Barber En Route / Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            <CheckCircle2 className="size-3.5" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="size-3.5" />
            Cancelled
          </span>
        );
      case 'missed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="size-3.5" />
            Missed (No-Show)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {appointment.status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-[#e4ded6] bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-[#d5cbbf]">
      {/* Top Bar: Reference & Status */}
      <div className="flex items-center justify-between gap-2 border-b border-[#eee8e0] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#b34126] bg-[#faf0eb] px-2.5 py-1 rounded-md">
            {appointment.bookingRef}
          </span>
          <span className="text-xs text-[#787168]">
            {appointment.locationType === 'home' ? 'Home Service' : 'Studio'}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Service & Barber */}
        <div className="space-y-2">
          <h4 className="font-bold text-base text-[#1a1714] font-display">
            {appointment.serviceName}
          </h4>
          <div className="flex items-center gap-2.5">
            {appointment.barberAvatar ? (
              <img
                src={appointment.barberAvatar}
                alt=""
                className="size-8 rounded-full object-cover border border-[#e4ded6]"
              />
            ) : (
              <div className="size-8 rounded-full bg-[#f2ede6] text-[#b34126] flex items-center justify-center font-bold text-xs">
                {appointment.barberName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-[#1a1714]">{appointment.barberName}</p>
              <p className="text-[11px] text-[#787168]">Certified Abuja Home Barber</p>
            </div>
          </div>
        </div>

        {/* Right: Date, Time & Address */}
        <div className="space-y-1.5 text-xs text-[#524c44]">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-[#b34126] shrink-0" />
            <span className="font-medium text-[#1a1714]">
              {new Date(appointment.date).toLocaleDateString('en-NG', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-[#8c847a]">•</span>
            <Clock className="size-3.5 text-[#b34126] shrink-0" />
            <span className="font-semibold text-[#1a1714]">{appointment.time}</span>
          </div>

          <div className="flex items-start gap-2 pt-0.5">
            <MapPin className="size-3.5 text-[#b34126] shrink-0 mt-0.5" />
            <span className="leading-tight">
              {appointment.address}, {appointment.district}
              {appointment.landmark && (
                <span className="text-[#787168] block mt-0.5">Near: {appointment.landmark}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Cancellation Notice if cancelled */}
      {appointment.status === 'cancelled' && (
        <div className="mt-4 rounded-xl bg-[#faf8f6] border border-[#eee8e0] p-3 text-xs text-[#666059]">
          <p>
            <strong>Cancelled:</strong> {appointment.cancellationReason || 'Cancelled by member'}
            {appointment.creditRestored ? (
              <span className="text-emerald-700 font-medium ml-1">
                (1 credit restored to your balance)
              </span>
            ) : (
              <span className="text-amber-800 font-medium ml-1">
                (Credit forfeited: Late cancellation within 12h)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Actions (Only available for upcoming appointments) */}
      {isUpcoming && (
        <div className="mt-4 pt-3.5 border-t border-[#eee8e0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#787168]">
            <HelpCircle className="size-3.5 text-[#b34126]" />
            <span>
              {canRefundOnCancel ? (
                <span className="text-emerald-700 font-medium">Free cancellation ({hoursUntil.toFixed(0)}h remaining)</span>
              ) : (
                <span className="text-amber-700 font-medium">Within 12h: credit non-refundable</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReportSafety(appointment)}
              className="text-xs text-[#787168] hover:text-[#b34126] transition-colors p-1.5 cursor-pointer flex items-center gap-1"
              title="Report safety or service issue"
            >
              <ShieldAlert className="size-3.5" />
              Safety
            </button>
            <button
              type="button"
              onClick={() => onReschedule(appointment)}
              className="h-8 px-3 rounded-lg border border-[#ded8d0] bg-white text-xs font-medium text-[#1a1714] hover:bg-[#faf8f6] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="size-3" />
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              className="h-8 px-3 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
