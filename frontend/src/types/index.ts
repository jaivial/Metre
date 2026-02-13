export type TableShape = 'round' | 'square'

export type TableStatus = 'free' | 'occupied' | 'reserved'

export interface Table {
  id: string
  number: number | string
  shape: TableShape
  capacity: number
  x: number
  y: number
  width: number
  height: number
  status: TableStatus
  reservationId?: string
  combinedWith?: string[]
}

export type CanvasObjectShape = 'round' | 'square'

export interface CanvasObject {
  id: string
  shape: CanvasObjectShape
  x: number
  y: number
  width: number
  height: number
  locked: boolean
}

export type CanvasLimits =
  | { kind: 'none' }
  | { kind: 'rect'; rect: { x: number; y: number; width: number; height: number } }
  | { kind: 'poly'; points: Array<{ x: number; y: number }> }

export type ShiftType = 'breakfast' | 'lunch' | 'afternoon_snack' | 'dinner'

export interface TimeSlot {
  time: string
  available: number
  total: number
  isFull: boolean
}

export interface Shift {
  id: string
  type: ShiftType
  startTime: string
  endTime: string
  slots: TimeSlot[]
  isActive: boolean
}

export interface Reservation {
  id: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  shift: ShiftType
  guestsCount: number
  tableId?: string
  tableNumber?: number
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled'
  comments?: string
  createdAt: string
  updatedAt: string
}

export interface DailyLimit {
  date: string
  maxReservations: number
  currentReservations: number
}

export interface RestaurantConfig {
  id: string
  name: string
  canvasWidth: number
  canvasHeight: number
  defaultMaxReservations: number
}

export interface WebSocketMessage {
  type: 'reservation_created' | 'reservation_updated' | 'reservation_cancelled' | 'table_updated'
  payload: unknown
}

export interface CreateReservation {
  name: string
  email?: string
  phone: string
  date: string
  time: string
  shift: ShiftType
  guestsCount: number
  comments?: string
}

export interface UpdateReservation extends Partial<Reservation> {
  id: string
}

export interface UpdateTablePosition {
  id: string
  x: number
  y: number
}

export interface UpdateTableSize {
  id: string
  width: number
  height: number
}

export interface AssignTable {
  reservationId: string
  tableId: string
}

export interface SearchTables {
  date?: string
  time?: string
  shift?: ShiftType
  minCapacity?: number
  maxCapacity?: number
  status?: TableStatus
}
