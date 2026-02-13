import { z } from 'zod'

export const tableSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  shape: z.enum(['round', 'square']),
  capacity: z.number().int().min(1).max(20),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  status: z.enum(['free', 'occupied', 'reserved']),
  reservationId: z.string().uuid().optional(),
  combinedWith: z.array(z.string().uuid()).optional(),
})

export const createTableSchema = tableSchema.omit({ id: true, reservationId: true, combinedWith: true })

export const updateTablePositionSchema = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
})

export const updateTableSizeSchema = z.object({
  id: z.string().uuid(),
  width: z.number(),
  height: z.number(),
})

export const reservationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  shift: z.enum(['breakfast', 'lunch', 'afternoon_snack', 'dinner']),
  guestsCount: z.number().int().min(1).max(20),
  tableId: z.string().uuid().optional(),
  tableNumber: z.number().int().positive().optional(),
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled']),
  comments: z.string().max(500).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const createReservationSchema = reservationSchema.omit({
  id: true,
  tableNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
})

export const updateReservationSchema = reservationSchema.partial().extend({
  id: z.string().uuid(),
})

export const assignTableSchema = z.object({
  reservationId: z.string().uuid(),
  tableId: z.string().uuid(),
})

export const searchTablesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  shift: z.enum(['breakfast', 'lunch', 'afternoon_snack', 'dinner']).optional(),
  minCapacity: z.number().int().min(1).optional(),
  maxCapacity: z.number().int().max(20).optional(),
  status: z.enum(['free', 'occupied', 'reserved']).optional(),
})

export type Table = z.infer<typeof tableSchema>
export type CreateTable = z.infer<typeof createTableSchema>
export type UpdateTablePosition = z.infer<typeof updateTablePositionSchema>
export type UpdateTableSize = z.infer<typeof updateTableSizeSchema>
export type Reservation = z.infer<typeof reservationSchema>
export type CreateReservation = z.infer<typeof createReservationSchema>
export type UpdateReservation = z.infer<typeof updateReservationSchema>
export type AssignTable = z.infer<typeof assignTableSchema>
export type SearchTables = z.infer<typeof searchTablesSchema>
