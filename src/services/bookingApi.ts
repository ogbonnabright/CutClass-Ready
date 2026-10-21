import {
  Appointment,
  AppointmentStatus,
  Barber,
  CreditTransaction,
  SafetyReport,
  ServiceItem,
  UserSubscription,
} from '../types';
import { auth } from '../lib/firebase';

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

async function getAuthHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        return headers;
      }
    }
  } catch (err) {
    console.warn('[API Client] Could not acquire Firebase ID token:', err);
  }

  // Preview / Development fallback session
  try {
    const local = localStorage.getItem('cutclass_local_user');
    if (local) {
      const parsed = JSON.parse(local);
      headers['Authorization'] = `Bearer test-token-${parsed.id || parsed.role || 'member'}`;
    }
  } catch {}

  return headers;
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
    const headers = await getAuthHeaders();
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers,
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
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers,
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
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      headers,
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
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/member/dashboard-data?memberId=${encodeURIComponent(memberId)}`, {
      headers,
    });
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
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/barber/dashboard-data?barberId=${encodeURIComponent(barberId)}`, {
      headers,
    });
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
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/barber/appointments/${id}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status, barberId, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update appointment status.');
    return data;
  },

  async toggleBarberAvailability(barberId: string, isAvailable: boolean): Promise<Barber> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/barber/availability', {
      method: 'POST',
      headers,
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
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/dashboard-data', {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load admin dashboard.');
    return data;
  },

  async updateAdminBarberStatus(id: string, status: 'approved' | 'pending' | 'suspended', adminName?: string): Promise<Barber> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/barbers/${id}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status, adminName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update barber status.');
    return data.barber;
  },

  async reassignAppointment(id: string, newBarberId: string, adminName?: string): Promise<Appointment> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/appointments/${id}/reassign`, {
      method: 'POST',
      headers,
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
    const headers = await getAuthHeaders();
    const res = await fetch('/api/safety/report', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report.');
    return data;
  },

  async initializePaystack(planId: string, email: string): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/payments/paystack/initialize', {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Paystack initialization failed.');
    return data;
  },

  async verifyPaystackPayment(reference: string): Promise<{ verified: boolean; planId: string; message: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/payments/paystack/verify/${encodeURIComponent(reference)}`, {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Paystack verification failed.');
    return data;
  },
};
