# Institute Model

## Class: `Institute`

Represents a financial institution (e.g., "Chase", "Morgan Stanley") that holds multiple accounts.

```typescript
import { v4 } from "uuid";
import type { IAccount } from "./account";

export interface IInstitute {
    instituteId: string;
    name: string;
    userId: string;
    accounts?: IAccount[];
}

export enum SupportedInstitute {
    CHASE = 'Chase',
    MORGAN_STANLEY = 'Morgan Stanley'
}

export class Institute implements IInstitute {
    instituteId: string;
    name: string;
    userId: string;
    accounts: IAccount[];

    constructor(name: string, userId: string, accounts: IAccount[]) {
        this.instituteId = v4();
        this.name = name;
        this.userId = userId;
        this.accounts = accounts;
    }
}
```

## Key Considerations
- **ID Generation**: `instituteId` MUST be a UUID v4.
    - **Implementation Note**: When creating an institute in the database, the server must explicitly generate this UUID and use it as the document ID (e.g., `.doc(instituteId).set(...)`). Do **not** use `.add()` which generates a random Firestore ID.
- **Hierarchy**: Institutes are the top-level grouping for Accounts.
