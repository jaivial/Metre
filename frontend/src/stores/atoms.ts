import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Table, Reservation, Shift, ShiftType, DailyLimit } from '@/types'

export const tablesAtom = atom<Table[]>([])

export const selectedTableIdAtom = atom<string | null>(null)

export const selectedTableAtom = atom((get) => {
  const tables = get(tablesAtom)
  const selectedId = get(selectedTableIdAtom)
  return tables.find((t) => t.id === selectedId) || null
})

export const reservationsAtom = atom<Reservation[]>([])

export const selectedDateAtom = atomWithStorage<string>('metre-selected-date', new Date().toISOString().split('T')[0])

export const selectedShiftAtom = atom<ShiftType>('dinner')

export const selectedTimeAtom = atom<string>('20:00')

export const selectedReservationIdAtom = atom<string | null>(null)

export const selectedReservationAtom = atom((get) => {
  const reservations = get(reservationsAtom)
  const selectedId = get(selectedReservationIdAtom)
  return reservations.find((r) => r.id === selectedId) || null
})

export const shiftsAtom = atom<Shift[]>([])

export const currentShiftAtom = atom((get) => {
  const shifts = get(shiftsAtom)
  const selectedShift = get(selectedShiftAtom)
  return shifts.find((s) => s.type === selectedShift) || null
})

export const dailyLimitAtom = atom<DailyLimit | null>(null)

export const viewModeAtom = atom<'edit' | 'view'>('edit')

export const statusFilterAtom = atom<'all' | 'free' | 'occupied'>('all')

export const capacityFilterAtom = atom<number | null>(null)

export const filteredTablesAtom = atom((get) => {
  const tables = get(tablesAtom)
  const statusFilter = get(statusFilterAtom)
  const capacityFilter = get(capacityFilterAtom)

  return tables.filter((table) => {
    if (statusFilter !== 'all' && table.status !== statusFilter) {
      return false
    }
    if (capacityFilter !== null && table.capacity < capacityFilter) {
      return false
    }
    return true
  })
})

export const upcomingReservationsAtom = atom((get) => {
  const reservations = get(reservationsAtom)
  const now = new Date()
  return reservations
    .filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
})

export const seatedReservationsAtom = atom((get) => {
  const reservations = get(reservationsAtom)
  return reservations.filter((r) => r.status === 'seated')
})

export const isSidebarOpenAtom = atomWithStorage<boolean>('metre-sidebar-open', false)

export const isSheetOpenAtom = atomWithStorage<boolean>('metre-sheet-open', false)

export const wsConnectedAtom = atom<boolean>(false)

export const isLoadingAtom = atom<boolean>(false)

export const errorAtom = atom<string | null>(null)
