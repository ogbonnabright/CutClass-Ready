export type UserRole = 'member' | 'barber' | 'admin';

export interface PaymentMethodSummary {
  brand: 'mastercard' | 'visa' | 'verve' | 'card';
  last4: string;
  expMonth: string;
  expYear: string;
  cardholderName?: string;
  bank?: string;
}

export interface UserSubscription {
  planId: string;
  planName: string;
  price: string;
  priceNum: number;
  period: string;
  credits: number;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  activatedAt: string;
  nextBillingDate: string;
  paymentMethod?: PaymentMethodSummary;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  haircutCredits: number;
  creditsUsed?: number;
  subscription?: UserSubscription | null;
  defaultAddress?: string;
  defaultDistrict?: string;
  defaultLandmark?: string;
}

export interface Plan {
  id: string;
  number: string;
  name: string;
  credits: number;
  price: string;
  priceNum: number;
  period: string;
  description: string;
  badge?: string;
  isPopular?: boolean;
  features?: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'haircut' | 'grooming' | 'treatment';
  description: string;
  durationMinutes: number;
  coveredByPlans: string[]; // Plan IDs that cover this with 1 credit, e.g. ['starter', 'regular', 'executive', 'family']
  extraCostNum: number; // In NGN, 0 if standard
  requiresHaircutCredit: boolean;
  badge?: string;
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  status: 'approved' | 'pending' | 'suspended';
  isAvailable: boolean;
  serviceAreas: string[]; // Abuja districts
  specialties: string[];
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
}

export type AppointmentStatus =
  | 'pending_approval'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'missed';

export interface Appointment {
  id: string;
  bookingRef: string; // e.g. "CC-BK-7482"
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  barberId: string;
  barberName: string;
  barberAvatar?: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  locationType: 'home' | 'studio';
  address: string;
  district: string;
  landmark?: string;
  accessInstructions?: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  creditDeducted: number;
  creditRestored?: boolean;
  extraCharge: number;
  paymentStatus: 'covered_by_plan' | 'paid' | 'pending';
  paymentReference?: string;
  notes?: string;
  safetyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  memberId: string;
  appointmentId?: string;
  amount: number; // positive = credit added/refunded, negative = credit deducted
  balanceAfter: number;
  type: 'subscription_allocation' | 'booking_deduction' | 'cancellation_refund' | 'admin_adjustment';
  description: string;
  createdAt: string;
}

export interface SafetyReport {
  id: string;
  appointmentRef: string;
  reporterId: string;
  reporterRole: UserRole;
  reporterName: string;
  category: 'unprofessional_behavior' | 'safety_hazard' | 'lateness' | 'hygiene' | 'other';
  description: string;
  status: 'submitted' | 'under_review' | 'resolved';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  targetId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}
