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

        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
        isFirebaseAdminInitialized = true;
      } catch (err: any) {
        console.warn('[Firebase Admin] Invalid service account credential provided:', err.message);
        adminApp = initializeApp({ projectId });
        isFirebaseAdminInitialized = true;
      }
    } else {
      adminApp = initializeApp({ projectId });
      isFirebaseAdminInitialized = true;
    }
  } else {
    adminApp = existingApps[0];
    isFirebaseAdminInitialized = true;
  }

  if (adminApp) {
    firestoreInstance = getFirestore(adminApp);
    authInstance = getAuth(adminApp);
  }
} catch (error) {
  console.warn('[Firebase Admin] Running in resilient mode:', (error as Error).message);
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

export const firestore: Firestore = firestoreProxy;
export const adminAuth: Auth = authProxy;
export { adminApp, isFirebaseAdminInitialized };
