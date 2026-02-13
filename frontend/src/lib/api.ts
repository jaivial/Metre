import type { Table, Reservation, ShiftType, DailyLimit, RestaurantConfig, Shift, SearchTables, UpdateTablePosition, UpdateTableSize, AssignTable, UpdateReservation, CreateReservation } from '@/types'

export type { SearchTables, UpdateTablePosition, UpdateTableSize, AssignTable, UpdateReservation, CreateReservation }

const API_BASE = '/api'

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP error ${response.status}`)
  }

  return response.json()
}

export const api = {
  tables: {
    getAll: () =>
      fetchApi<Table[]>('/tables', { method: 'GET' }),

    getById: (id: string) =>
      fetchApi<Table>(`/tables/${id}`, { method: 'GET' }),

    create: (data: CreateReservation) =>
      fetchApi<Table>('/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Table>) =>
      fetchApi<Table>(`/tables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updatePosition: (data: UpdateTablePosition) =>
      fetchApi<Table>(`/tables/${data.id}/position`, {
        method: 'PATCH',
        body: JSON.stringify({ x: data.x, y: data.y }),
      }),

    updateSize: (data: UpdateTableSize) =>
      fetchApi<Table>(`/tables/${data.id}/size`, {
        method: 'PATCH',
        body: JSON.stringify({ width: data.width, height: data.height }),
      }),

    delete: (id: string) =>
      fetchApi<void>(`/tables/${id}`, { method: 'DELETE' }),

    search: (params: SearchTables) =>
      fetchApi<Table[]>('/tables/search', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    combine: (tableIds: string[]) =>
      fetchApi<Table>('/tables/combine', {
        method: 'POST',
        body: JSON.stringify({ tableIds }),
      }),

    uncombine: (tableId: string) =>
      fetchApi<Table>(`/tables/${tableId}/uncombine`, {
        method: 'POST',
      }),
  },

  reservations: {
    getAll: (date?: string) =>
      fetchApi<Reservation[]>(`/reservations${date ? `?date=${date}` : ''}`, {
        method: 'GET',
      }),

    getById: (id: string) =>
      fetchApi<Reservation>(`/reservations/${id}`, { method: 'GET' }),

    getByDateAndTime: (date: string, time: string) =>
      fetchApi<Reservation[]>(`/reservations?date=${date}&time=${time}`, {
        method: 'GET',
      }),

    create: (data: CreateReservation) =>
      fetchApi<Reservation>('/reservations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<UpdateReservation>) =>
      fetchApi<Reservation>(`/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    assignTable: (data: AssignTable) =>
      fetchApi<Reservation>('/reservations/assign-table', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    seat: (id: string) =>
      fetchApi<Reservation>(`/reservations/${id}/seat`, {
        method: 'POST',
      }),

    complete: (id: string) =>
      fetchApi<Reservation>(`/reservations/${id}/complete`, {
        method: 'POST',
      }),

    cancel: (id: string) =>
      fetchApi<Reservation>(`/reservations/${id}/cancel`, {
        method: 'POST',
      }),

    delete: (id: string) =>
      fetchApi<void>(`/reservations/${id}`, { method: 'DELETE' }),
  },

  config: {
    get: () =>
      fetchApi<RestaurantConfig>('/config', { method: 'GET' }),

    update: (data: Partial<RestaurantConfig>) =>
      fetchApi<RestaurantConfig>('/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  dailyLimits: {
    get: (date: string) =>
      fetchApi<DailyLimit>(`/daily-limits/${date}`, { method: 'GET' }),

    set: (date: string, maxReservations: number) =>
      fetchApi<DailyLimit>(`/daily-limits/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ maxReservations }),
      }),
  },

  shifts: {
    getByDate: (date: string) =>
      fetchApi<Shift[]>(`/shifts?date=${date}`, { method: 'GET' }),
  },
}

export default api
