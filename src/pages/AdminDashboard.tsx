import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scissors,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCw,
  Search,
  Filter,
  FileText,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { Appointment, Barber, SafetyReport } from '../types';
import { bookingApi } from '../services/bookingApi';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'barbers' | 'audit' | 'safety'>('appointments');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalBarbers: 0,
    approvedBarbers: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Reassignment modal state
  const [reassignApt, setReassignApt] = useState<Appointment | null>(null);
  const [targetBarberId, setTargetBarberId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getAdminDashboardData();
      setStats(data.stats);
      setAppointments(data.appointments);
      setBarbers(data.barbers);
      setAuditLogs(data.auditLogs);
      setSafetyReports(data.safetyReports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBarberStatusToggle = async (barberId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    try {
      await bookingApi.updateAdminBarberStatus(barberId, nextStatus);
      setActionNotice(`Barber status updated to ${nextStatus}.`);
      loadData();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      setActionNotice((err as Error).message);
    }
  };

  const handleReassignSubmit = async () => {
    if (!reassignApt || !targetBarberId) return;
    try {
      await bookingApi.reassignAppointment(reassignApt.id, targetBarberId);
      setActionNotice(`Booking ${reassignApt.bookingRef} successfully reassigned.`);
      setReassignApt(null);
      loadData();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      setActionNotice((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1714] font-body">
      {/* Header */}
      <header className="border-b border-[#eee8e0] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 font-display text-base font-semibold text-[#1a1714] cursor-pointer"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#1a1714] text-white">
                <ShieldCheck className="size-4" />
              </span>
              CutClass Admin Console
            </button>
            <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Abuja Operations
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/profile')}
              className="text-xs text-[#b34126] hover:underline font-medium cursor-pointer"
            >
              Member View →
            </button>
            <button
              onClick={() => onNavigate('/barber')}
              className="text-xs text-[#787168] hover:text-[#1a1714] font-medium cursor-pointer"
            >
              Barber Portal →
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {actionNotice && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-[#e4ded6] bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
              Total Bookings
            </span>
            <p className="text-3xl font-bold font-display text-[#1a1714] mt-1">
              {stats.totalBookings}
            </p>
            <span className="text-[11px] text-[#787168] mt-1 block">
              {stats.activeBookings} active scheduled
            </span>
          </div>

          <div className="rounded-2xl border border-[#e4ded6] bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
              Completed Visits
            </span>
            <p className="text-3xl font-bold font-display text-emerald-700 mt-1">
              {stats.completedBookings}
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              Verified haircut credits
            </span>
          </div>

          <div className="rounded-2xl border border-[#e4ded6] bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
              Active Barbers
            </span>
            <p className="text-3xl font-bold font-display text-[#b34126] mt-1">
              {stats.approvedBarbers}
            </p>
            <span className="text-[11px] text-[#787168] mt-1 block">
              of {stats.totalBarbers} registered
            </span>
          </div>

          <div className="rounded-2xl border border-[#e4ded6] bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#787168]">
              Safety Reports
            </span>
            <p className="text-3xl font-bold font-display text-amber-700 mt-1">
              {safetyReports.length}
            </p>
            <span className="text-[11px] text-[#787168] mt-1 block">
              Quality triage
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#eee8e0] pb-3 mb-6">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'appointments'
                ? 'bg-[#1a1714] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            All Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('barbers')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'barbers'
                ? 'bg-[#1a1714] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Barbers Management ({barbers.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#1a1714] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-[#1a1714] text-white shadow-xs'
                : 'text-[#666059] hover:bg-[#f2ede6]'
            }`}
          >
            Safety Reports ({safetyReports.length})
          </button>
        </div>

        {/* Tab 1: All Appointments */}
        {activeTab === 'appointments' && (
          <div className="rounded-2xl border border-[#e4ded6] bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf8f6] border-b border-[#eee8e0] text-[#787168] uppercase font-semibold">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Member</th>
                    <th className="p-4">Barber</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">District</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8e0]">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-[#faf8f6] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#b34126]">{apt.bookingRef}</td>
                      <td className="p-4 font-medium text-[#1a1714]">{apt.memberName}</td>
                      <td className="p-4 text-[#524c44]">{apt.barberName}</td>
                      <td className="p-4 text-[#524c44]">{apt.serviceName}</td>
                      <td className="p-4 whitespace-nowrap">
                        {apt.date} <strong className="text-[#1a1714] ml-1">{apt.time}</strong>
                      </td>
                      <td className="p-4 text-[#787168]">{apt.district}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'completed'
                              ? 'bg-gray-100 text-gray-700'
                              : apt.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {apt.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReassignApt(apt);
                              setTargetBarberId(barbers.find((b) => b.id !== apt.barberId)?.id || '');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b34126] hover:underline cursor-pointer"
                          >
                            <ArrowRightLeft className="size-3" />
                            Reassign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Barbers Management */}
        {activeTab === 'barbers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-[#e4ded6] bg-white p-5 shadow-xs flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={b.avatarUrl}
                    alt={b.name}
                    className="size-14 rounded-full object-cover border border-[#e4ded6]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#1a1714]">{b.name}</h4>
                      <span className="text-xs text-amber-600 font-bold">★ {b.rating}</span>
                    </div>
                    <p className="text-xs text-[#787168] mt-0.5">Phone: {b.phone}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                      {b.serviceAreas.map((area) => (
                        <span key={area} className="rounded bg-[#f0eae1] px-2 py-0.5 text-[#5e564c]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      b.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {b.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBarberStatusToggle(b.id, b.status)}
                    className="text-xs font-semibold text-[#b34126] hover:underline cursor-pointer"
                  >
                    {b.status === 'approved' ? 'Suspend Barber' : 'Approve Barber'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl border border-[#e4ded6] bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#eee8e0] bg-[#faf8f6]">
              <h3 className="font-semibold text-xs text-[#787168] uppercase tracking-wider">
                System Audit Trail & Security Events
              </h3>
            </div>
            <div className="divide-y divide-[#eee8e0] max-h-[500px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 text-xs flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1a1714] bg-[#f0eae1] px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-[#787168]">
                        by <strong>{log.performedBy}</strong> ({log.performedByRole})
                      </span>
                    </div>
                    <p className="text-[#524c44] font-mono text-[11px]">
                      {JSON.stringify(log.details)}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#8c847a] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString()} • {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Safety Reports */}
        {activeTab === 'safety' && (
          <div className="space-y-4">
            {safetyReports.length === 0 ? (
              <div className="rounded-2xl border border-[#e4ded6] bg-white p-12 text-center text-xs text-[#787168]">
                No safety or service concerns currently reported.
              </div>
            ) : (
              safetyReports.map((rep) => (
                <div key={rep.id} className="rounded-2xl border border-[#e4ded6] bg-white p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-mono text-[#b34126]">
                      Ref: {rep.appointmentRef}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {rep.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#1a1714]">{rep.description}</p>
                  <p className="text-[11px] text-[#787168]">
                    Reported by {rep.reporterName} on {new Date(rep.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reassignment Modal */}
        {reassignApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#e4ded6] p-6 shadow-2xl">
              <h3 className="text-lg font-bold font-display text-[#1a1714] mb-2">
                Reassign Booking {reassignApt.bookingRef}
              </h3>
              <p className="text-xs text-[#666059] mb-4">
                Current barber: <strong className="text-[#1a1714]">{reassignApt.barberName}</strong> on {reassignApt.date} at {reassignApt.time}.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#787168] mb-1">
                  Select New Barber
                </label>
                <select
                  value={targetBarberId}
                  onChange={(e) => setTargetBarberId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-[#ded8d0] px-3 text-xs bg-white"
                >
                  {barbers
                    .filter((b) => b.id !== reassignApt.barberId && b.status === 'approved')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (★ {b.rating})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setReassignApt(null)}
                  className="h-10 px-4 rounded-xl border border-[#ded8d0] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReassignSubmit}
                  className="h-10 px-5 rounded-xl bg-[#b34126] text-white text-xs font-medium"
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
