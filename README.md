# Finance Dashboard API

A scalable, role-based REST API backend for a financial dashboard system. Built with Node.js, Express, TypeScript, and PostgreSQL (Supabase), this backend supports multi-role access control, full financial record management, and aggregated dashboard analytics.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL via Supabase
- **Auth**: JSON Web Tokens (JWT)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Dev Tools**: ts-node, nodemon

---

## Architecture

```
server/
└── src/
    ├── index.ts              # App entry point
    ├── db.ts                 # PostgreSQL connection pool
    ├── middleware/
    │   └── auth.ts           # JWT authentication + role authorization
    ├── routes/
    │   ├── authRoutes.ts
    │   ├── userRoutes.ts
    │   ├── recordsRoutes.ts
    │   └── dashboardRoutes.ts
    └── controllers/
        ├── authController.ts
        ├── userController.ts
        ├── recordsController.ts
        └── dashboardController.ts
```

The project follows a clean **MVC-inspired architecture** with a clear separation between routing, business logic, and data access. Middleware is composable — authentication and authorization are applied per-route rather than globally, giving fine-grained control over access.

---

## Role System

| Role     | Permissions |
|----------|-------------|
| `viewer`   | View financial records |
| `analyst`  | View records + access dashboard summary and insights |
| `admin`    | Full access — manage records, users, roles, and status |

All new users default to `viewer` on registration. Only an admin can promote users to `analyst` or `admin`.

---

## Setup

### Prerequisites
- Node.js v18+
- A Supabase project with PostgreSQL enabled

### 1. Clone the repository

```bash
git clone https://github.com/your-username/finance-dashboard.git
cd finance-dashboard/server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]/postgres
JWT_SECRET=your_jwt_secret_here
PORT=5050
```

### 4. Set up the database

Run the following SQL in your Supabase SQL Editor:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'analyst', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Seed an admin user

Register via the API, then promote yourself in the Supabase SQL Editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. Start the server

```bash
npm run dev
```

Server runs at `http://localhost:5050`

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register a new user (defaults to viewer) |
| POST | `/api/auth/login` | None | Login and receive a JWT token |

#### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

---

### Users (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | Get all users |
| PATCH | `/api/users/:id/role` | Admin | Update a user's role |
| PATCH | `/api/users/:id/status` | Admin | Activate or deactivate a user |

#### Update Role
```json
PATCH /api/users/:id/role
{
  "role": "analyst"
}
```

#### Update Status
```json
PATCH /api/users/:id/status
{
  "is_active": false
}
```

---

### Financial Records

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/records` | ✅ | Admin | Create a new record |
| GET | `/api/records` | ✅ | All | Get all records (supports filtering) |
| GET | `/api/records/:id` | ✅ | All | Get a single record |
| PATCH | `/api/records/:id` | ✅ | Admin | Update a record |
| DELETE | `/api/records/:id` | ✅ | Admin | Delete a record |

#### Create Record
```json
POST /api/records
{
  "amount": 15000,
  "type": "income",
  "category": "salary",
  "date": "2026-04-06",
  "notes": "April salary"
}
```

#### Filtering Records
```
GET /api/records?type=expense&category=food&start_date=2026-04-01&end_date=2026-04-30
```

Supported query params: `type`, `category`, `start_date`, `end_date`

---

### Dashboard (Analyst + Admin)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/dashboard/summary` | ✅ | Analyst, Admin | Get aggregated financial summary |

#### Response
```json
{
  "total_income": 30000,
  "total_expenses": 12000,
  "net_balance": 18000,
  "category_breakdown": [
    { "category": "salary", "total": "15000.00", "type": "income" }
  ],
  "monthly_trends": [
    { "month": "2026-04", "income": "15000", "expenses": "12000" }
  ],
  "recent_activity": [...]
}
```

---

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are issued on login and expire after 7 days.

---

## Error Handling

The API returns consistent, descriptive error responses:

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient role permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already in use) |
| 500 | Internal server error |

---

## Design Decisions

- **JWT over sessions** — stateless auth fits a REST API better and scales horizontally without shared session storage
- **Role check in middleware** — authorization is enforced at the route level, keeping controllers clean and focused on business logic
- **COALESCE in update queries** — partial updates are supported without requiring the client to send all fields
- **Supabase PostgreSQL** — managed PostgreSQL with SSL enforced, no infra overhead
- **TypeScript throughout** — strong typing catches bugs at compile time and makes the codebase self-documenting
