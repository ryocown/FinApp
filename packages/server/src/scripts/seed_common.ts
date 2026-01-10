import { db } from '../firebase.js';
import { SUPPORTED_INSTITUTES, KNOWN_MERCHANTS } from '@finapp/shared';
import { logger } from '../logger.js';

const seedCommonData = async () => {
    logger.info('Starting common data seeeding...');

    const batch = db.batch();

    // Seed Institutes
    let instituteCount = 0;
    for (const inst of SUPPORTED_INSTITUTES) {
        const ref = db.collection('common_institutes').doc(inst.instituteId);
        batch.set(ref, inst, { merge: true });
        instituteCount++;
    }

    // Seed Merchants
    // Note: Regex cannot be stored directly. Storing as string pattern + flags.
    let merchantCount = 0;
    for (const merch of KNOWN_MERCHANTS) {
        const slug = merch.commonName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const ref = db.collection('common_merchants').doc(slug);

        const merchData = {
            ...merch,
            matcher: {
                source: merch.matcher.source,
                flags: merch.matcher.flags
            }
        };

        batch.set(ref, merchData, { merge: true });
        merchantCount++;
    }

    await batch.commit();
    logger.info(`Seeding complete. Seeded ${instituteCount} institutes and ${merchantCount} merchants.`);
};

// Auto-run if executed directly
// Check if this module is the main module (Node esm check is tricky, relying on explicit call usually better)
// But for now, just export it.
export { seedCommonData };
