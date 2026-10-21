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
import { User, UserSubscription, UserRole } from '../types';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

interface SignUpData {
  name: string;
  email: string;
  password: string;
  subscription?: UserSubscription;
  haircutCredits?: number;
}

interface AuthContextType {
  user: User | null;
  isPending: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (data: SignUpData) => Promise<{ error?: { message: string }; user?: User }>;
  signOut: () => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<{ error?: { message: string } }>;
  verifyUserEmail: () => Promise<void>;
  updateSubscription: (subscription: UserSubscription) => Promise<void>;
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
  if (!db) throw new Error('Firebase is not configured.');
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.exists() ? snapshot.data() : {};
  const name = firebaseUser.displayName || existing.name || firebaseUser.email?.split('@')[0] || 'CutClass member';
  const createdAt = existing.createdAt?.toDate?.()?.toISOString?.() ||
    (typeof existing.createdAt === 'string' ? existing.createdAt : new Date().toISOString());

  return {
    id: firebaseUser.uid,
    name,
    email: firebaseUser.email || '',
    emailVerified: firebaseUser.emailVerified,
    createdAt,
    role: (existing.role as UserRole) || 'member',
    haircutCredits: existing.haircutCredits ?? 0,
    subscription: existing.subscription ?? null,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState<boolean>(true);

  useEffect(() => {
    if (!auth || !db) {
      // Check localStorage for offline / preview testing session if Firebase is unconfigured
      const localSession = localStorage.getItem('cutclass_local_user');
      if (localSession) {
        try {
          setUser(JSON.parse(localSession));
        } catch {
          // ignore error
        }
      }
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
          name: firebaseUser.displayName || 'CutClass member',
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(),
          role: 'member',
          haircutCredits: 0,
          subscription: null,
        });
      } finally {
        setIsPending(false);
      }
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      // Mock sign in if unconfigured
      const localSession = localStorage.getItem('cutclass_local_user');
      if (localSession) {
        const parsed = JSON.parse(localSession);
        if (parsed.email.toLowerCase() === email.trim().toLowerCase()) {
          setUser(parsed);
          return {};
        }
      }
      return { error: { message: 'Firebase is not configured yet. Follow the setup guide to enable production authentication.' } };
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return {};
    } catch (error) {
      return { error: { message: friendlyError(error) } };
    }
  };

  const signUp = async ({ name, email, password, subscription, haircutCredits }: SignUpData) => {
    if (!name.trim()) return { error: { message: 'Enter your full name.' } };
    if (!email.trim() || !email.includes('@')) return { error: { message: 'Enter a valid email address.' } };
    if (password.length < 6) return { error: { message: 'Password should be at least 6 characters long.' } };

    const creditsCount = haircutCredits !== undefined ? haircutCredits : (subscription ? subscription.credits : 0);

    // If Firebase is configured, execute real Firebase Auth & Firestore write
    if (isFirebaseConfigured && auth && db) {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        
        const initialDoc: Record<string, unknown> = {
          uid: credential.user.uid,
          name: name.trim(),
          email: credential.user.email,
          emailVerified: credential.user.emailVerified,
          haircutCredits: creditsCount,
          subscription: subscription || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', credential.user.uid), initialDoc);

        try {
          await sendEmailVerification(credential.user);
        } catch (err) {
          console.warn('Email verification send issue:', err);
        }

        const newUser: User = {
          id: credential.user.uid,
          name: name.trim(),
          email: credential.user.email || email.trim(),
          role: 'member',
          emailVerified: credential.user.emailVerified,
          createdAt: new Date().toISOString(),
          haircutCredits: creditsCount,
          subscription: subscription || null,
        };
        setUser(newUser);
        return { user: newUser };
      } catch (error) {
        return { error: { message: friendlyError(error) } };
      }
    }

    // Fallback in-memory/localStorage session for preview environment
    const mockUser: User = {
      id: 'member_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: email.trim(),
      role: 'member',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      haircutCredits: creditsCount,
      subscription: subscription || null,
    };
    setUser(mockUser);
    localStorage.setItem('cutclass_local_user', JSON.stringify(mockUser));
    return { user: mockUser };
  };

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem('cutclass_local_user');
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

  const updateSubscription = async (newSub: UserSubscription) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      haircutCredits: (user.haircutCredits || 0) + newSub.credits,
      subscription: newSub,
    };
    setUser(updatedUser);

    if (isFirebaseConfigured && db && auth?.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        subscription: newSub,
        haircutCredits: updatedUser.haircutCredits,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      localStorage.setItem('cutclass_local_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isPending,
        signIn,
        signUp,
        signOut,
        sendVerificationEmail,
        verifyUserEmail,
        updateSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
