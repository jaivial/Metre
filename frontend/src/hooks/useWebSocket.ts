import { useEffect, useCallback, useRef } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { io, Socket } from 'socket.io-client'
import {
  tablesAtom,
  reservationsAtom,
  wsConnectedAtom,
  selectedDateAtom,
  selectedShiftAtom,
} from '@/stores/atoms'
import type { Table, Reservation, WebSocketMessage } from '@/types'

const SOCKET_URL = 'http://localhost:8080'

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [, setTables] = useAtom(tablesAtom)
  const [, setReservations] = useAtom(reservationsAtom)
  const [isConnected, setIsConnected] = useAtom(wsConnectedAtom)
  const [selectedDate] = useAtom(selectedDateAtom)
  const [selectedShift] = useAtom(selectedShiftAtom)

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case 'table_updated': {
          const table = message.payload as Table
          setTables((prev: Table[]) =>
            prev.map((t) => (t.id === table.id ? table : t))
          )
          break
        }
        case 'reservation_created': {
          const reservation = message.payload as Reservation
          setReservations((prev: Reservation[]) => [...prev, reservation])
          break
        }
        case 'reservation_updated': {
          const reservation = message.payload as Reservation
          setReservations((prev: Reservation[]) =>
            prev.map((r) => (r.id === reservation.id ? reservation : r))
          )
          break
        }
        case 'reservation_cancelled': {
          const { id } = message.payload as { id: string }
          setReservations((prev: Reservation[]) =>
            prev.map((r) =>
              r.id === id ? { ...r, status: 'cancelled' as const } : r
            )
          )
          break
        }
      }
    },
    [setTables, setReservations]
  )

  useEffect(() => {
    if (socketRef.current?.connected) {
      return
    }

    const socket = io(SOCKET_URL, {
      path: '/ws',
      transports: ['websocket'],
      autoConnect: true,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      console.log('WebSocket connected')
      
      socket.emit('join_room', {
        room: `restaurant:${selectedDate}:${selectedShift}`,
      })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    })

    socket.on('message', handleMessage)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [selectedDate, selectedShift, handleMessage, setIsConnected])

  const emitTableUpdate = useCallback((table: Table) => {
    socketRef.current?.emit('table_update', {
      type: 'table_updated',
      payload: table,
    })
  }, [])

  const emitReservationCreated = useCallback((reservation: Reservation) => {
    socketRef.current?.emit('reservation_update', {
      type: 'reservation_created',
      payload: reservation,
    })
  }, [])

  const emitReservationUpdated = useCallback((reservation: Reservation) => {
    socketRef.current?.emit('reservation_update', {
      type: 'reservation_updated',
      payload: reservation,
    })
  }, [])

  const emitReservationCancelled = useCallback((reservationId: string) => {
    socketRef.current?.emit('reservation_update', {
      type: 'reservation_cancelled',
      payload: { id: reservationId },
    })
  }, [])

  return {
    isConnected,
    emitTableUpdate,
    emitReservationCreated,
    emitReservationUpdated,
    emitReservationCancelled,
  }
}
