# AGENTS.md - Metre Project Coding Rules

## Project Overview

- **Project name**: metre
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Go (futuro)
- **Database**: PostgreSQL with Drizzle ORM (futuro)
- **Frontend port**: 3001

---

## Design System (MANDATORY)

### Border Radius

ALL components must use `1.8rem` border radius. NO EXCEPTIONS.

```css
/* CORRECT */
border-radius: 1.8rem;

/* INCORRECT */
border-radius: 0.5rem;
border-radius: 8px;
border-radius: 4px;
```

### Color Palette (with 80% opacity variations)

Use the following color palette with opacity variations as needed:

- `dark/80` - Primary dark shade
- `white/80` - Primary light shade
- `gray/80` - Neutral gray tone
- `silver/80` - Light metallic tone

Opacity may vary (e.g., 60%, 70%, 80%, 90%) based on design needs, but base colors must come from this palette.

### Typography

- **Base size**: medium-small for open space
- **Minimum font sizes**: NEVER go below recommended minimum font sizes for mobile
- **Units**: Use rem units exclusively

```css
/* CORRECT */
font-size: 1rem;
font-size: 0.875rem;

/* INCORRECT */
font-size: 12px;
font-size: 14px;
```

### Themes

- Support both **dark** and **light** themes
- Use **Glassmorphism** as the base style

```css
/* Glassmorphism base */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

### Mobile-First (STRICT)

- **NO hover effects allowed**
- **NO hover stylings**
- Optimize for touch interactions only

```css
/* WRONG - Never use hover */
.button:hover {
  background: blue;
}

/* CORRECT - Touch-optimized only */
.button {
  background: blue;
  transition: background 0.2s ease-in-out;
}

.button:active {
  background: darkblue;
}
```

### Icons

Use **ONLY Lucide React icons**. Do not use any other icon library.

```tsx
import { IconName } from 'lucide-react';

// Examples
import { User, Settings, LogOut, Menu, X, Plus, Minus } from 'lucide-react';
```

### Animations

- Use **Motion (framer-motion)** for animations
- Use **Three.js** for WebGL resources
- Create elegant **fade in / fade out** with **ease-in-out** transitions between pages

```tsx
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = {
  duration: 0.3,
  ease: 'easeInOut',
};

<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageVariants}
  transition={pageTransition}
>
  {children}
</motion.div>;
```

---

## Frontend Architecture

### State Management

- Use **Jotai atoms ONLY**
- **NO Context API**
- **NO Redux**
- Store atoms in `/src/stores/`

```tsx
// /src/stores/tablesAtom.ts
import { atom } from 'jotai';
import type { Table } from '@/types';

export const tablesAtom = atom<Table[]>([]);
export const selectedTableIdAtom = atom<string | null>(null);
```

### API Client

- Centralized API client in `/src/lib/api.ts`
- All endpoints stored by methods (GET, POST, PUT, DELETE)
- Use **Zod** for endpoint validation

```tsx
// /src/lib/api.ts
const apiClient = {
  get: async <T>(url: string, schema: z.ZodSchema<T>) => {
    const response = await fetch(url);
    const data = await response.json();
    return schema.parse(data);
  },
};
```

### Components

- **Base UI components** in `/src/components/ui/`
- **Layout components** in `/src/components/layout/`
- **Feature components** in `/src/components/features/`

```
/src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Sheet.tsx
│   │   └── Calendar.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TimeSheet.tsx
│   └── features/
│       ├── TableCanvas.tsx
│       └── ReservationForm.tsx
├── stores/
│   └── atoms.ts
├── hooks/
│   └── useWebSocket.ts
├── lib/
│   ├── api.ts
│   ├── schemas.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── App.tsx
```

---

## Database Schema (Drizzle ORM - Futuro)

```typescript
// /backend/drizzle/schema.ts
import { pgTable, uuid, varchar, int, timestamp, boolean } from 'drizzle-orm/pg-core';

export const tables = pgTable('tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: int('number').notNull(),
  shape: varchar('shape', { length: 10 }).notNull(), // 'round' | 'square'
  capacity: int('capacity').notNull(),
  x: int('x').notNull(),
  y: int('y').notNull(),
  width: int('width').notNull(),
  height: int('height').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('free'),
  reservationId: uuid('reservation_id'),
  combinedWith: varchar('combined_with', { length: 500 }), // JSON array of IDs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  time: varchar('time', { length: 5 }).notNull(), // HH:MM
  shift: varchar('shift', { length: 20 }).notNull(),
  guestsCount: int('guests_count').notNull(),
  tableId: uuid('table_id'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  comments: varchar('comments', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

---

## Quick Reference

| Category | Rule |
|----------|------|
| Border Radius | `1.8rem` only |
| Colors | dark/80, white/80, gray/80, silver/80 |
| Icons | Lucide React only |
| Animations | Motion (framer-motion) |
| State | Jotai atoms only |
| API | Centralized in `/src/lib/api.ts` + Zod |
| Components | `/src/components/ui/`, `/src/components/layout/`, `/src/components/features/` |
| Database | Drizzle ORM + PostgreSQL |
| Documentation | `/docs/` folder |
| Themes | Dark + Light + Glassmorphism |
| Mobile | Touch-only, NO hover effects |
