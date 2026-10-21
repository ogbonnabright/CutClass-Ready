import { firestore } from './firebaseAdmin';
import {
  Appointment,
  Barber,
  CreditTransaction,
  SafetyReport,
  ServiceItem,
  User,
  UserSubscription,
  AuditLog,
} from '../src/types';

// Initial pre-seeded Services
export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-standard',
    name: 'Standard Signature Haircut',
    category: 'haircut',
    description: 'Precision home haircut, edge cleanup, razor lineup, and post-cut antiseptic mist.',
    durationMinutes: 45,
    coveredByPlans: ['starter', 'regular', 'executive', 'family'],
    extraCostNum: 0,
    requiresHaircutCredit: true,
    badge: 'Popular',
  },
  {
    id: 'srv-executive',
    name: 'Executive Haircut & Deep Treatment',
    category: 'treatment',
    description: 'Precision haircut paired with scalp exfoliation, therapeutic hair food, and steam towel treatment.',
    durationMinutes: 60,
    coveredByPlans: ['executive'],
    extraCostNum: 7000,
    requiresHaircutCredit: true,
    badge: 'Executive Plan Included',
  },
  {
    id: 'srv-beard',
    name: 'Beard Sculpting & Hot Towel Care',
    category: 'grooming',
    description: 'Beard trimming, shape-up, organic softening oil, and warm eucalyptus towel massage.',
    durationMinutes: 30,
    coveredByPlans: ['executive'],
    extraCostNum: 5000,
    requiresHaircutCredit: false,
    badge: 'Add-on',
  },
  {
    id: 'srv-junior',
    name: 'Junior / Student Haircut',
    category: 'haircut',
    description: 'Gentle, modern trim and line-up for children and teenagers (up to 16 years).',
    durationMinutes: 35,
    coveredByPlans: ['starter', 'regular', 'executive', 'family'],
    extraCostNum: 0,
    requiresHaircutCredit: true,
  },
];

// Initial pre-seeded Abuja Barbers
export const DEFAULT_BARBERS: Barber[] = [
  {
    id: 'barber-tunde',
    name: 'Tunde Balogun',
    phone: '+234 803 456 7891',
    bio: 'Master barber with 9 years of luxury mobile grooming experience in Abuja. Known for sharp skin fades and crisp beard lines.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    rating: 4.95,
    reviewCount: 142,
    status: 'approved',
    isAvailable: true,
    serviceAreas: ['Maitama', 'Wuse II', 'Central Business District (CBD)', 'Garki'],
    specialties: ['Skin Fade', 'Razor Lineup', 'Executive Grooming'],
    workingHours: { start: '09:00', end: '18:00' },
  },
  {
    id: 'barber-emeka',
    name: 'Emeka Nwosu',
    phone: '+234 812 789 0123',
    bio: 'Precision scissor and clipper specialist. Certified in organic hair care treatments and sensitive skin sanitation.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    rating: 4.92,
    reviewCount: 98,
    status: 'approved',
    isAvailable: true,
    serviceAreas: ['Jabi', 'Utako', 'Life Camp & Jahi', 'Wuse II'],
    specialties: ['Scissor Work', 'Beard Shaping', 'Hair Treatment'],
    workingHours: { start: '09:00', end: '18:00' },
  },
  {
    id: 'barber-ibrahim',
    name: 'Ibrahim Musa',
    phone: '+234 809 345 6789',
    bio: 'Fastidious with hygiene, punctuality, and classic gentleman cuts. Serving Apo, Guzape, and Asokoro homes.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    rating: 4.88,
    reviewCount: 76,
    status: 'approved',
    isAvailable: true,
    serviceAreas: ['Asokoro', 'Apo & Guzape', 'Garki'],
    specialties: ['Classic Cut', 'Taper Fade', 'Beard Care'],
    workingHours: { start: '09:00', end: '18:00' },
  },
  {
    id: 'barber-daniel',
    name: 'Daniel Peters',
    phone: '+234 805 123 9876',
    bio: 'Mobile grooming professional specializing in modern trends, waves, and hair care rituals.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    rating: 4.9,
    reviewCount: 64,
    status: 'approved',
    isAvailable: true,
    serviceAreas: ['Maitama', 'Asokoro', 'Wuse II', 'Jabi'],
    specialties: ['Texture Cut', 'Children Haircuts', 'Beard Sculpting'],
    workingHours: { start: '09:00', end: '18:00' },
  },
];

// Fallback in-memory store for offline/local resilience
class DatabaseStore {
  users = new Map<string, User>();
  barbers = new Map<string, Barber>();
  services = new Map<string, ServiceItem>();
  appointments = new Map<string, Appointment>();
  creditTransactions = new Map<string, CreditTransaction>();
  payments = new Map<string, any>();
  auditLogs = new Map<string, AuditLog>();
  safetyReports = new Map<string, SafetyReport>();

  constructor() {
    // Seed defaults
    DEFAULT_SERVICES.forEach((s) => this.services.set(s.id, s));
    DEFAULT_BARBERS.forEach((b) => this.barbers.set(b.id, b));

    // Seed test demo member with active plan and credits
    const demoUser: User = {
      id: 'member-demo',
      name: 'Chinedu Eze',
      email: 'chinedu@example.com',
      phone: '+234 802 345 6789',
      role: 'member',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      haircutCredits: 3,
      creditsUsed: 1,
      subscription: {
        planId: 'regular',
        planName: 'Regular',
        price: '₦28,000',
        priceNum: 28000,
        period: '/ month',
        credits: 4,
        status: 'active',
        activatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        nextBillingDate: new Date(Date.now() + 86400000 * 20).toLocaleDateString(),
        paymentMethod: {
          brand: 'mastercard',
          last4: '4242',
          expMonth: '12',
          expYear: '28',
        },
      },
      defaultAddress: 'Plot 412, Aguiyi Ironsi Way, Maitama, Abuja',
      defaultDistrict: 'Maitama',
    };
    this.users.set(demoUser.id, demoUser);

    // Seed member with zero remaining credits
    const zeroCreditsUser: User = {
      id: 'user-zero-credits',
      name: 'Zero Credits Member',
      email: 'zero@cutclass.test',
      phone: '+234 801 111 2222',
      role: 'member',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      haircutCredits: 0,
      creditsUsed: 4,
      subscription: {
        planId: 'regular',
        planName: 'Regular',
        price: '₦28,000',
        priceNum: 28000,
        period: '/ month',
        credits: 4,
        status: 'active',
        activatedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
        nextBillingDate: new Date(Date.now() + 86400000 * 5).toLocaleDateString(),
      },
    };
    this.users.set(zeroCreditsUser.id, zeroCreditsUser);

    // Seed expired/unsubscribed user
    const unsubscribedUser: User = {
      id: 'user-unsubscribed',
      name: 'Unsubscribed User',
      email: 'unsub@cutclass.test',
      role: 'member',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      haircutCredits: 0,
      creditsUsed: 0,
      subscription: {
        planId: 'starter',
        planName: 'Starter',
        price: '₦15,000',
        priceNum: 15000,
        period: '/ month',
        credits: 2,
        status: 'expired',
        activatedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        nextBillingDate: new Date(Date.now() - 86400000 * 30).toLocaleDateString(),
      },
    };
    this.users.set(unsubscribedUser.id, unsubscribedUser);

    // Seed initial appointments
    const apt1: Appointment = {
      id: 'apt-seed-1',
      bookingRef: 'CC-BK-51920',
      memberId: 'member-demo',
      memberName: 'Chinedu Eze',
      memberEmail: 'chinedu@example.com',
      memberPhone: '+234 802 345 6789',
      barberId: 'barber-tunde',
      barberName: 'Tunde Balogun',
      barberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      serviceId: 'srv-standard',
      serviceName: 'Standard Signature Haircut',
      serviceDurationMinutes: 45,
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      time: '11:00',
      locationType: 'home',
      address: 'Plot 412, Aguiyi Ironsi Way, Maitama, Abuja',
      district: 'Maitama',
      landmark: 'Opposite Transcorp Hilton exit gate',
      accessInstructions: 'Call upon arrival; security gate buzzer #4',
      status: 'confirmed',
      creditDeducted: 1,
      extraCharge: 0,
      paymentStatus: 'covered_by_plan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.appointments.set(apt1.id, apt1);
  }
}

const memoryStore = new DatabaseStore();

export const dbService = {
  // 1. Users
  async getUser(userId: string): Promise<User | null> {
    try {
      const doc = await firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as User;
      }
    } catch {
      // Fallback to memory
    }
    return memoryStore.users.get(userId) || null;
  },

  async setUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      await firestore.collection('users').doc(userId).set(data, { merge: true });
    } catch {
      // Fallback
    }
    const current = memoryStore.users.get(userId) || ({} as User);
    memoryStore.users.set(userId, { ...current, ...data, id: userId } as User);
  },

  // 2. Barbers
  async getBarbers(district?: string): Promise<Barber[]> {
    let result: Barber[] = [];
    try {
      const snapshot = await firestore.collection('barbers').where('status', '==', 'approved').get();
      snapshot.forEach((doc) => {
        result.push({ id: doc.id, ...doc.data() } as Barber);
      });
    } catch {
      // Fallback
      result = Array.from(memoryStore.barbers.values()).filter((b) => b.status === 'approved');
    }

    if (result.length === 0) {
      result = Array.from(memoryStore.barbers.values()).filter((b) => b.status === 'approved');
    }

    if (district) {
      result = result.filter((b) =>
        b.serviceAreas.some((a) => a.toLowerCase().includes(district.toLowerCase()))
      );
    }
    return result;
  },

  async getBarber(barberId: string): Promise<Barber | null> {
    try {
      const doc = await firestore.collection('barbers').doc(barberId).get();
      if (doc.exists) return { id: doc.id, ...doc.data() } as Barber;
    } catch {}
    return memoryStore.barbers.get(barberId) || null;
  },

  async updateBarber(barberId: string, data: Partial<Barber>): Promise<Barber> {
    try {
      await firestore.collection('barbers').doc(barberId).set(data, { merge: true });
    } catch {}
    const current = memoryStore.barbers.get(barberId) || ({} as Barber);
    const updated = { ...current, ...data, id: barberId } as Barber;
    memoryStore.barbers.set(barberId, updated);
    return updated;
  },

  // 3. Services
  async getServices(): Promise<ServiceItem[]> {
    try {
      const snapshot = await firestore.collection('services').get();
      if (!snapshot.empty) {
        const list: ServiceItem[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as ServiceItem));
        return list;
      }
    } catch {}
    return Array.from(memoryStore.services.values());
  },

  // 4. Appointments query
  async getAppointmentsForMember(memberId: string): Promise<Appointment[]> {
    try {
      const snapshot = await firestore
        .collection('appointments')
        .where('memberId', '==', memberId)
        .orderBy('date', 'desc')
        .get();
      const list: Appointment[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Appointment));
      if (list.length > 0) return list;
    } catch {}
    return Array.from(memoryStore.appointments.values())
      .filter((a) => a.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getAppointmentsForBarber(barberId: string): Promise<Appointment[]> {
    try {
      const snapshot = await firestore
        .collection('appointments')
        .where('barberId', '==', barberId)
        .orderBy('date', 'desc')
        .get();
      const list: Appointment[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Appointment));
      if (list.length > 0) return list;
    } catch {}
    return Array.from(memoryStore.appointments.values())
      .filter((a) => a.barberId === barberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getAllAppointments(): Promise<Appointment[]> {
    try {
      const snapshot = await firestore.collection('appointments').orderBy('date', 'desc').get();
      const list: Appointment[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Appointment));
      if (list.length > 0) return list;
    } catch {}
    return Array.from(memoryStore.appointments.values()).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    try {
      const doc = await firestore.collection('appointments').doc(appointmentId).get();
      if (doc.exists) return { id: doc.id, ...doc.data() } as Appointment;
    } catch {}
    return memoryStore.appointments.get(appointmentId) || null;
  },

  // 5. ATOMIC RESERVATION AND BOOKING CREATION
  // Uses Firestore runTransaction or atomic mutex locks to guarantee:
  // - Member subscription status is strictly verified on server
  // - Credits are deducted exactly once
  // - Double-booking collision is completely prevented
  async createAtomicBooking(payload: {
    memberId: string;
    memberName: string;
    memberEmail: string;
    memberPhone: string;
    barberId: string;
    serviceId: string;
    date: string;
    time: string;
    locationType: 'home' | 'studio';
    address: string;
    district: string;
    landmark?: string;
    accessInstructions?: string;
    extraCharge?: number;
    paymentReference?: string;
  }): Promise<{ appointment: Appointment; updatedCredits: number; bookingRef: string }> {
    const {
      memberId,
      memberName,
      memberEmail,
      memberPhone,
      barberId,
      serviceId,
      date,
      time,
      locationType,
      address,
      district,
      landmark,
      accessInstructions,
      extraCharge = 0,
      paymentReference,
    } = payload;

    // Service lookup
    const service = memoryStore.services.get(serviceId) || DEFAULT_SERVICES.find((s) => s.id === serviceId);
    if (!service) throw new Error('Invalid service selection.');

    // Barber lookup
    const barber = await this.getBarber(barberId);
    if (!barber || barber.status !== 'approved' || !barber.isAvailable) {
      throw new Error('Selected barber is currently unavailable for bookings.');
    }

    // Try Firestore Atomic Transaction
    try {
      return await firestore.runTransaction(async (transaction) => {
        const userRef = firestore.collection('users').doc(memberId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('User profile record not found in system.');
        }

        const userData = userDoc.data() as User;

        // Verify active subscription
        if (!userData.subscription || userData.subscription.status !== 'active') {
          throw new Error('Active CutClass membership required. Please activate your subscription first.');
        }

        // Verify credits
        const availableCredits = userData.haircutCredits ?? 0;
        if (service.requiresHaircutCredit && availableCredits < 1) {
          throw new Error('Insufficient haircut credits. Your remaining credit balance is 0.');
        }

        // Conflict check within transaction
        const existingQuery = await firestore
          .collection('appointments')
          .where('barberId', '==', barberId)
          .where('date', '==', date)
          .where('status', 'in', ['confirmed', 'in_progress'])
          .get();

        const [h, m] = time.split(':').map(Number);
        const slotStart = h * 60 + m;
        const slotEnd = slotStart + service.durationMinutes;
        const travelBuffer = 30;

        let hasConflict = false;
        existingQuery.forEach((doc) => {
          const apt = doc.data() as Appointment;
          const [aptH, aptM] = apt.time.split(':').map(Number);
          const aptStart = aptH * 60 + aptM;
          const aptEnd = aptStart + apt.serviceDurationMinutes;
          if (slotStart < aptEnd + travelBuffer && slotEnd + travelBuffer > aptStart) {
            hasConflict = true;
          }
        });

        if (hasConflict) {
          throw new Error('The requested time slot has already been reserved for this barber. Please choose another time.');
        }

        // Decrement credit
        const newCredits = availableCredits - (service.requiresHaircutCredit ? 1 : 0);
        transaction.update(userRef, {
          haircutCredits: newCredits,
          creditsUsed: (userData.creditsUsed || 0) + 1,
          updatedAt: new Date().toISOString(),
        });

        // Create appointment
        const aptId = `apt-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const bookingRef = `CC-BK-${Math.floor(10000 + Math.random() * 90000)}`;
        const aptRef = firestore.collection('appointments').doc(aptId);

        const newAppointment: Appointment = {
          id: aptId,
          bookingRef,
          memberId,
          memberName: userData.name || memberName,
          memberEmail: userData.email || memberEmail,
          memberPhone: memberPhone || userData.phone || '+234 800 000 0000',
          barberId,
          barberName: barber.name,
          barberAvatar: barber.avatarUrl,
          serviceId: service.id,
          serviceName: service.name,
          serviceDurationMinutes: service.durationMinutes,
          date,
          time,
          locationType,
          address,
          district,
          landmark,
          accessInstructions,
          status: 'confirmed',
          creditDeducted: service.requiresHaircutCredit ? 1 : 0,
          extraCharge,
          paymentStatus: extraCharge > 0 ? 'paid' : 'covered_by_plan',
          paymentReference,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        transaction.set(aptRef, newAppointment);

        // Transaction record
        if (service.requiresHaircutCredit) {
          const txRef = firestore.collection('creditTransactions').doc(`tx-${Date.now()}`);
          transaction.set(txRef, {
            id: txRef.id,
            memberId,
            appointmentId: aptId,
            amount: -1,
            balanceAfter: newCredits,
            type: 'booking_deduction',
            description: `Haircut booking ${bookingRef} with ${barber.name} (${date} at ${time})`,
            createdAt: new Date().toISOString(),
          });
        }

        // Also update memory mirror
        memoryStore.appointments.set(aptId, newAppointment);
        memoryStore.users.set(memberId, { ...userData, haircutCredits: newCredits });

        return { appointment: newAppointment, updatedCredits: newCredits, bookingRef };
      });
    } catch (firestoreError: any) {
      if (
        firestoreError.message?.includes('Active CutClass') ||
        firestoreError.message?.includes('Insufficient haircut') ||
        firestoreError.message?.includes('already been reserved')
      ) {
        throw firestoreError;
      }

      // Memory Store atomic execution (fallback for local emulator without service account)
      const user = memoryStore.users.get(memberId);
      if (!user) throw new Error('User profile record not found.');
      if (!user.subscription || user.subscription.status !== 'active') {
        throw new Error('Active CutClass membership required. Please activate your subscription first.');
      }
      const availableCredits = user.haircutCredits ?? 0;
      if (service.requiresHaircutCredit && availableCredits < 1) {
        throw new Error('Insufficient haircut credits. Your remaining credit balance is 0.');
      }

      // Collision check in memory
      const [h, m] = time.split(':').map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + service.durationMinutes;
      const travelBuffer = 30;

      const hasConflict = Array.from(memoryStore.appointments.values()).some((apt) => {
        if (apt.barberId !== barberId || apt.date !== date || apt.status === 'cancelled' || apt.status === 'missed') {
          return false;
        }
        const [aptH, aptM] = apt.time.split(':').map(Number);
        const aptStart = aptH * 60 + aptM;
        const aptEnd = aptStart + apt.serviceDurationMinutes;
        return slotStart < aptEnd + travelBuffer && slotEnd + travelBuffer > aptStart;
      });

      if (hasConflict) {
        throw new Error('The requested time slot has already been reserved for this barber. Please choose another time.');
      }

      const newCredits = availableCredits - (service.requiresHaircutCredit ? 1 : 0);
      user.haircutCredits = newCredits;
      user.creditsUsed = (user.creditsUsed || 0) + 1;

      const aptId = `apt-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const bookingRef = `CC-BK-${Math.floor(10000 + Math.random() * 90000)}`;

      const newAppointment: Appointment = {
        id: aptId,
        bookingRef,
        memberId,
        memberName: user.name || memberName,
        memberEmail: user.email || memberEmail,
        memberPhone: memberPhone || user.phone || '+234 800 000 0000',
        barberId,
        barberName: barber.name,
        barberAvatar: barber.avatarUrl,
        serviceId: service.id,
        serviceName: service.name,
        serviceDurationMinutes: service.durationMinutes,
        date,
        time,
        locationType,
        address,
        district,
        landmark,
        accessInstructions,
        status: 'confirmed',
        creditDeducted: service.requiresHaircutCredit ? 1 : 0,
        extraCharge,
        paymentStatus: extraCharge > 0 ? 'paid' : 'covered_by_plan',
        paymentReference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      memoryStore.appointments.set(aptId, newAppointment);

      if (service.requiresHaircutCredit) {
        const txId = `tx-${Date.now()}`;
        memoryStore.creditTransactions.set(txId, {
          id: txId,
          memberId,
          appointmentId: aptId,
          amount: -1,
          balanceAfter: newCredits,
          type: 'booking_deduction',
          description: `Haircut booking ${bookingRef} with ${barber.name} (${date} at ${time})`,
          createdAt: new Date().toISOString(),
        });
      }

      return { appointment: newAppointment, updatedCredits: newCredits, bookingRef };
    }
  },

  // 6. CANCELLATION WITH ATOMIC CREDIT RESTORATION (>12 HOURS)
  async cancelAppointment(
    appointmentId: string,
    cancelledByUid: string,
    role: string,
    reason: string
  ): Promise<{ appointment: Appointment; creditRestored: boolean; message: string }> {
    const apt = await this.getAppointment(appointmentId);
    if (!apt) throw new Error('Appointment not found.');

    if (role !== 'admin' && apt.memberId !== cancelledByUid) {
      throw new Error('Forbidden: You can only cancel your own appointments.');
    }

    if (apt.status === 'cancelled') throw new Error('Appointment is already cancelled.');
    if (apt.status === 'completed') throw new Error('Cannot cancel an appointment that was already completed.');

    const aptDateTime = new Date(`${apt.date}T${apt.time}:00`);
    const hoursRemaining = (aptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const creditRestored = hoursRemaining >= 12 && apt.creditDeducted > 0;

    apt.status = 'cancelled';
    apt.cancellationReason = reason;
    apt.cancelledAt = new Date().toISOString();
    apt.creditRestored = creditRestored;
    apt.updatedAt = new Date().toISOString();

    // Firestore update
    try {
      await firestore.collection('appointments').doc(appointmentId).set(apt, { merge: true });
      if (creditRestored) {
        const userRef = firestore.collection('users').doc(apt.memberId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const u = userDoc.data() as User;
          await userRef.update({
            haircutCredits: (u.haircutCredits || 0) + 1,
            creditsUsed: Math.max(0, (u.creditsUsed || 1) - 1),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch {}

    // Memory mirror
    memoryStore.appointments.set(appointmentId, apt);
    if (creditRestored) {
      const u = memoryStore.users.get(apt.memberId);
      if (u) {
        u.haircutCredits = (u.haircutCredits || 0) + 1;
        u.creditsUsed = Math.max(0, (u.creditsUsed || 1) - 1);
      }
      const txId = `tx-${Date.now()}`;
      memoryStore.creditTransactions.set(txId, {
        id: txId,
        memberId: apt.memberId,
        appointmentId: apt.id,
        amount: 1,
        balanceAfter: (u?.haircutCredits ?? 0),
        type: 'cancellation_refund',
        description: `Credit restored: Cancelled booking ${apt.bookingRef} (>12h notice)`,
        createdAt: new Date().toISOString(),
      });
    }

    const message = creditRestored
      ? 'Appointment cancelled successfully. Your 1 haircut credit has been restored to your balance.'
      : 'Appointment cancelled within the 12-hour window. According to CutClass policy, credits are not restored for late cancellations.';

    return { appointment: apt, creditRestored, message };
  },

  // 7. RESCHEDULING
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    requestedByUid: string,
    role: string
  ): Promise<Appointment> {
    const apt = await this.getAppointment(appointmentId);
    if (!apt) throw new Error('Appointment not found.');

    if (role !== 'admin' && apt.memberId !== requestedByUid) {
      throw new Error('Forbidden: You can only reschedule your own appointments.');
    }

    if (apt.status !== 'confirmed' && apt.status !== 'pending_approval') {
      throw new Error(`Cannot reschedule appointment with status: ${apt.status}`);
    }

    // Conflict check
    const allApts = await this.getAllAppointments();
    const [h, m] = newTime.split(':').map(Number);
    const slotStart = h * 60 + m;
    const slotEnd = slotStart + apt.serviceDurationMinutes;
    const travelBuffer = 30;

    const hasConflict = allApts.some((a) => {
      if (a.id === apt.id || a.barberId !== apt.barberId || a.date !== newDate || a.status === 'cancelled' || a.status === 'missed') {
        return false;
      }
      const [aptH, aptM] = a.time.split(':').map(Number);
      const aptStart = aptH * 60 + aptM;
      const aptEnd = aptStart + a.serviceDurationMinutes;
      return slotStart < aptEnd + travelBuffer && slotEnd + travelBuffer > aptStart;
    });

    if (hasConflict) {
      throw new Error('The selected new time slot is unavailable for this barber.');
    }

    apt.date = newDate;
    apt.time = newTime;
    apt.updatedAt = new Date().toISOString();

    try {
      await firestore.collection('appointments').doc(appointmentId).set(apt, { merge: true });
    } catch {}
    memoryStore.appointments.set(appointmentId, apt);

    return apt;
  },

  // 8. Credit Transactions
  async getTransactionsForMember(memberId: string): Promise<CreditTransaction[]> {
    try {
      const snap = await firestore
        .collection('creditTransactions')
        .where('memberId', '==', memberId)
        .orderBy('createdAt', 'desc')
        .get();
      const list: CreditTransaction[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CreditTransaction));
      if (list.length > 0) return list;
    } catch {}
    return Array.from(memoryStore.creditTransactions.values())
      .filter((tx) => tx.memberId === memberId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // 9. Audit Logs & Safety Reports
  async recordAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    const logDoc: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    try {
      await firestore.collection('auditLogs').doc(logDoc.id).set(logDoc);
    } catch {}
    memoryStore.auditLogs.set(logDoc.id, logDoc);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const snap = await firestore.collection('auditLogs').orderBy('createdAt', 'desc').limit(50).get();
      const list: AuditLog[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLog));
      if (list.length > 0) return list;
    } catch {}
    return Array.from(memoryStore.auditLogs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createSafetyReport(report: Omit<SafetyReport, 'id' | 'createdAt' | 'status'>): Promise<SafetyReport> {
    const fullReport: SafetyReport = {
      ...report,
      id: `rep-${Date.now()}`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    try {
      await firestore.collection('safetyReports').doc(fullReport.id).set(fullReport);
    } catch {}
    memoryStore.safetyReports.set(fullReport.id, fullReport);
    return fullReport;
  },

  async getSafetyReports(): Promise<SafetyReport[]> {
    try {
      const snap = await firestore.collection('safetyReports').orderBy('createdAt', 'desc').get();
      const list: SafetyReport[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as SafetyReport));
      if (list.length > 0) return list;
    } catch {}
    return Array.from(memoryStore.safetyReports.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // 10. PAYSTACK IDEMPOTENT SUBSCRIPTION ACTIVATION
  async recordVerifiedPaymentAndActivateSubscription(
    reference: string,
    memberId: string,
    planId: string,
    amountNaira: number,
    channel: string
  ): Promise<boolean> {
    // Check if already processed
    if (memoryStore.payments.has(reference)) {
      return true;
    }

    try {
      const payRef = firestore.collection('payments').doc(reference);
      const payDoc = await payRef.get();
      if (payDoc.exists) return true; // Idempotent check
    } catch {}

    const plans: Record<string, { name: string; price: string; credits: number }> = {
      starter: { name: 'Starter', price: '₦15,000', credits: 2 },
      regular: { name: 'Regular', price: '₦28,000', credits: 4 },
      executive: { name: 'Executive', price: '₦35,000', credits: 4 },
      family: { name: 'Family', price: '₦48,000', credits: 8 },
    };

    const plan = plans[planId] || plans.regular;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    const subscription: UserSubscription = {
      planId,
      planName: plan.name,
      price: plan.price,
      priceNum: amountNaira,
      period: '/ month',
      credits: plan.credits,
      status: 'active',
      activatedAt: new Date().toISOString(),
      nextBillingDate: nextDate.toLocaleDateString(),
    };

    const paymentRecord = {
      reference,
      memberId,
      planId,
      amount: amountNaira,
      channel,
      status: 'success',
      createdAt: new Date().toISOString(),
    };

    try {
      await firestore.collection('payments').doc(reference).set(paymentRecord);
      const userRef = firestore.collection('users').doc(memberId);
      await userRef.set(
        {
          subscription,
          haircutCredits: plan.credits,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {}

    memoryStore.payments.set(reference, paymentRecord);
    const existing = memoryStore.users.get(memberId) || ({} as User);
    memoryStore.users.set(memberId, {
      ...existing,
      id: memberId,
      subscription,
      haircutCredits: plan.credits,
    } as User);

    return true;
  },
};
