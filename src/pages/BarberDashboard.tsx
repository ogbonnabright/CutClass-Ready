import React, { useState, useEffect } from 'react';
import {
  Scissors,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  Phone,
  Power,
  RefreshCw,
} from 'lucide-react';
import { Appointment, Barber } from '../types';
import { bookingApi } from '../services/bookingApi';

interface BarberDashboardProps {
  onNavigate: (path: string) => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({ onNavigate }) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>('barber-tunde');
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [schedule, setSchedule] = useState<{
    today: Appointment[];
    upcoming: Appointment[];
    past: Appointment[];
    all: Appointment[];
  }>({ today: [], upcoming: [], past: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = async (bId: string) => {
    setLoading(true);
    try {
      const barbersList = await bookingApi.getBarbers();
      setAllBarbers(barbersList);
      const data = await bookingApi.getBarberDashboardData(bId);
      setBarber(data.barber);
      setSchedule(data.schedule);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedBarberId);
  }, [selectedBarberId]);

  const handleStatusChange = async (aptId: string, status: any, notes?: string) => {
    if (!barber) return;
    try {
      await bookingApi.updateBarberAppointmentStatus(aptId, status, barber.id, notes);
      setActionMsg(`Appointment status updated to ${status}.`);
      loadData(selectedBarberId);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: unknown) {
      setActionMsg((err as Error).message);
    }
  };

  const handleToggleDuty = async () => {
    if (!barber) return;
    try {
      const updated = await bookingApi.toggleBarberAvailability(barber.id, !barber.isAvailable);
      setBarber(updated);
      setActionMsg(
        updated.isAvailable ? 'You are now ON-DUTY and open for bookings.' : 'You are now OFF-DUTY.'
      );
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: unknown) {
      setActionMsg((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1714] font-body">
      {/* Top Bar */}
      <header className="border-b border-[#eee8e0] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 font-display text-base font-semibold text-[#1a1714] cursor-pointer"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#b34126] text-white">
                <Scissors className="size-4 -rotate-12" />
              </span>
              CutClass Barber Portal
            </button>
            <span className="text-xs bg-[#f2ede6] text-[#6b645b] px-2.5 py-0.5 rounded-full font-semibold">
              Abuja Dispatch
            </span>
          </div>

          {/* Quick Barber Selector & Mode switch */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#787168] hidden sm:inline">Active Barber:</label>
              <select
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className="h-8 rounded-lg border border-[#ded8d0] bg-white px-2.5 text-xs text-[#1a1714] font-medium"
              >
                {allBarbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onNavigate('/profile')}
              className="text-xs text-[#b34126] hover:underline font-medium cursor-pointer"
            >
              Member View →
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {actionMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg(null)} className="text-emerald-700 font-bold">×</button>
          </div>
        )}

        {/* Barber Overview Card */}
        {barber && (
          <div className="rounded-[28px] border border-[#e4ded6] bg-white p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={barber.avatarUrl}
                alt={barber.name}
                className="size-16 rounded-full object-cover border-2 border-[#e4ded6]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold font-display text-[#1a1714]">
                    {barber.name}
                  </h1>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      barber.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {barber.status}
                  </span>
                </div>
                <p className="text-xs text-[#666059] mt-0.5">
                  Rating: <strong className="text-amber-600">★ {barber.rating}</strong> ({barber.reviewCount} verified reviews) • Phone: {barber.phone}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-[#787168]">
                  <span>Assigned Zones:</span>
                  {barber.serviceAreas.map((area) => (
                    <span key={area} className="rounded bg-[#f0eae1] px-2 py-0.5 text-[#5e564c] font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleDuty}
                className={`h-11 px-5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  barber.isAvailable
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-[#6b645b] hover:bg-[#57514a] text-white'
                }`}
              >
                <Power className="size-4" />
                {barber.isAvailable ? 'Active: On Duty' : 'Paused: Off Duty'}
              </button>
              <button
                type="button"
                onClick={() => loadData(selectedBarberId)}
                className="size-11 rounded-xl border border-[#ded8d0] bg-white flex items-center justify-center text-[#787168] hover:bg-[#faf8f6] cursor-pointer"
                title="Refresh schedule"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Schedule Tabs */}
        <div className="flex items-center gap-2 border-b border-[#eee8e0] pb-3 mb-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'today'
                ? 'bg-[#b34126] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Today ({schedule.today.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-[#b34126] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Upcoming Dates ({schedule.upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'past'
                ? 'bg-[#b34126] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Past & Completed ({schedule.past.length})
          </button>
        </div>

        {/* Schedule List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#8c847a] animate-pulse">
            Loading barber dispatch schedule…
          </div>
        ) : (
          <div className="space-y-4">
            {((activeTab === 'today' && schedule.today) ||
              (activeTab === 'upcoming' && schedule.upcoming) ||
              schedule.past
            ).length === 0 ? (
              <div className="rounded-2xl border border-[#e4ded6] bg-white p-12 text-center">
                <Calendar className="size-8 text-[#b34126] mx-auto mb-2 opacity-60" />
                <h3 className="font-semibold text-sm text-[#1a1714]">No appointments in this tab</h3>
                <p className="text-xs text-[#787168] mt-1">
                  You have no scheduled bookings matching this filter.
                </p>
              </div>
            ) : (
              ((activeTab === 'today' && schedule.today) ||
                (activeTab === 'upcoming' && schedule.upcoming) ||
                schedule.past
              ).map((apt) => (
                <div
                  key={apt.id}
                  className="rounded-2xl border border-[#e4ded6] bg-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#b34126] bg-[#faf0eb] px-2 py-0.5 rounded">
                        {apt.bookingRef}
                      </span>
                      <span className="text-xs font-semibold text-[#1a1714]">
                        {apt.serviceName}
                      </span>
                      <span className="text-xs text-[#8c847a]">({apt.serviceDurationMinutes} mins)</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#524c44]">
                      <div className="flex items-center gap-1 font-semibold text-[#1a1714]">
                        <Clock className="size-3.5 text-[#b34126]" />
                        {apt.date} at {apt.time}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <UserIcon className="size-3.5 text-[#787168]" />
                        <span className="font-medium text-[#1a1714]">{apt.memberName}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Phone className="size-3.5 text-[#787168]" />
                        <span>{apt.memberPhone}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-[#666059]">
                      <MapPin className="size-3.5 text-[#b34126] shrink-0 mt-0.5" />
                      <span>
                        {apt.address}, {apt.district}
                        {apt.landmark && <strong className="text-[#1a1714] ml-1">(Near: {apt.landmark})</strong>}
                        {apt.accessInstructions && (
                          <span className="block text-[#787168] mt-0.5">
                            Gate Access: {apt.accessInstructions}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Status & Barber Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                    {apt.status === 'confirmed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'in_progress')}
                          className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          En Route / Start
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'completed')}
                          className="h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          Mark Completed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'missed')}
                          className="h-9 px-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium hover:bg-amber-100 cursor-pointer"
                        >
                          No-Show
                        </button>
                      </>
                    )}

                    {apt.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(apt.id, 'completed')}
                        className="h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Complete Appointment
                      </button>
                    )}

                    {apt.status === 'completed' && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        ✓ Completed
                      </span>
                    )}

                    {apt.status === 'missed' && (
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        ⚠ Missed (No-Show)
                      </span>
                    )}

                    {apt.status === 'cancelled' && (
                      <span className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                        ✕ Cancelled
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};
