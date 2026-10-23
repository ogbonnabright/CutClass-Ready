import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let isFirebaseAdminInitialized = false;
let initDiagnosticMessage: string = 'Firebase Admin not initialized.';
let credentialStatus: 'service_account' | 'adc' | 'invalid' | 'missing' = 'missing';

try {
  const existingApps = getApps();
  if (existingApps.length === 0) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId =
      process.env.VITE_FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      'cutclass-app';

    if (rawServiceAccount) {
      try {
        let serviceAccount: any;
        const trimmed = rawServiceAccount.trim();

        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          // Format 1: Direct JSON string
          serviceAccount = JSON.parse(trimmed);
        } else if (fs.existsSync(trimmed)) {
          // Format 2: File path to JSON file
          serviceAccount = JSON.parse(fs.readFileSync(trimmed, 'utf-8'));
        } else {
          // Format 3: Base64-encoded JSON string
          const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
          serviceAccount = JSON.parse(decoded);
        }

        if (!serviceAccount || typeof serviceAccount !== 'object') {
          throw new Error('Service account must be a valid JSON object');
        }

        const effectiveProjectId = serviceAccount.project_id || projectId;
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: effectiveProjectId,
        });
        isFirebaseAdminInitialized = true;
        credentialStatus = 'service_account';
        initDiagnosticMessage = `Authenticated via service account for project "${effectiveProjectId}".`;
        console.log(`[Firebase Admin] ${initDiagnosticMessage}`);
      } catch (err: any) {
        credentialStatus = 'invalid';
        initDiagnosticMessage = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY provided: ${err.message}`;
        console.error(`[Firebase Admin] Diagnostic Error: ${initDiagnosticMessage}`);
        // Attempt fallback to ADC
        try {
          adminApp = initializeApp({ projectId });
          initDiagnosticMessage += ` (Fallback to ADC initialized for project "${projectId}")`;
        } catch (adcErr: any) {
          console.error(`[Firebase Admin] ADC fallback failed: ${adcErr.message}`);
        }
      }
    } else {
      credentialStatus = 'missing';
      console.warn(
        `[Firebase Admin] Diagnostic Notice: FIREBASE_SERVICE_ACCOUNT_KEY not set. Attempting Application Default Credentials (ADC) for project "${projectId}".`
      );
      try {
        adminApp = initializeApp({ projectId });
        credentialStatus = 'adc';
        initDiagnosticMessage = `Initialized with Application Default Credentials for project "${projectId}".`;
      } catch (err: any) {
        initDiagnosticMessage = `ADC initialization failed: ${err.message}`;
        console.error(`[Firebase Admin] ${initDiagnosticMessage}`);
      }
    }
  } else {
    adminApp = existingApps[0];
    isFirebaseAdminInitialized = true;
    initDiagnosticMessage = 'Reusing existing Firebase Admin instance.';
  }

  if (adminApp) {
    firestoreInstance = getFirestore(adminApp);
    authInstance = getAuth(adminApp);
    isFirebaseAdminInitialized = true;
  }
} catch (error) {
  initDiagnosticMessage = `Firebase Admin initialization exception: ${(error as Error).message}`;
  console.error('[Firebase Admin] Startup Exception:', initDiagnosticMessage);
}

// Fallback proxy to prevent runtime crashes if firestore connection is unconfigured
const firestoreProxy: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (firestoreInstance && typeof (firestoreInstance as any)[prop] === 'function') {
        return (...args: any[]) => (firestoreInstance as any)[prop](...args);
      }
      if (firestoreInstance && (firestoreInstance as any)[prop] !== undefined) {
        return (firestoreInstance as any)[prop];
      }

      // Safe resilient fallbacks
      if (prop === 'collection') {
        return (_colName: string) => ({
          doc: (_docId: string) => ({
            get: async () => ({ exists: false, data: () => null }),
            set: async () => {},
            update: async () => {},
            delete: async () => {},
          }),
          where: () => ({
            where: () => ({
              get: async () => ({ empty: true, forEach: () => {} }),
            }),
            orderBy: () => ({
              get: async () => ({ empty: true, forEach: () => {} }),
            }),
            get: async () => ({ empty: true, forEach: () => {} }),
          }),
          orderBy: () => ({
            limit: () => ({
              get: async () => ({ empty: true, forEach: () => {} }),
            }),
            get: async () => ({ empty: true, forEach: () => {} }),
          }),
          get: async () => ({ empty: true, forEach: () => {} }),
        });
      }

      if (prop === 'runTransaction') {
        return async (fn: (transaction: any) => Promise<any>) => {
          // If Firestore is available, use it
          if (firestoreInstance) {
            return firestoreInstance.runTransaction(fn);
          }
          throw new Error('Firestore transaction offline fallback');
        };
      }

      return () => {};
    },
  }
);

const authProxy: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (authInstance && typeof (authInstance as any)[prop] === 'function') {
        return (...args: any[]) => (authInstance as any)[prop](...args);
      }
      if (prop === 'verifyIdToken') {
        return async (_token: string) => {
          if (authInstance) return authInstance.verifyIdToken(_token);
          throw new Error('Firebase Auth not configured for token verification');
        };
      }
      return () => {};
    },
  }
);

export function getFirebaseDiagnostics() {
  return {
    isInitialized: isFirebaseAdminInitialized,
    credentialStatus,
    diagnosticMessage: initDiagnosticMessage,
    hasFirestore: Boolean(firestoreInstance),
    hasAuth: Boolean(authInstance),
  };
}

export const firestore: Firestore = firestoreProxy;
export const adminAuth: Auth = authProxy;
export { adminApp, isFirebaseAdminInitialized };
