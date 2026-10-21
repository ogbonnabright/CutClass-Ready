import {
  Appointment,
  AppointmentStatus,
  Barber,
  CreditTransaction,
  SafetyReport,
  ServiceItem,
  UserSubscription,
} from '../types';

export interface BookingPayload {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  locationType: 'home' | 'studio';
  address: string;
  district: string;
  landmark?: string;
  accessInstructions?: string;
  userSubscription?: UserSubscription | null;
  userHaircutCredits?: number;
  extraCharge?: number;
  paymentStatus?: 'covered_by_plan' | 'paid' | 'pending';
  paymentReference?: string;
  notes?: string;
}

export const bookingApi = {
  async getServices(): Promise<ServiceItem[]> {
    const res = await fetch('/api/services');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch services.');
    return data.services;
  },

  async getBarbers(district?: string): Promise<Barber[]> {
    const url = district ? `/api/barbers?district=${encodeURIComponent(district)}` : '/api/barbers';
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch barbers.');
    return data.barbers;
  },

  async getAvailableSlots(barberId: string, date: string, durationMinutes: number = 45): Promise<string[]> {
    const res = await fetch(
      `/api/barbers/available-slots?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(
        date
      )}&durationMinutes=${durationMinutes}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch available slots.');
    return data.slots || [];
  },

  async createBooking(payload: BookingPayload): Promise<{
    appointment: Appointment;
    updatedCredits: number;
    bookingRef: string;
  }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to confirm booking.');
    }
    return data;
  },

  async cancelBooking(
    id: string,
    memberId: string,
    reason?: string
  ): Promise<{
    appointment: Appointment;
    creditRestored: boolean;
    hoursRemaining: string;
    message: string;
  }> {
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment.');
    return data;
  },

  async rescheduleBooking(
    id: string,
    newDate: string,
    newTime: string,
    memberId: string
  ): Promise<{ appointment: Appointment; message: string }> {
    const res = await fetch(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate, newTime, memberId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reschedule appointment.');
    return data;
  },

  async getMemberDashboardData(memberId: string): Promise<{
    appointments: {
      upcoming: Appointment[];
      past: Appointment[];
      cancelled: Appointment[];
      all: Appointment[];
    };
    transactions: CreditTransaction[];
  }> {
    const res = await fetch(`/api/member/dashboard-data?memberId=${encodeURIComponent(memberId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load member dashboard.');
    return data;
  },

  async getBarberDashboardData(barberId: string): Promise<{
    barber: Barber;
    schedule: {
      today: Appointment[];
      upcoming: Appointment[];
      past: Appointment[];
      all: Appointment[];
    };
  }> {
    const res = await fetch(`/api/barber/dashboard-data?barberId=${encodeURIComponent(barberId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load barber dashboard.');
    return data;
  },

  async updateBarberAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    barberId: string,
    notes?: string
  ): Promise<{ appointment: Appointment }> {
    const res = await fetch(`/api/barber/appointments/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, barberId, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update appointment status.');
    return data;
  },

  async toggleBarberAvailability(barberId: string, isAvailable: boolean): Promise<Barber> {
    const res = await fetch('/api/barber/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId, isAvailable }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update availability.');
    return data.barber;
  },

  async getAdminDashboardData(): Promise<{
    stats: {
      totalBookings: number;
      activeBookings: number;
      completedBookings: number;
      cancelledBookings: number;
      totalBarbers: number;
      approvedBarbers: number;
    };
    barbers: Barber[];
    appointments: Appointment[];
    auditLogs: Array<{ id: string; action: string; performedBy: string; performedByRole: string; targetId?: string; details: Record<string, unknown>; createdAt: string }>;
    safetyReports: SafetyReport[];
  }> {
    const res = await fetch('/api/admin/dashboard-data');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load admin dashboard.');
    return data;
  },

  async updateAdminBarberStatus(id: string, status: 'approved' | 'pending' | 'suspended', adminName?: string): Promise<Barber> {
    const res = await fetch(`/api/admin/barbers/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update barber status.');
    return data.barber;
  },

  async reassignAppointment(id: string, newBarberId: string, adminName?: string): Promise<Appointment> {
    const res = await fetch(`/api/admin/appointments/${id}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newBarberId, adminName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reassign appointment.');
    return data.appointment;
  },

  async submitSafetyReport(payload: {
    appointmentRef: string;
    reporterId: string;
    reporterRole: string;
    reporterName: string;
    category: string;
    description: string;
  }): Promise<{ success: boolean; message: string; reportId: string }> {
    const res = await fetch('/api/safety/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report.');
    return data;
  },

  async verifyPayment(reference: string, amount: number, memberId: string): Promise<boolean> {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, amount, memberId }),
    });
    const data = await res.json();
    return data.verified === true;
  },
};
