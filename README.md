# FinApp

## Problem Statement

While being a very crowded space, I am still extreme frustrated with the current state of personal finance management apps. I am in an unique situation where I have financial presense in multiple countries and assets in multiple currencies. I have credit, checking, savings, brokerage, and retirement accounts in each of the countries and their respective currencies. On top of that, each of the investment accounts employ just different enough strategies to make analyzing my asset allocation and financial health a real pain. 

This project aims to implement a personal finance management app that addresses the my problems and my problems only by providing a unified interface to all my financial accounts and assets. It aims to allow me to track my income, expenses, and investments in a single place, and provide me with insights and recommendations to help me make informed decisions about my financial future.

## Features

- Visualization of all sorts
- FX rate tracking
- Insights (AI)
  - Transactional behaviour
  - Account behaviour
  - Overall Insights
- Asset Tracking
  - Institutes
  - Bank/Credit Transaction
  - Statement Import and Categorization.
  - Investments
  - Super Annuation
  - Salary
- Custom Categorization
  - By country / Spend
  - Trip (Work vs Personal)
  - Multi-tier Transaction Category (Shopping, Utilities/Electricity, Utilities/Water, etc.) 
  - AI Auto Categorization 
  - Transfers (who)
- Asset allocation
  - Drill down to individual positions and lots
  - Live/Historical tracking (by date + stock name)
- Budgeting
- Tax
  - Deductables
  - Capital gains (Tax Lot tracking)
- Country
  - US
  - AU
  - JP


## External Libraries
- Alpaca - Stock
- Yahoo Finance / Exchange API
- https://github.com/fawazahmed0/exchange-api 

---

## Project Architecture & Decisions

This section documents the agreed-upon technical specifications and architecture for the FinApp project.

- **Platform**: A **web application**.
- **Stack**: A **full-stack TypeScript** application.
  - **Frontend**: **React** (bootstrapped with Vite).
  - **Backend**: **Express.js**.
- **Storage**: **Firebase** or a similar **GCP-based object store**.
- **Authentication**: **Firebase Authentication** using **Google Sign-In** as the identity provider.
- **Data Ingestion**: All financial data will be imported **manually via CSV files**. No third-party data aggregators like Plaid will be used.
- **AI-Powered Features**:
  - **Transaction Categorization**: A call will be made to a **Gemini** model to automatically categorize transactions based on merchant names against a predefined list of categories.
  - **Financial Insights**: A tool will be developed to retrieve cash flow data for a given period, which will then be sent to a **Gemini** model to generate a "financial health" report.
- **Visualizations**: Initial dashboards will be inspired by services like Maybe Finance and will include:
  - 100% stacked bar chart for asset allocation.
  - Line chart for saving rate over time.
  - Line chart for income over time.
  - Stacked bar chart for spending by category and/or account.
- **Tax Features**: Implementation of tax-related features is **postponed** for a future version.
- **Data Models**: The data models have been implemented in TypeScript under `packages/shared/models/`, covering Accounts, Transactions (General, Trade, Transfer), Instruments, Categories, Budgets, Users, and Recurring Transactions.