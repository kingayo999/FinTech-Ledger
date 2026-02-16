# FinTech Ledger

A production-grade, double-entry bookkeeping system built with TypeScript, Express, and PostgreSQL. Designed for financial integrity, auditability, and scalability.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.3.1-blueviolet)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://www.postgresql.org/)

---

## 🎯 Overview

FinTech Ledger implements a **double-entry accounting system** where every financial transaction is recorded as two offsetting ledger entries, ensuring mathematical integrity. The system supports:

- ✅ **Immutable Audit Trail**: Append-only ledger prevents tampering
- ✅ **Atomic Transfers**: ACID-compliant wallet-to-wallet transactions
- ✅ **Concurrency Safety**: Pessimistic locking prevents double-spending
- ✅ **Role-Based Access Control**: Separate USER and ADMIN permissions
- ✅ **Dual-Token Authentication**: Short-lived access tokens + long-lived refresh tokens
- ✅ **Rate Limiting**: Tiered protection against brute force and DDoS
- ✅ **Admin Audit Logs**: Full traceability of administrative actions

---

## 🏗️ Architecture

### Core Principles

1. **Double-Entry Bookkeeping**: Every transaction creates equal and opposite ledger entries
2. **Immutability**: Ledger entries cannot be updated or deleted
3. **Derived Balances**: Wallet balances are calculated from ledger history (with materialized cache)
4. **Atomic Operations**: Database transactions ensure all-or-nothing execution

### Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x (strict mode)
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 6.3.1
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod schemas
- **Password Hashing**: bcrypt (salt factor: 10)
- **Rate Limiting**: express-rate-limit

---

## 📂 Project Structure

```
FinTech Ledger/
├── prisma/
│   └── schema.prisma          # Database schema (double-entry design)
├── src/
│   ├── config/                # Singleton configurations (Prisma client)
│   ├── controllers/           # API request handlers
│   ├── middlewares/           # Auth, validation, rate limiting, error handling
│   ├── routes/                # Express route definitions
│   ├── schemas/               # Zod validation schemas
│   ├── services/              # Business logic (Ledger, Auth, Wallet)
│   ├── utils/                 # JWT utilities
│   ├── app.ts                 # Express app setup
│   └── index.ts               # Server entry point
├── tests/
│   ├── unit/                  # Unit tests (balance calculations, etc.)
│   └── integration/           # Integration tests (full flows)
├── demo.http                  # REST Client test file
└── .env                       # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/kingayo999/FinTech-Ledger.git
cd FinTech-Ledger

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

The server will start on `http://localhost:3000`.

---

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Create user/admin account
- `POST /auth/login` - Obtain access + refresh tokens
-`POST /auth/refresh` - Renew access token
- `POST /auth/logout` - Revoke refresh token

### Wallet Operations
- `GET /api/wallets` - List user wallets
- `POST /api/wallets` - Create new wallet
- `GET /api/wallets/:id/balance` - Get wallet balance
- `POST /api/wallets/:id/fund` - Mock funding (test only)

### Transactions
- `POST /api/transfer` - Peer-to-peer transfer

### Admin (ADMIN role required)
- `GET /admin/audit-logs` - Query audit logs
- `GET /admin/ledger/wallet/:id` - View wallet ledger history
- `GET /admin/ledger/transaction/:id` - Verify double-entry integrity

📄 **Full API documentation**: See [api_reference.md](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/api_reference.md)

---

## 🔐 Security Features

### Authentication & Authorization
- **JWT-based auth** with 15-minute access tokens
- **Refresh token rotation** with 7-day expiry
- **Session revocation** via database-backed token management
- **Account locking** via `isActive` flag

### Rate Limiting
- **General API**: 100 requests/15min per IP
- **Auth endpoints**: 5 requests/15min per IP (brute force protection)
- **Transfer endpoint**: 20 requests/10min per IP (spam protection)

### Financial Integrity
- **Pessimistic locking** (SELECT ... FOR UPDATE) prevents race conditions
- **Alphabetical lock acquisition** prevents deadlocks
- **Idempotency** via optional `referenceId` on transfers
- **Materialized balances** as performance cache, ledger is source of truth

### Audit & Compliance
- **Immutable ledger** (no UPDATE/DELETE at DB level)
- **Admin action logging** to `AuditLog` table
- **Metadata capture** (IP, actor, timestamps) on all entries

---

## ⚖️ Architecture Decisions & Trade-Offs

### 1. Materialized vs Derived Balances
**Decision**: Maintain a `balance` field on `Wallet` table, updated atomically with ledger entries.

**Why**: O(1) balance lookups vs O(N) SUM queries for high-volume wallets.

**Trade-off**: Slight data duplication (balance exists in both cache and ledger), but ledger remains source of truth.

### 2. Pessimistic vs Optimistic Locking
**Decision**: Use `SELECT ... FOR UPDATE` on wallet rows during transfers.

**Why**: Financial systems cannot tolerate "retry on conflict" failures. Users expect transfers to succeed or fail immediately.

**Trade-off**: Lower concurrency throughput, but stronger consistency guarantees.

### 3. Append-Only Ledger
**Decision**: No UPDATE/DELETE operations on `LedgerEntry` table.

**Why**: Regulatory compliance, forensic auditing, and tamper-proof history.

**Trade-off**: Cannot "fix" mistakes by editing—must create reversing entries.

### 4. Prisma 6.3.1 (Not 7.x)
**Decision**: Pin to Prisma 6.3.1 stable version.

**Why**: Version 7.x had WASM engine generation errors in our environment.

**Trade-off**: Miss bleeding-edge features, but gain stability.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

**Testing Philosophy**: Focus on critical financial logic (balance calculations, double-entry integrity) rather than framework plumbing (Express routing, Prisma queries).

📄 **Full testing strategy**: See [testing_strategy.md](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/testing_strategy.md)

---

## 📚 Documentation

- **[Implementation Plan](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/implementation_plan.md)** - Phase-by-phase development history
- **[Wallet Lifecycle](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/wallet_lifecycle.md)** - Wallet states and funding logic
- **[Transfer Flow](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/transfer_flow.md)** - Atomic transfer implementation
- **[Ledger & Audit Design](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/ledger_and_audit_design.md)** - Immutability guarantees
- **[Security Policy](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/security_policy.md)** - Threat model and mitigations
- **[Error Handling](./brain/55162e2e-8817-46d6-a251-88f87f7d1b40/error_handling_security.md)** - Error strategies and logging

---

## 🎓 Interview Guide

### "Explain your project in 2 minutes"

> "I built a double-entry ledger system for handling financial transactions. The core challenge was ensuring **data integrity** and **concurrency safety** in a multi-user environment.
>
> Every transfer creates two ledger entries—one debit, one credit—that must sum to zero. This is the foundation of accounting and ensures money never 'appears' or 'disappears.'
>
> To prevent race conditions, I implemented **pessimistic locking** using PostgreSQL's SELECT FOR UPDATE. When two users try to transfer from the same wallet simultaneously, the second transaction waits until the first completes, then sees the updated balance.
>
> I also made the ledger **append-only**—no updates or deletes allowed. This creates a tamper-proof audit trail, critical for financial compliance.
>
> The system uses **dual-token auth** (short access tokens + long refresh tokens) and **tiered rate limiting** to protect against brute force attacks.
>
> The tech stack is TypeScript, Express, Prisma, and PostgreSQL, chosen for type safety and transactional reliability."

### Common Follow-Up Questions

**Q: How do you handle concurrent transfers?**
> "I use pessimistic locking with alphabetical key ordering to prevent deadlocks. When transferring from Wallet A to Wallet B, the system locks them in sorted order (e.g., A then B). Two simultaneous transfers involving the same wallets will execute serially."

**Q: What if the database fails mid-transaction?**
> "All transfers are wrapped in database transactions. If the DB crashes after debiting Wallet A but before crediting Wallet B, PostgreSQL rolls back both operations on restart. ACID compliance guarantees atomicity."

**Q: How do you prevent negative balances?**
> "The transfer service checks the sender's balance while holding a lock on their wallet row. If balance < amount, the transaction is rejected before any ledger entries are created."

---

## 🤝 Contributing

Contributions are welcome! Please open an issue for bug reports or feature requests.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Kingsley Olayanju**
- GitHub: [@kingayo999](https://github.com/kingayo999)
- Repository: [FinTech-Ledger](https://github.com/kingayo999/FinTech-Ledger)
