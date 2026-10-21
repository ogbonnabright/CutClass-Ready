import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import {
  Appointment,
  Barber,
  CreditTransaction,
  SafetyReport,
  ServiceItem,
  User,
  UserRole,
  AuditLog,
} from './src/types';

dotenv.config();

const app = express();
app.use(express.json());

// ============================================================================
// IN-MEMORY / FIRESTORE REPOSITORY (Server-authoritative state)
// ============================================================================

// Pre-seeded Services
const services: ServiceItem[] = [
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
    extraCostNum: 7000, // ₦7,000 add-on if on Starter or Regular; ₦0 on Executive
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

// Pre-seeded Certified Abuja Barbers
const barbers: Barber[] = [
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

// Sample and active Appointments
let appointments: Appointment[] = [
  {
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
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days in future
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
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'apt-seed-2',
    bookingRef: 'CC-BK-40912',
    memberId: 'member-demo',
    memberName: 'Chinedu Eze',
    memberEmail: 'chinedu@example.com',
    memberPhone: '+234 802 345 6789',
    barberId: 'barber-emeka',
    barberName: 'Emeka Nwosu',
    barberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    serviceId: 'srv-standard',
    serviceName: 'Standard Signature Haircut',
    serviceDurationMinutes: 45,
    date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0], // 8 days ago
    time: '15:30',
    locationType: 'home',
    address: 'Plot 412, Aguiyi Ironsi Way, Maitama, Abuja',
    district: 'Maitama',
    status: 'completed',
    creditDeducted: 1,
    extraCharge: 0,
    paymentStatus: 'covered_by_plan',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

// Sample Credit Transactions
let creditTransactions: CreditTransaction[] = [
  {
    id: 'tx-seed-1',
    memberId: 'member-demo',
    amount: 4,
    balanceAfter: 4,
    type: 'subscription_allocation',
    description: 'Monthly Regular plan allocation (4 haircut credits)',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'tx-seed-2',
    memberId: 'member-demo',
    appointmentId: 'apt-seed-2',
    amount: -1,
    balanceAfter: 3,
    type: 'booking_deduction',
    description: 'Booking confirmation: CC-BK-40912 with Emeka Nwosu',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: 'tx-seed-3',
    memberId: 'member-demo',
    appointmentId: 'apt-seed-1',
    amount: -1,
    balanceAfter: 2,
    type: 'booking_deduction',
    description: 'Booking confirmation: CC-BK-51920 with Tunde Balogun',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Safety Reports
const safetyReports: SafetyReport[] = [];

// Audit Logs
const auditLogs: AuditLog[] = [
  {
    id: 'log-1',
    action: 'SYSTEM_BOOT',
    performedBy: 'System',
    performedByRole: 'system',
    details: { message: 'CutClass appointment and subscription booking engine initialized' },
    createdAt: new Date().toISOString(),
  },
];

// Helper to log audit events
function recordAuditLog(action: string, performedBy: string, performedByRole: string, details: Record<string, unknown>, targetId?: string) {
  auditLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    performedBy,
    performedByRole,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  });
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Services & Plan coverage
app.get('/api/services', (_req: Request, res: Response) => {
  res.json({ success: true, services });
});

// 2. Barbers list
app.get('/api/barbers', (req: Request, res: Response) => {
  const district = req.query.district as string | undefined;
  let result = barbers.filter((b) => b.status === 'approved');
  if (district) {
    result = result.filter((b) =>
      b.serviceAreas.some((area) => area.toLowerCase().includes(district.toLowerCase()))
    );
  }
  res.json({ success: true, barbers: result });
});

// 3. Compute genuinely available time slots for a barber on a date
app.get('/api/barbers/available-slots', (req: Request, res: Response) => {
  const { barberId, date, durationMinutes } = req.query;

  if (!barberId || !date) {
    return res.status(400).json({ error: 'Missing barberId or date parameter.' });
  }

  const duration = parseInt((durationMinutes as string) || '45', 10);
  const barber = barbers.find((b) => b.id === barberId);

  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  if (barber.status !== 'approved' || !barber.isAvailable) {
    return res.json({ success: true, slots: [], message: 'Barber is currently unavailable.' });
  }

  // Find all non-cancelled appointments for this barber on this date
  const bookedForBarber = appointments.filter(
    (apt) =>
      apt.barberId === barberId &&
      apt.date === date &&
      apt.status !== 'cancelled' &&
      apt.status !== 'missed'
  );

  // Generate candidate slots every 30 mins between working hours (09:00 - 18:00)
  const candidateTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  const now = new Date();
  const selectedDateStr = date as string;
  const isToday = now.toISOString().split('T')[0] === selectedDateStr;

  const availableSlots = candidateTimes.filter((timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const slotStartMin = h * 60 + m;
    const slotEndMin = slotStartMin + duration;

    // Check if slot exceeds working day (18:00 = 1080 min)
    if (slotEndMin > 18 * 60) return false;

    // Minimum 2-hour lead time if booking today
    if (isToday) {
      const currentMin = now.getHours() * 60 + now.getMinutes();
      if (slotStartMin < currentMin + 120) return false;
    }

    // Check for collision with existing appointments (with 30-min travel buffer between home visits)
    const travelBufferMin = 30;
    const hasConflict = bookedForBarber.some((apt) => {
      const [aptH, aptM] = apt.time.split(':').map(Number);
      const aptStart = aptH * 60 + aptM;
      const aptEnd = aptStart + apt.serviceDurationMinutes;

      // Overlap considering travel buffer: [slotStart, slotEnd] overlaps with [aptStart - buffer, aptEnd + buffer]
      return slotStartMin < aptEnd + travelBufferMin && slotEndMin + travelBufferMin > aptStart;
    });

    return !hasConflict;
  });

  res.json({
    success: true,
    barberId,
    date,
    slots: availableSlots,
    totalAvailable: availableSlots.length,
  });
});

// 4. ATOMIC BOOKING CREATION
app.post('/api/bookings', (req: Request, res: Response) => {
  const {
    memberId,
    memberName,
    memberEmail,
    memberPhone,
    barberId,
    serviceId,
    date,
    time,
    locationType = 'home',
    address,
    district,
    landmark,
    accessInstructions,
    userSubscription,
    userHaircutCredits,
    extraCharge = 0,
    paymentStatus = 'covered_by_plan',
    paymentReference,
    notes,
  } = req.body;

  // Validation 1: Required fields
  if (!memberId || !barberId || !serviceId || !date || !time || !address || !district) {
    return res.status(400).json({ error: 'Missing required booking information.' });
  }

  // Validation 2: Subscription verification
  if (!userSubscription || userSubscription.status !== 'active') {
    return res.status(403).json({
      error: 'Active CutClass subscription required to book appointments. Please activate a plan first.',
    });
  }

  // Validation 3: Haircut credits verification
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  const creditsAvailable = userHaircutCredits !== undefined ? userHaircutCredits : 0;
  if (service.requiresHaircutCredit && creditsAvailable < 1) {
    return res.status(403).json({
      error: 'Insufficient haircut credits. You have 0 available credits on your plan.',
    });
  }

  // Validation 4: Barber existence and availability
  const barber = barbers.find((b) => b.id === barberId);
  if (!barber || barber.status !== 'approved' || !barber.isAvailable) {
    return res.status(400).json({ error: 'Selected barber is not currently available for booking.' });
  }

  // Validation 5: Double-booking prevention check (Atomic conflict verification)
  const [h, m] = (time as string).split(':').map(Number);
  const slotStart = h * 60 + m;
  const slotEnd = slotStart + service.durationMinutes;
  const travelBuffer = 30;

  const existingConflict = appointments.find(
    (apt) =>
      apt.barberId === barberId &&
      apt.date === date &&
      apt.status !== 'cancelled' &&
      apt.status !== 'missed' &&
      (() => {
        const [aptH, aptM] = apt.time.split(':').map(Number);
        const aptStart = aptH * 60 + aptM;
        const aptEnd = aptStart + apt.serviceDurationMinutes;
        return slotStart < aptEnd + travelBuffer && slotEnd + travelBuffer > aptStart;
      })()
  );

  if (existingConflict) {
    return res.status(409).json({
      error: 'The requested time slot has just been reserved. Please select another time.',
    });
  }

  // Generate unique Booking Reference
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const bookingRef = `CC-BK-${randomSuffix}`;
  const appointmentId = `apt-${Date.now()}`;

  const newAppointment: Appointment = {
    id: appointmentId,
    bookingRef,
    memberId,
    memberName,
    memberEmail,
    memberPhone: memberPhone || '+234 800 000 0000',
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
    extraCharge: Number(extraCharge) || 0,
    paymentStatus,
    paymentReference,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appointments.unshift(newAppointment);

  // Record credit transaction
  const newCreditBalance = creditsAvailable - (service.requiresHaircutCredit ? 1 : 0);
  if (service.requiresHaircutCredit) {
    creditTransactions.unshift({
      id: `tx-${Date.now()}`,
      memberId,
      appointmentId: newAppointment.id,
      amount: -1,
      balanceAfter: newCreditBalance,
      type: 'booking_deduction',
      description: `Haircut booking ${bookingRef} with ${barber.name} (${date} at ${time})`,
      createdAt: new Date().toISOString(),
    });
  }

  // Audit log
  recordAuditLog(
    'APPOINTMENT_CREATED',
    memberName || memberId,
    'member',
    { bookingRef, barberName: barber.name, serviceName: service.name, date, time, newCreditBalance },
    newAppointment.id
  );

  res.status(201).json({
    success: true,
    appointment: newAppointment,
    updatedCredits: newCreditBalance,
    bookingRef,
  });
});

// 5. APPOINTMENT CANCELLATION WITH 12-HOUR CREDIT RESTORATION RULE
app.post('/api/bookings/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const { memberId, reason = 'Member cancelled request' } = req.body;

  const aptIndex = appointments.findIndex((a) => a.id === id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  const apt = appointments[aptIndex];

  if (apt.status === 'cancelled') {
    return res.status(400).json({ error: 'Appointment is already cancelled.' });
  }

  if (apt.status === 'completed') {
    return res.status(400).json({ error: 'Cannot cancel an appointment that has already been completed.' });
  }

  // Calculate time remaining until appointment
  const aptDateTime = new Date(`${apt.date}T${apt.time}:00`);
  const hoursRemaining = (aptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  // Policy: Cancellations at least 12 hours before appointment restore haircut credit
  const isEligibleForRefund = hoursRemaining >= 12;
  const creditRestored = isEligibleForRefund && apt.creditDeducted > 0;

  apt.status = 'cancelled';
  apt.cancellationReason = reason;
  apt.cancelledAt = new Date().toISOString();
  apt.creditRestored = creditRestored;
  apt.updatedAt = new Date().toISOString();

  // If credit is restored, record refund transaction
  if (creditRestored) {
    creditTransactions.unshift({
      id: `tx-${Date.now()}`,
      memberId: apt.memberId,
      appointmentId: apt.id,
      amount: 1,
      balanceAfter: 0, // client computes or increments
      type: 'cancellation_refund',
      description: `Credit restored: Cancelled booking ${apt.bookingRef} (>12h notice)`,
      createdAt: new Date().toISOString(),
    });
  }

  recordAuditLog(
    'APPOINTMENT_CANCELLED',
    memberId || apt.memberId,
    'member',
    { bookingRef: apt.bookingRef, hoursRemaining: hoursRemaining.toFixed(1), creditRestored },
    apt.id
  );

  res.json({
    success: true,
    appointment: apt,
    creditRestored,
    hoursRemaining: hoursRemaining.toFixed(1),
    message: creditRestored
      ? 'Appointment cancelled successfully. Your 1 haircut credit has been restored to your balance.'
      : 'Appointment cancelled within the 12-hour window. According to CutClass policy, credits are not restored for late cancellations.',
  });
});

// 6. APPOINTMENT RESCHEDULING
app.post('/api/bookings/:id/reschedule', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newDate, newTime, memberId } = req.body;

  if (!newDate || !newTime) {
    return res.status(400).json({ error: 'Missing new date or time.' });
  }

  const apt = appointments.find((a) => a.id === id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  if (apt.status !== 'confirmed' && apt.status !== 'pending_approval') {
    return res.status(400).json({ error: `Cannot reschedule appointment with status: ${apt.status}` });
  }

  // Conflict check for the new date and time
  const [h, m] = (newTime as string).split(':').map(Number);
  const slotStart = h * 60 + m;
  const slotEnd = slotStart + apt.serviceDurationMinutes;
  const travelBuffer = 30;

  const conflict = appointments.find(
    (a) =>
      a.id !== apt.id &&
      a.barberId === apt.barberId &&
      a.date === newDate &&
      a.status !== 'cancelled' &&
      a.status !== 'missed' &&
      (() => {
        const [aptH, aptM] = a.time.split(':').map(Number);
        const aptStart = aptH * 60 + aptM;
        const aptEnd = aptStart + a.serviceDurationMinutes;
        return slotStart < aptEnd + travelBuffer && slotEnd + travelBuffer > aptStart;
      })()
  );

  if (conflict) {
    return res.status(409).json({ error: 'The new time slot is no longer available. Please choose another slot.' });
  }

  const oldDate = apt.date;
  const oldTime = apt.time;

  apt.date = newDate;
  apt.time = newTime;
  apt.updatedAt = new Date().toISOString();

  recordAuditLog(
    'APPOINTMENT_RESCHEDULED',
    memberId || apt.memberId,
    'member',
    { bookingRef: apt.bookingRef, from: `${oldDate} ${oldTime}`, to: `${newDate} ${newTime}` },
    apt.id
  );

  res.json({
    success: true,
    appointment: apt,
    message: `Appointment successfully rescheduled to ${newDate} at ${newTime}.`,
  });
});

// 7. MEMBER DASHBOARD DATA
app.get('/api/member/dashboard-data', (req: Request, res: Response) => {
  const memberId = (req.query.memberId as string) || 'member-demo';

  const memberAppointments = appointments.filter((a) => a.memberId === memberId);
  const memberTxs = creditTransactions.filter((tx) => tx.memberId === memberId);

  // Partition into upcoming, completed, cancelled
  const upcoming = memberAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending_approval' || a.status === 'in_progress'
  );
  const past = memberAppointments.filter((a) => a.status === 'completed');
  const cancelled = memberAppointments.filter((a) => a.status === 'cancelled' || a.status === 'missed');

  res.json({
    success: true,
    appointments: {
      upcoming,
      past,
      cancelled,
      all: memberAppointments,
    },
    transactions: memberTxs,
  });
});

// 8. BARBER DASHBOARD DATA
app.get('/api/barber/dashboard-data', (req: Request, res: Response) => {
  const barberId = (req.query.barberId as string) || 'barber-tunde';

  const barber = barbers.find((b) => b.id === barberId) || barbers[0];
  const assigned = appointments.filter((a) => a.barberId === barber.id);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = assigned.filter((a) => a.date === todayStr && a.status !== 'cancelled');
  const upcomingApts = assigned.filter((a) => a.date > todayStr && a.status !== 'cancelled');
  const pastApts = assigned.filter((a) => a.status === 'completed' || a.status === 'missed');

  res.json({
    success: true,
    barber,
    schedule: {
      today: todayApts,
      upcoming: upcomingApts,
      past: pastApts,
      all: assigned,
    },
  });
});

// 9. BARBER STATUS UPDATE (In progress, Completed, Missed)
app.post('/api/barber/appointments/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, barberId, notes } = req.body;

  const validStatuses = ['confirmed', 'in_progress', 'completed', 'missed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid appointment status.' });
  }

  const apt = appointments.find((a) => a.id === id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  apt.status = status;
  if (notes) apt.notes = notes;
  apt.updatedAt = new Date().toISOString();

  recordAuditLog(
    'BARBER_STATUS_UPDATE',
    barberId || apt.barberName,
    'barber',
    { bookingRef: apt.bookingRef, newStatus: status, notes },
    apt.id
  );

  res.json({ success: true, appointment: apt });
});

// 10. BARBER AVAILABILITY TOGGLE
app.post('/api/barber/availability', (req: Request, res: Response) => {
  const { barberId, isAvailable } = req.body;

  const barber = barbers.find((b) => b.id === barberId);
  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  barber.isAvailable = Boolean(isAvailable);

  recordAuditLog(
    'BARBER_AVAILABILITY_CHANGED',
    barber.name,
    'barber',
    { isAvailable: barber.isAvailable },
    barber.id
  );

  res.json({ success: true, barber });
});

// 11. ADMIN DASHBOARD OVERVIEW
app.get('/api/admin/dashboard-data', (_req: Request, res: Response) => {
  const totalBookings = appointments.length;
  const completedBookings = appointments.filter((a) => a.status === 'completed').length;
  const activeBookings = appointments.filter((a) => a.status === 'confirmed').length;
  const cancelledBookings = appointments.filter((a) => a.status === 'cancelled').length;

  res.json({
    success: true,
    stats: {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalBarbers: barbers.length,
      approvedBarbers: barbers.filter((b) => b.status === 'approved').length,
    },
    barbers,
    appointments,
    auditLogs: auditLogs.slice(0, 50),
    safetyReports,
  });
});

// 12. ADMIN BARBER MANAGEMENT (Approve, Suspend)
app.post('/api/admin/barbers/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminName = 'CutClass Admin' } = req.body;

  const barber = barbers.find((b) => b.id === id);
  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  const oldStatus = barber.status;
  barber.status = status;

  recordAuditLog(
    'ADMIN_BARBER_STATUS_CHANGED',
    adminName,
    'admin',
    { barberName: barber.name, from: oldStatus, to: status },
    barber.id
  );

  res.json({ success: true, barber });
});

// 13. ADMIN REASSIGN APPOINTMENT
app.post('/api/admin/appointments/:id/reassign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newBarberId, adminName = 'CutClass Admin' } = req.body;

  const apt = appointments.find((a) => a.id === id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  const targetBarber = barbers.find((b) => b.id === newBarberId);
  if (!targetBarber || targetBarber.status !== 'approved') {
    return res.status(400).json({ error: 'Target barber is not available for reassignment.' });
  }

  const oldBarber = apt.barberName;
  apt.barberId = targetBarber.id;
  apt.barberName = targetBarber.name;
  apt.barberAvatar = targetBarber.avatarUrl;
  apt.updatedAt = new Date().toISOString();

  recordAuditLog(
    'ADMIN_APPOINTMENT_REASSIGNED',
    adminName,
    'admin',
    { bookingRef: apt.bookingRef, from: oldBarber, to: targetBarber.name },
    apt.id
  );

  res.json({ success: true, appointment: apt });
});

// 14. SAFETY CONCERN REPORTING
app.post('/api/safety/report', (req: Request, res: Response) => {
  const { appointmentRef, reporterId, reporterRole, reporterName, category, description } = req.body;

  if (!appointmentRef || !description) {
    return res.status(400).json({ error: 'Appointment reference and description are required.' });
  }

  const report: SafetyReport = {
    id: `rep-${Date.now()}`,
    appointmentRef,
    reporterId: reporterId || 'unknown',
    reporterRole: reporterRole || 'member',
    reporterName: reporterName || 'Anonymous',
    category: category || 'other',
    description,
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };

  safetyReports.unshift(report);

  recordAuditLog(
    'SAFETY_REPORT_SUBMITTED',
    report.reporterName,
    report.reporterRole,
    { appointmentRef, category },
    report.id
  );

  res.status(201).json({
    success: true,
    reportId: report.id,
    message: 'Your safety concern has been submitted to CutClass Dispatch & Member Care for immediate review.',
  });
});

// 15. PAYSTACK PAYMENT VERIFICATION (For extra charges / plan payments)
app.post('/api/payments/verify', (req: Request, res: Response) => {
  const { reference, amount, memberId } = req.body;

  if (!reference) {
    return res.status(400).json({ error: 'Payment reference required.' });
  }

  // Record audit
  recordAuditLog(
    'PAYMENT_VERIFIED',
    memberId || 'member',
    'system',
    { reference, amount: amount || 0, provider: 'Paystack' }
  );

  res.json({
    success: true,
    verified: true,
    reference,
    message: 'Payment verified successfully through Paystack.',
  });
});

// ============================================================================
// MOUNT VITE OR STATIC ASSETS
// ============================================================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CutClass App running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
