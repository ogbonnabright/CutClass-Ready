import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbService } from './server/db';
import { authMiddleware, requireAuth, requireRole, AuthenticatedRequest } from './server/authMiddleware';
import { paystackService } from './server/paystack';
import { getFirebaseDiagnostics } from './server/firebaseAdmin';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Parse JSON and preserve raw body for webhook signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(authMiddleware as any);

export function getServerPort(): number {
  // 1. Check CLI arguments (e.g. npm run dev --port 3000)
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = Number(process.argv[portArgIndex + 1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // 2. In development (AI Studio preview runner), dev server runs on port 3000
  if (process.env.NODE_ENV !== 'production' && !process.env.K_SERVICE) {
    return 3000;
  }
  // 3. In production container (Cloud Run), listen on process.env.PORT or default 3000
  return Number(process.env.PORT) || 3000;
}

export function getServerHost(): string {
  const hostArgIndex = process.argv.indexOf('--host');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    return process.argv[hostArgIndex + 1];
  }
  return process.env.HOST || '0.0.0.0';
}

// ============================================================================
// 1. HEALTH & SYSTEM STATUS
// ============================================================================
app.get('/api/health', (_req: Request, res: Response) => {
  const firebaseDiag = getFirebaseDiagnostics();
  const isHealthy = firebaseDiag.isInitialized && (firebaseDiag.hasFirestore || process.env.NODE_ENV !== 'production');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'CutClass Production Booking Engine',
    timestamp: new Date().toISOString(),
    port: getServerPort(),
    environment: process.env.NODE_ENV || 'development',
    firebase: {
      status: firebaseDiag.isInitialized ? 'connected' : 'error',
      credentialMode: firebaseDiag.credentialStatus,
      diagnostics: firebaseDiag.diagnosticMessage,
    },
    paystackConfigured: paystackService.isConfigured(),
  });
});

// ============================================================================
// 2. SERVICES & BARBERS (Public / Semi-public)
// ============================================================================
app.get('/api/services', async (_req: Request, res: Response) => {
  try {
    const services = await dbService.getServices();
    res.json({ success: true, services });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch services.' });
  }
});

app.get('/api/barbers', async (req: Request, res: Response) => {
  try {
    const district = req.query.district as string | undefined;
    const barbers = await dbService.getBarbers(district);
    res.json({ success: true, barbers });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch barbers.' });
  }
});

app.get('/api/barbers/available-slots', async (req: Request, res: Response) => {
  const { barberId, date, durationMinutes } = req.query;

  if (!barberId || !date) {
    return res.status(400).json({ error: 'Missing barberId or date parameter.' });
  }

  const duration = parseInt((durationMinutes as string) || '45', 10);
  const barber = await dbService.getBarber(barberId as string);

  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  if (barber.status !== 'approved' || !barber.isAvailable) {
    return res.json({ success: true, slots: [], message: 'Barber is currently unavailable.' });
  }

  // Query appointments for this barber on this date from persistent store
  const allApts = await dbService.getAppointmentsForBarber(barberId as string);
  const bookedForBarber = allApts.filter(
    (apt) => apt.date === date && apt.status !== 'cancelled' && apt.status !== 'missed'
  );

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

    // Must finish within barber working day (18:00 = 1080 min)
    if (slotEndMin > 18 * 60) return false;

    // 2-hour minimum lead time for today's visits
    if (isToday) {
      const currentMin = now.getHours() * 60 + now.getMinutes();
      if (slotStartMin < currentMin + 120) return false;
    }

    // 30-min travel/sanitation buffer between home appointments
    const travelBufferMin = 30;
    const hasConflict = bookedForBarber.some((apt) => {
      const [aptH, aptM] = apt.time.split(':').map(Number);
      const aptStart = aptH * 60 + aptM;
      const aptEnd = aptStart + apt.serviceDurationMinutes;
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

// ============================================================================
// 3. BOOKINGS — PROTECTED BY ATOMIC RESERVATIONS & FIRESTORE TRANSACTIONS
// ============================================================================
app.post('/api/bookings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
    extraCharge = 0,
    paymentReference,
  } = req.body;

  // Authorization check: User must book for themselves unless they are admin
  if (req.user?.role !== 'admin' && req.user?.uid !== memberId) {
    return res.status(403).json({
      error: 'Forbidden: You cannot create bookings on behalf of other members.',
    });
  }

  // Required parameters check
  if (!memberId || !barberId || !serviceId || !date || !time || !address || !district) {
    return res.status(400).json({ error: 'Missing required booking information.' });
  }

  try {
    // Atomic reservation & credit deduction via Firestore transaction
    const result = await dbService.createAtomicBooking({
      memberId,
      memberName: memberName || req.user?.name || 'CutClass Member',
      memberEmail: memberEmail || req.user?.email || '',
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
      extraCharge,
      paymentReference,
    });

    await dbService.recordAuditLog({
      action: 'BOOKING_CREATED_ATOMIC',
      performedBy: req.user?.email || memberId,
      performedByRole: req.user?.role || 'member',
      targetId: result.appointment.id,
      details: {
        bookingRef: result.bookingRef,
        barberId,
        serviceId,
        date,
        time,
        updatedCredits: result.updatedCredits,
      },
    });

    res.status(201).json({
      success: true,
      appointment: result.appointment,
      updatedCredits: result.updatedCredits,
      bookingRef: result.bookingRef,
    });
  } catch (err: any) {
    const status =
      err.message?.includes('already been reserved')
        ? 409
        : err.message?.includes('Insufficient haircut') || err.message?.includes('Active CutClass')
        ? 403
        : 400;

    res.status(status).json({ error: err.message || 'Failed to complete appointment booking.' });
  }
});

// Appointment Cancellation with 12-Hour Credit Restoration Rule
app.post('/api/bookings/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason = 'Member cancelled via portal' } = req.body;

  try {
    const result = await dbService.cancelAppointment(
      id,
      req.user!.uid,
      req.user!.role,
      reason
    );

    await dbService.recordAuditLog({
      action: 'APPOINTMENT_CANCELLED',
      performedBy: req.user!.email || req.user!.uid,
      performedByRole: req.user!.role,
      targetId: id,
      details: {
        bookingRef: result.appointment.bookingRef,
        creditRestored: result.creditRestored,
        reason,
      },
    });

    res.json({
      success: true,
      appointment: result.appointment,
      creditRestored: result.creditRestored,
      message: result.message,
    });
  } catch (err: any) {
    const status = err.message?.includes('Forbidden') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// Appointment Rescheduling
app.post('/api/bookings/:id/reschedule', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newDate, newTime } = req.body;

  if (!newDate || !newTime) {
    return res.status(400).json({ error: 'Missing new date or time.' });
  }

  try {
    const updated = await dbService.rescheduleAppointment(
      id,
      newDate,
      newTime,
      req.user!.uid,
      req.user!.role
    );

    await dbService.recordAuditLog({
      action: 'APPOINTMENT_RESCHEDULED',
      performedBy: req.user!.email || req.user!.uid,
      performedByRole: req.user!.role,
      targetId: id,
      details: {
        bookingRef: updated.bookingRef,
        newDate,
        newTime,
      },
    });

    res.json({
      success: true,
      appointment: updated,
      message: `Appointment successfully rescheduled to ${newDate} at ${newTime}.`,
    });
  } catch (err: any) {
    const status = err.message?.includes('unavailable') ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ============================================================================
// 4. MEMBER DASHBOARD DATA (Protected)
// ============================================================================
app.get('/api/member/dashboard-data', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const requestedMemberId = (req.query.memberId as string) || req.user!.uid;

  // Enforce member isolation
  if (req.user!.role !== 'admin' && req.user!.uid !== requestedMemberId) {
    return res.status(403).json({
      error: 'Forbidden: You can only view your own member dashboard.',
    });
  }

  try {
    const memberAppointments = await dbService.getAppointmentsForMember(requestedMemberId);
    const transactions = await dbService.getTransactionsForMember(requestedMemberId);

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
      transactions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. BARBER DASHBOARD DATA & STATUS TRANSITIONS (Protected by Barber Role)
// ============================================================================
app.get(
  '/api/barber/dashboard-data',
  requireAuth,
  requireRole('barber', 'admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const barberId = (req.query.barberId as string) || 'barber-tunde';

    try {
      const barber = await dbService.getBarber(barberId);
      if (!barber) return res.status(404).json({ error: 'Barber not found.' });

      const assigned = await dbService.getAppointmentsForBarber(barber.id);
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  '/api/barber/appointments/:id/status',
  requireAuth,
  requireRole('barber', 'admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['confirmed', 'in_progress', 'completed', 'missed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status transition.' });
    }

    try {
      const apt = await dbService.getAppointment(id);
      if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

      apt.status = status;
      if (notes) apt.notes = notes;
      apt.updatedAt = new Date().toISOString();

      await dbService.recordAuditLog({
        action: 'BARBER_APPOINTMENT_STATUS_TRANSITION',
        performedBy: req.user!.email || req.user!.uid,
        performedByRole: req.user!.role,
        targetId: id,
        details: { bookingRef: apt.bookingRef, status, notes },
      });

      res.json({ success: true, appointment: apt });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  '/api/barber/availability',
  requireAuth,
  requireRole('barber', 'admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { barberId, isAvailable } = req.body;

    try {
      const updated = await dbService.updateBarber(barberId, { isAvailable: Boolean(isAvailable) });
      res.json({ success: true, barber: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================================================
// 6. ADMIN DASHBOARD & MANAGEMENT (Protected by Admin Role)
// ============================================================================
app.get(
  '/api/admin/dashboard-data',
  requireAuth,
  requireRole('admin'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const barbers = await dbService.getBarbers();
      const appointments = await dbService.getAllAppointments();
      const auditLogs = await dbService.getAuditLogs();
      const safetyReports = await dbService.getSafetyReports();

      const totalBookings = appointments.length;
      const activeBookings = appointments.filter((a) => a.status === 'confirmed').length;
      const completedBookings = appointments.filter((a) => a.status === 'completed').length;
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
        auditLogs,
        safetyReports,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  '/api/admin/barbers/:id/status',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const updated = await dbService.updateBarber(id, { status });
      await dbService.recordAuditLog({
        action: 'ADMIN_BARBER_STATUS_UPDATE',
        performedBy: req.user!.email || 'Admin',
        performedByRole: 'admin',
        targetId: id,
        details: { status },
      });
      res.json({ success: true, barber: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  '/api/admin/appointments/:id/reassign',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { newBarberId } = req.body;

    try {
      const apt = await dbService.getAppointment(id);
      if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

      const targetBarber = await dbService.getBarber(newBarberId);
      if (!targetBarber || targetBarber.status !== 'approved') {
        return res.status(400).json({ error: 'Target barber is not available.' });
      }

      apt.barberId = targetBarber.id;
      apt.barberName = targetBarber.name;
      apt.barberAvatar = targetBarber.avatarUrl;
      apt.updatedAt = new Date().toISOString();

      await dbService.recordAuditLog({
        action: 'ADMIN_APPOINTMENT_REASSIGNED',
        performedBy: req.user!.email || 'Admin',
        performedByRole: 'admin',
        targetId: id,
        details: { bookingRef: apt.bookingRef, targetBarberName: targetBarber.name },
      });

      res.json({ success: true, appointment: apt });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================================================
// 7. PAYSTACK RECURRING PAYMENTS & VERIFICATION (Server-side)
// ============================================================================
app.post('/api/payments/paystack/initialize', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { planId, email, callbackUrl } = req.body;

  const planPricing: Record<string, number> = {
    starter: 15000,
    regular: 28000,
    executive: 35000,
    family: 48000,
  };

  const amountNaira = planPricing[planId];
  if (!amountNaira) {
    return res.status(400).json({ error: 'Invalid subscription plan specified.' });
  }

  const amountKobo = amountNaira * 100;

  try {
    const data = await paystackService.initializeTransaction({
      email: email || req.user!.email,
      amountKobo,
      planId,
      memberId: req.user!.uid,
      callbackUrl,
    });

    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment initialization failed.' });
  }
});

app.post('/api/payments/paystack/verify/:reference', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { reference } = req.params;

  try {
    const verification = await paystackService.verifyTransaction(reference);

    if (!verification.verified) {
      return res.status(400).json({
        error: 'Paystack payment could not be verified or was unsuccessful.',
        status: verification.status,
      });
    }

    const planId = verification.planId || 'regular';
    await dbService.recordVerifiedPaymentAndActivateSubscription(
      reference,
      req.user!.uid,
      planId,
      verification.amount,
      verification.channel
    );

    await dbService.recordAuditLog({
      action: 'PAYSTACK_PAYMENT_VERIFIED',
      performedBy: req.user!.email || req.user!.uid,
      performedByRole: req.user!.role,
      targetId: reference,
      details: {
        amount: verification.amount,
        currency: verification.currency,
        planId,
      },
    });

    res.json({
      success: true,
      verified: true,
      planId,
      amount: verification.amount,
      message: 'Payment verified successfully. Your CutClass subscription and haircut credits are now active!',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Paystack Webhook Handler (Idempotent)
app.post('/api/payments/paystack/webhook', async (req: any, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const isValid = paystackService.verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature);

  if (!isValid) {
    return res.status(401).send('Invalid Paystack signature');
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const { reference, amount, customer, metadata, channel } = event.data;
    const memberId = metadata?.memberId;
    const planId = metadata?.planId || 'regular';

    if (memberId && reference) {
      await dbService.recordVerifiedPaymentAndActivateSubscription(
        reference,
        memberId,
        planId,
        amount / 100,
        channel || 'card'
      );
    }
  }

  res.sendStatus(200);
});

// ============================================================================
// 8. SAFETY & CONCERNS
// ============================================================================
app.post('/api/safety/report', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { appointmentRef, category, description } = req.body;

  if (!appointmentRef || !description) {
    return res.status(400).json({ error: 'Missing appointment reference or description.' });
  }

  try {
    const report = await dbService.createSafetyReport({
      appointmentRef,
      reporterId: req.user!.uid,
      reporterRole: req.user!.role,
      reporterName: req.user!.name || req.user!.email,
      category,
      description,
    });

    await dbService.recordAuditLog({
      action: 'SAFETY_REPORT_FILED',
      performedBy: req.user!.email || req.user!.uid,
      performedByRole: req.user!.role,
      targetId: report.id,
      details: { appointmentRef, category },
    });

    res.status(201).json({
      success: true,
      reportId: report.id,
      message: 'Your concern has been submitted to CutClass Member Care for priority review.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 9. CLIENT APPLICATION SERVING & CLOUD RUN ENTRY
// ============================================================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = getServerPort();
  const HOST = getServerHost();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      console.warn(
        `[CutClass Production Server] Warning: Frontend build directory not found at "${distPath}". Ensure "npm run build" has completed.`
      );
    }
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('CutClass API Server is online. Frontend client build not found.');
      }
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`CutClass Server listening on ${HOST}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    const diag = getFirebaseDiagnostics();
    console.log(`[Diagnostic] Firebase Admin: ${diag.credentialStatus} - ${diag.diagnosticMessage}`);
    console.log(`[Diagnostic] Paystack: ${paystackService.isConfigured() ? 'Configured' : 'Sandbox/Test Mode'}`);
  });

  return server;
}

startServer().catch((err) => {
  console.error('Server boot failed:', err);
});
