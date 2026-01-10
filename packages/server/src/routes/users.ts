import { Router, type Request, type Response } from 'express';
import { db, getUserRef } from '../firebase.js';
import { logger } from '../logger.js';
import { ApiError } from '../errors/index.js';
import { checkAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register/Sync a user
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { userId, email, displayName, photoURL } = req.body;

        if (!userId || !email) {
            throw ApiError.badRequest('Missing required fields: userId, email');
        }

        const userRef = getUserRef(userId);
        const userDoc = await userRef.get();
        let userData = userDoc.data();
        let isNewUser = false;

        if (!userDoc.exists) {
            isNewUser = true;
            logger.info(`Creating new user document for ${userId}`);

            userData = {
                email,
                displayName: displayName || '',
                photoURL: photoURL || '',
                createdAt: new Date().toISOString(),
                settings: {
                    currency: 'USD',
                    theme: 'dark'
                }
            };

            await userRef.set(userData);
        } else {
            // Optionally update fields like lastLogin, photoURL, displayName if they changed
            const updates: any = {
                lastLogin: new Date().toISOString()
            };
            if (displayName) updates.displayName = displayName;
            if (photoURL) updates.photoURL = photoURL;

            await userRef.update(updates);
            // Merge updates into userData for response
            userData = { ...userData, ...updates };
        }

        // Check if user has any accounts (institutes)
        const institutesSnap = await userRef.collection('institutes').limit(1).get();
        const hasAccounts = !institutesSnap.empty;

        res.status(isNewUser ? 201 : 200).json({
            message: isNewUser ? 'User created' : 'User synced',
            isNewUser,
            hasAccounts,
            user: userData
        });

    } catch (error) {
        logger.error('Error registering user:', error);
        // Explicitly pass error details for debugging (as per recent changes)
        res.status(500).json({
            error: 'Failed to register users',
            details: (error as Error).message,
            stack: (error as Error).stack
        });
    }
});

// Update user profile
router.put('/:userId', checkAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { displayName, photoURL, settings } = req.body;

        if (!userId) {
            res.status(400).json({ error: 'Missing userId' });
            return;
        }

        if (req.user!.uid !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const userRef = getUserRef(userId);
        const updates: any = {};

        if (displayName !== undefined) updates.displayName = displayName;
        if (photoURL !== undefined) updates.photoURL = photoURL;
        if (settings !== undefined) updates.settings = settings;

        if (Object.keys(updates).length > 0) {
            await userRef.update(updates);
        }

        const updatedDoc = await userRef.get();
        res.json(updatedDoc.data());

    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
