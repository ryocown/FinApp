
import { type Request, type Response, type NextFunction } from 'express';
import { auth } from '../firebase.js';
import { logger } from '../logger.js';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string | undefined;
    };
}

export const checkAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    } catch (error) {
        logger.error('Error verifying auth token:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
