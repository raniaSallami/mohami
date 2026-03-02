# FastAPI Backend Migration Plan

## Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   ├── config.py               # Configuration settings
│   ├── database.py             # Database connection
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── models/                 # SQLAlchemy models (multi-tenant)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── case.py
│   │   ├── contract.py
│   │   ├── event.py
│   │   ├── invoice.py
│   │   ├── notification.py
│   │   ├── chat.py
│   │   └── tenant.py           # Multi-tenant models
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── case.py
│   │   ├── contract.py
│   │   ├── event.py
│   │   ├── invoice.py
│   │   ├── notification.py
│   │   └── chat.py
│   │
│   ├── routers/                # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── cases.py
│   │   ├── contracts.py
│   │   ├── events.py
│   │   ├── invoices.py
│   │   ├── notifications.py
│   │   ├── chat.py
│   │   └── admin.py            # Admin routes
│   │
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── chat_service.py
│   │   ├── email_service.py
│   │   └── notification_service.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── security.py         # JWT & password hashing
│       └── tenants.py          # Multi-tenant utilities
│
├── alembic/                    # Database migrations
│   └── env.py
├── requirements.txt
├── .env.example
└── run.py                      # Application runner
```

## Key Features

### 1. Authentication (JWT)
- Access token (15min) + Refresh token (7 days)
- Password hashing with bcrypt
- Role-based access control (ADMIN, LAWYER, CLIENT)
- Token refresh endpoints

### 2. Multi-Tenant Architecture
- Organization/tenant isolation
- `tenant_id` field on all user data
- Query filtering by current tenant
- Admin can access all tenants

### 3. Database
- SQLAlchemy 2.0 with async support
- PostgreSQL connection pooling
- Alembic for migrations
- Proper indexes for performance

### 4. API Endpoints (mirroring existing Express)
- Auth: login, register, refresh, logout
- Users: CRUD, profile, team management
- Cases: CRUD, documents, analysis
- Contracts: CRUD, templates
- Events: Calendar events with reminders
- Invoices: Payment management
- Notifications: Real-time notifications
- Chat: Conversations and messages
- Admin: Statistics, user management

## Migration Steps (COMPLETED)

1. [x] Create FastAPI project structure
2. [x] Set up SQLAlchemy models matching existing DB
3. [x] Implement JWT authentication
4. [x] Create auth router (login, register, refresh)
5. [x] Create users router with multi-tenant support
6. [x] Create cases router
7. [x] Create contracts router
8. [x] Create events router
9. [x] Create invoices router
10. [x] Create notifications router
11. [x] Create chat router
12. [x] Create admin router (stats, user management)
13. [x] Set up Alembic migrations
14. [x] Add CORS and middleware
15. [x] Test API endpoints

