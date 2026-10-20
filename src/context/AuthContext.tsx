import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  reload,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { User } from '../types';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isPending: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (data: { name: string; email: string; password: string }) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<{ error?: { message: string } }>;
  verifyUserEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function friendlyError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists. Try signing in.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/weak-password': return 'Choose a stronger password with at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Could not sign in. Check your email and password.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a little and try again.';
    case 'auth/network-request-failed': return 'Network error. Check your internet connection and try again.';
    case 'permission-denied': return 'Firebase rejected this database request. Check your Firestore security rules.';
    default: return (error as { message?: string })?.message || 'Something went wrong. Please try again.';
  }
}

async function profileFor(firebaseUser: FirebaseUser): Promise<User> {
  if (!db) throw new Error('Firebase is not configured. Add your Firebase web app settings to the .env file.');
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.exists() ? snapshot.data() : {};
  const name = firebaseUser.displayName || existing.name || firebaseUser.email?.split('@')[0] || 'CutClass user';
  const createdAt = existing.createdAt?.toDate?.()?.toISOString?.() ||
    (typeof existing.createdAt === 'string' ? existing.createdAt : new Date().toISOString());

  await setDoc(userRef, {
    uid: firebaseUser.uid,
    name,
    email: firebaseUser.email || '',
    emailVerified: firebaseUser.emailVerified,
    createdAt: existing.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return {
    id: firebaseUser.uid,
    name,
    email: firebaseUser.email || '',
    emailVerified: firebaseUser.emailVerified,
    createdAt,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState<boolean>(true);

  useEffect(() => {
    if (!auth || !db) {
      setIsPending(false);
      return;
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsPending(false);
        return;
      }
      try {
        setUser(await profileFor(firebaseUser));
      } catch (error) {
        console.error('Could not load CutClass account profile:', error);
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'CutClass user',
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(),
        });
      } finally {
        setIsPending(false);
      }
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) return { error: { message: 'Firebase is not configured yet. Follow the setup guide included with this project.' } };
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return {};
    } catch (error) {
      return { error: { message: friendlyError(error) } };
    }
  };

  const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    if (!isFirebaseConfigured || !auth || !db) return { error: { message: 'Firebase is not configured yet. Add your Firebase web app settings before creating accounts.' } };
    if (!name.trim()) return { error: { message: 'Enter your full name.' } };
    if (password.length < 6) return { error: { message: 'Password should be at least 6 characters long.' } };
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        name: name.trim(),
        email: credential.user.email,
        emailVerified: credential.user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await sendEmailVerification(credential.user);
      return {};
    } catch (error) {
      return { error: { message: friendlyError(error) } };
    }
  };

  const signOut = async () => {
    if (auth) await firebaseSignOut(auth);
    setUser(null);
  };

  const sendVerificationEmail = async (_email: string) => {
    if (!auth?.currentUser) return { error: { message: 'Sign in to request a verification email.' } };
    try {
      await sendEmailVerification(auth.currentUser);
      return {};
    } catch (error) {
      return { error: { message: friendlyError(error) } };
    }
  };

  const verifyUserEmail = async () => {
    if (!auth?.currentUser) return;
    await reload(auth.currentUser);
    const refreshedUser = auth.currentUser;
    if (refreshedUser && db) {
      await setDoc(doc(db, 'users', refreshedUser.uid), {
        emailVerified: refreshedUser.emailVerified,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setUser(await profileFor(refreshedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isPending, signIn, signUp, signOut, sendVerificationEmail, verifyUserEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
