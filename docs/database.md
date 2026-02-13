# Metre - Restaurant Table Management

## Overview

Metre is a restaurant table management application that connects to the Back Office PostgreSQL database for persistent data storage. This document explains the data connection architecture and database usage.

---

## Database Connection

### Connection Details

The application connects to the **Back Office PostgreSQL database** with the following configuration:

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `backoffice` |
| User | `backoffice` |
| Password | `backoffice123` |
| SSL Mode | `disable` |

### Connection String

```
postgres://backoffice:backoffice123@localhost:5432/backoffice?sslmode=disable
```

### Environment Configuration

Create a `.env` file in the frontend directory:

```bash
# Database connection
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

---

## Database Schema

Metre uses two main tables in the Back Office database:

### Tables

```sql
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    shape VARCHAR(10) NOT NULL,  -- 'round' | 'square'
    capacity INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'free',  -- 'free' | 'occupied' | 'reserved'
    reservation_id UUID,
    combined_with VARCHAR(500),  -- JSON array of table IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Reservations

```sql
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    date VARCHAR(10) NOT NULL,  -- YYYY-MM-DD
    time VARCHAR(5) NOT NULL,    -- HH:MM
    shift VARCHAR(20) NOT NULL,  -- 'breakfast' | 'lunch' | 'afternoon_snack' | 'dinner'
    guests_count INTEGER NOT NULL,
    table_id UUID REFERENCES tables(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled'
    comments VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Integration

### Backend API Endpoints

The Back Office Go backend provides REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | List all tables |
| POST | `/api/tables` | Create new table |
| PUT | `/api/tables/:id` | Update table position/status |
| DELETE | `/api/tables/:id` | Delete table |
| GET | `/api/reservations` | List reservations |
| POST | `/api/reservations` | Create reservation |
| PUT | `/api/reservations/:id` | Update reservation |
| DELETE | `/api/reservations/:id` | Cancel reservation |

### Frontend API Client

The frontend uses a centralized API client located at `/src/lib/api.ts`:

```typescript
import { z } from 'zod';

const apiClient = {
  get: async <T>(url: string, schema: z.ZodSchema<T>) => {
    const response = await fetch(url);
    const data = await response.json();
    return schema.parse(data);
  },
  post: async <T>(url: string, body: unknown, schema: z.ZodSchema<T>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return schema.parse(data);
  },
  put: async <T>(url: string, body: unknown, schema: z.ZodSchema<T>) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return schema.parse(data);
  },
  delete: async (url: string) => {
    await fetch(url, { method: 'DELETE' });
  },
};
```

### WebSocket for Real-time Updates

The application uses WebSocket for real-time synchronization:

```typescript
// Connection URL
ws://localhost:8080/ws
```

Events:
- `table:update` - Table position or status changed
- `reservation:create` - New reservation added
- `reservation:update` - Reservation status changed

---

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Go Backend     │────▶│  PostgreSQL     │
│   (Metre)       │◀────│  (Port 8080)    │◀────│  (Port 5432)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        │
┌─────────────────┐              │
│  Jotai Atoms   │◀─────────────┘
│  (Local State) │
└─────────────────┘
```

### Flow Description

1. **User Interaction**: User drags table or creates reservation in React UI
2. **State Update**: Jotai atoms update local state immediately (optimistic UI)
3. **API Call**: API client sends request to Go backend
4. **Database Operation**: Backend executes PostgreSQL query
5. **WebSocket Broadcast**: Backend broadcasts change to all connected clients
6. **State Sync**: Clients receive WebSocket event and sync atoms

---

## Development Setup

### Prerequisites

- Node.js 18+
- Go 1.21+ (for backend)
- PostgreSQL 14+

### Frontend Setup

```bash
cd metre/frontend
npm install
npm run dev
```

Runs on http://localhost:3001

### Backend Setup

```bash
cd backoffice/backend
go mod download
go run cmd/server/main.go
```

Runs on http://localhost:8080

### Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE backoffice;

# Create user
CREATE USER backoffice WITH PASSWORD 'backoffice123';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE backoffice TO backoffice;
```

---

## Current Implementation Status

### Completed Features

- ✅ Table canvas with drag-and-drop (React Flow)
- ✅ Table status management (free/occupied/reserved)
- ✅ Reservation creation and management
- ✅ Time slot selection (breakfast, lunch, afternoon, dinner)
- ✅ Date picker for reservations
- ✅ Mobile-optimized UI with slide-up panels
- ✅ Real-time updates via WebSocket (stub)

### Pending Features

- ⬜ Backend API integration
- ⬜ PostgreSQL database connection
- ⬜ User authentication
- ⬜ Client management
- ⬜ Reporting and analytics

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript |
| State Management | Jotai |
| Canvas | @xyflow/react (React Flow) |
| Animations | Framer Motion |
| Styling | Tailwind CSS |
| API Client | Fetch + Zod |
| Backend | Go |
| Database | PostgreSQL + pgxpool |
| Real-time | WebSocket |

---

## File Structure

```
metre/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Base UI components
│   │   │   ├── layout/      # Layout components
│   │   │   └── features/    # Feature components
│   │   ├── stores/          # Jotai atoms
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # API, utils, schemas
│   │   └── types/           # TypeScript types
│   └── package.json
├── docs/
│   └── database.md          # This document
└── README.md
```
