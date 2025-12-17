# Remote Firebase Connection Setup

## Overview
The FinApp server and scripts can connect to a remote Firebase project instead of the local emulator. This is useful for production environments or when the emulator is not running.

## Configuration
The connection logic is handled in `packages/server/src/firebase.ts` and mirrored in utility scripts.

### Logic
1.  **Check `FIRESTORE_EMULATOR_HOST`**: If this environment variable is set, the application attempts to connect to the emulator.
2.  **Fallback to ADC**: If `FIRESTORE_EMULATOR_HOST` is NOT set, the application uses **Application Default Credentials (ADC)** to connect to the remote project specified by `FIREBASE_PROJECT_ID` (or the default project in the ADC configuration).

### Code Pattern
```typescript
import admin from 'firebase-admin';

if (!admin.apps.length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Connect to Emulator
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // Connect to Remote (ADC)
    admin.initializeApp();
  }
}
```

## Usage in Scripts
When writing standalone scripts (e.g., in `packages/shared/lib/`), ensure you follow this pattern. Do **not** hardcode emulator settings if you intend to support remote connections.

### Forcing Remote Connection
If your environment (e.g., `.env` file) sets `FIRESTORE_EMULATOR_HOST` but you specifically want to run a script against the remote database, you must explicitly unset the environment variable before initializing the app.

```typescript
// Force remote connection by unsetting emulator host
delete process.env.FIRESTORE_EMULATOR_HOST;

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'hirico-internal-project-1' // Explicit remote project ID
  });
}
```

## Known Environments
- **Remote Project ID**: `hirico-internal-project-1`
- **Local Emulator**: `localhost:8080` (default)

## Debugging Techniques

### Dedicated Verification Server
When debugging connection issues (e.g., "Is my API actually hitting the remote DB?"), it is helpful to start a temporary server instance on a different port with explicit environment variables.

```bash
# Start server on port 3002, forcing remote connection (unset emulator host)
PORT=3002 FIRESTORE_EMULATOR_HOST= npx tsx packages/server/src/index.ts
```

This isolates the running process from any global environment settings or running emulators on the default port (3001).

### Direct Service Testing
To test backend logic (like Services) without going through the API layer, you can create a standalone script that imports the service directly. This is useful for isolating logic errors from API/Routing errors.

**Key Pattern**:
1.  Unset `FIRESTORE_EMULATOR_HOST` at the very top.
2.  Initialize `admin` with the remote project ID.
3.  Use `await import(...)` for your application code to ensure the environment is set up *before* the modules load (which might initialize Firebase internally).

```typescript
// packages/shared/lib/test_service_direct.ts
import admin from 'firebase-admin';

// 1. Force Remote
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'hirico-internal-project-1' });
}

// 2. Dynamic Import
const { MyService } = await import('../../server/src/services/my_service');

// 3. Run Test
await MyService.doSomething();
```



## Deprecation Note
- `packages/shared/lib/verify_firebase_data.ts` is **deprecated** because it relies on hardcoded emulator settings or outdated patterns. Use direct API calls or updated scripts like `simple_list_users.ts` for data verification.
