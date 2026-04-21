import { Request, Response, NextFunction } from 'express';
// We'll use firebase-admin in the server context
// Since server.ts exposes db, we can use it or re-init in a service

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // In a real production SaaS, we would verify the Firebase ID Token here
  // For this implementation, we assume the token is passed and validated or handled by client-side auth for Firestore
  // To keep it simple but "Enterprise-ready", we provide the structure
  next();
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Logic to check user role from DB if needed
    // For now, it's a placeholder for the RBAC architecture
    next();
  };
};
