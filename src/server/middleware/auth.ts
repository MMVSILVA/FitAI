import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  uid?: string;
  userEmail?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
