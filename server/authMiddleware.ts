import { Request, Response, NextFunction } from 'express';
import { adminAuth } from './firebaseAdmin';
import { dbService } from './db';
import { User, UserRole } from '../src/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
    name?: string;
    profile?: User;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return next();

  // 1. Check for development / testing tokens
  if (token.startsWith('test-token-')) {
    const rawId = token.replace('test-token-', '');
    let role: UserRole = 'member';
    if (rawId.includes('admin')) role = 'admin';
    else if (rawId.includes('barber')) role = 'barber';

    const existingUser = await dbService.getUser(rawId);

    req.user = {
      uid: rawId,
      email: existingUser?.email || `${rawId}@cutclass.test`,
      role: existingUser?.role || role,
      name: existingUser?.name || 'Test User',
      profile: existingUser || undefined,
    };
    return next();
  }

  // 2. Real Firebase ID token verification
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await dbService.getUser(decodedToken.uid);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: (userDoc?.role as UserRole) || (decodedToken.role as UserRole) || 'member',
      name: decodedToken.name || userDoc?.name,
      profile: userDoc || undefined,
    };
  } catch (error) {
    console.warn('[Auth Middleware] Invalid Firebase ID token:', (error as Error).message);
  }

  next();
}

// Guard: Must be authenticated
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required. Provide a valid Bearer token.',
    });
  }
  next();
}

// Guard: Enforce specific roles (e.g. 'admin' or 'barber')
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role is: ${req.user.role}`,
      });
    }
    next();
  };
}
