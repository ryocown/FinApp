# API Routes

This document outlines the API routes available in the FinApp server.

## Base URL
All routes are prefixed with `/api`.
The server mounts specific route modules to sub-paths.

## Transactions (`/api/transactions`)
Mounted at: `/api/transactions`
Source: `src/routes/transactions.ts`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users/:userId/transactions` | Get all transactions for a user. Supports filtering by `accountId`, `limit`, `pageToken`, and `sortOrder` ('asc' or 'desc'). |
| `POST` | `/users/:userId/transactions` | Create a single transaction. |
| `POST` | `/users/:userId/accounts/:accountId/transactions/batch` | Batch create transactions. Supports `skipDuplicates` option. |
| `PUT` | `/users/:userId/transactions/:transactionId` | Update a transaction. |
| `DELETE` | `/users/:userId/transactions/:transactionId` | Delete a transaction. |
| `POST` | `/users/:userId/transfers` | Create an atomic transfer between two accounts. |

**Full Path Example:**
`POST /api/transactions/users/123/accounts/456/transactions/batch`

## Accounts (`/api/accounts`)
Mounted at: `/api/accounts`
Source: `src/routes/accounts.ts`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users/:userId/accounts` | Get all accounts for a user. |
| `POST` | `/users/:userId/accounts` | Create a new account. |
| `PUT` | `/users/:userId/accounts/:accountId` | Update an account (e.g., rename). Immutable: `balance`, `instituteId`, `userId`. |
| `DELETE` | `/users/:userId/accounts/:accountId` | Delete an account and all its subcollections. |
| `GET` | `/users/:userId/accounts/:accountId/transactions` | Get transactions for a specific account. Supports `limit`, `pageToken`, and `sortOrder`. |
| `GET` | `/users/:userId/budget` | Get budget items for a user. |
| `POST` | `/users/:userId/accounts/:accountId/reconcile` | Reconcile account balance (creates a checkpoint). |
| `GET` | `/users/:userId/accounts/:accountId/checkpoints` | Get balance checkpoints for an account. |
| `DELETE` | `/users/:userId/accounts/:accountId/checkpoints/:checkpointId` | Delete a specific checkpoint. |

## Institutes (`/api/institutes`)
Mounted at: `/api/institutes`
Source: `src/routes/institutes.ts`

## Instruments (`/api/instruments`)
Mounted at: `/api/instruments`
Source: `src/routes/instruments.ts`

## Currencies (`/api/currencies`)
Mounted at: `/api/currencies`
Source: `src/routes/currencies.ts`

## Analytics (`/api/analytics`)
Mounted at: `/api/analytics`
Source: `src/routes/analytics.ts`
