# FinApp Domain Models Overview

This Knowledge Item documents the core domain models for the FinApp application, including Accounts, Transactions, and Financial Instruments.

## Core Concepts

- **Institute**: A financial institution holding multiple accounts.
- **Account**: A financial account (Bank, Credit Card, Investment, etc.).
positions. Supports various subtypes (Checking, Savings, Investment).
- **Transaction**: Represents a movement of funds or a trade. Linked to a single Account.
- **Financial Instrument**: Represents a tradable asset (Stock, Bond, Option) held in an Investment Account.
- **Currency**: Represents fiat or crypto currencies and exchange rates (`CurrencyPair`).
- **Merchant**: Entity involved in general transactions.
- **Statement**: Represents a periodic collection of transactions for an account.
- **User**: Represents a system user.
- **Category**: Represents a transaction classification.
- **Budget**: Represents a spending limit for a category.
- **Tag**: Represents a flexible label for transactions.
- **Recurring Transaction**: Represents a schedule for automated transactions.
- **Price History**: Represents historical pricing data for assets.

## Design Decisions

- **Single Entry (Modified)**: The system tracks transactions and their impact on accounts rather than full double-entry bookkeeping with debits/credits.
- **UUIDs**: Entities generally use UUID v4 strings as primary keys. Transactions use **UUID v5 (deterministic)** when imported to prevent duplicates, and **UUID v4** when created manually.

## Conventions
- **Field Ordering**: Models follow a strict field ordering:
    1.  Primary Key ID
    2.  Foreign Key IDs
    3.  Other Fields
