import admin from 'firebase-admin';

if (!admin.apps.length) {
  // Check if we are running in the emulator environment
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('Connecting to Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST);
    admin.initializeApp({
      projectId: 'default', // Match client and population script
    });
  } else {
    // Fallback to default credentials for production/other environments
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth: admin.auth.Auth = admin.auth();
