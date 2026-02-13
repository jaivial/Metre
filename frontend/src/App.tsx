import { useEffect, useMemo, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  Eye,
  Edit3,
  Menu,
  Users,
  Clock,
  Plus,
  X,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TimeSheet } from '@/components/layout/TimeSheet'
import { TableCanvas } from '@/components/features/TableCanvas'
import { ReservationForm } from '@/components/features/ReservationForm'
import { Button } from '@/components/ui/Button'
import {
  tablesAtom,
  selectedDateAtom,
  selectedShiftAtom,
  isSidebarOpenAtom,
  isSheetOpenAtom,
  viewModeAtom,
  selectedTableIdAtom,
  selectedTableAtom,
  reservationsAtom,
} from '@/stores/atoms'
import { cn, getShiftLabel } from '@/lib/utils'
import type { Table, Reservation, ShiftType } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function generateMockTables(): Table[] {
  return [
    { id: '1', number: 1, shape: 'round', capacity: 4, x: 100, y: 100, width: 100, height: 100, status: 'free' },
    { id: '2', number: 2, shape: 'round', capacity: 4, x: 250, y: 100, width: 100, height: 100, status: 'occupied' },
    { id: '3', number: 3, shape: 'square', capacity: 6, x: 400, y: 100, width: 120, height: 120, status: 'free' },
    { id: '4', number: 4, shape: 'square', capacity: 8, x: 100, y: 250, width: 140, height: 140, status: 'reserved' },
    { id: '5', number: 5, shape: 'round', capacity: 2, x: 300, y: 280, width: 70, height: 70, status: 'free' },
    { id: '6', number: 6, shape: 'square', capacity: 4, x: 450, y: 280, width: 100, height: 100, status: 'occupied' },
    { id: '7', number: 7, shape: 'round', capacity: 10, x: 150, y: 450, width: 160, height: 160, status: 'free' },
    { id: '8', number: 8, shape: 'square', capacity: 4, x: 380, y: 480, width: 100, height: 100, status: 'free' },
  ]
}

function generateMockReservations(): Reservation[] {
  const today = format(new Date(), 'yyyy-MM-dd')
  return [
    {
      id: 'r1',
      name: 'Juan García',
      email: 'juan@email.com',
      phone: '+34 612 345 678',
      date: today,
      time: '13:00',
      shift: 'lunch' as ShiftType,
      guestsCount: 4,
      tableId: '2',
      tableNumber: 2,
      status: 'confirmed',
      comments: 'Alergia a frutos secos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r2',
      name: 'María López',
      email: 'maria@email.com',
      phone: '+34 687 654 321',
      date: today,
      time: '20:30',
      shift: 'dinner' as ShiftType,
      guestsCount: 6,
      tableId: '3',
      tableNumber: 3,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r3',
      name: 'Carlos Martínez',
      email: 'carlos@email.com',
      phone: '+34 654 987 321',
      date: today,
      time: '21:00',
      shift: 'dinner' as ShiftType,
      guestsCount: 2,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r4',
      name: 'Ana Rodríguez',
      email: 'ana@email.com',
      phone: '+34 678 123 456',
      date: today,
      time: '14:00',
      shift: 'lunch' as ShiftType,
      guestsCount: 4,
      tableId: '6',
      tableNumber: 6,
      status: 'seated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

export default function App() {
  const [tables, setTables] = useAtom(tablesAtom)
  const [reservations, setReservations] = useAtom(reservationsAtom)
  const [selectedDate] = useAtom(selectedDateAtom)
  const [selectedShift] = useAtom(selectedShiftAtom)
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom)
  const [, setIsSheetOpen] = useAtom(isSheetOpenAtom)
  const [viewMode, setViewMode] = useAtom(viewModeAtom)
  const [selectedTableId, setSelectedTableId] = useAtom(selectedTableIdAtom)
  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false)

  useEffect(() => {
    setTables(generateMockTables())
    setReservations(generateMockReservations())
  }, [setTables, setReservations])

  const selectedTable = useAtomValue(selectedTableAtom)

  const upcomingCount = useMemo(() => {
    return reservations.filter(
      (r) => r.status !== 'completed' && r.status !== 'cancelled'
    ).length
  }, [reservations])

  const seatedCount = useMemo(() => {
    return reservations.filter((r) => r.status === 'seated').length
  }, [reservations])

  const freeTablesCount = useMemo(() => {
    return tables.filter((t) => t.status === 'free').length
  }, [tables])

  return (
    <div className="h-screen w-screen overflow-hidden bg-dark relative">
      <Sidebar />
      <TimeSheet />

      <div className="h-full pl-4 pr-4 relative">
        <header className="hidden xl:flex h-16 items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[1.8rem] text-white/80 transition-colors active:text-white"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-xl font-semibold text-white">
              {format(new Date(selectedDate), 'EEEE, d MMMM', { locale: es })}
            </h1>
            <span className="px-3 py-1 rounded-lg bg-white/10 text-sm text-white/70">
              {getShiftLabel(selectedShift)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <LayoutGrid className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white">{freeTablesCount} libres</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Clock className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white">{upcomingCount} reservas</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Users className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white">{seatedCount} sentados</span>
            </div>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button
                onClick={() => setViewMode('edit')}
                className={cn(
                  'px-4 py-2 flex items-center gap-2 transition-all',
                  viewMode === 'edit'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                )}
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-sm">Editar</span>
              </button>
              <button
                onClick={() => setViewMode('view')}
                className={cn(
                  'px-4 py-2 flex items-center gap-2 transition-all',
                  viewMode === 'view'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                )}
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">Ver</span>
              </button>
            </div>

            <Button onClick={() => setIsReservationFormOpen(true)} className="ml-2">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>

            <button
              type="button"
              aria-label="Calendario"
              onClick={() => setIsSheetOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-[1.8rem] text-white/80 transition-colors active:text-white"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="h-screen xl:h-[calc(100vh-64px)]">
          <TableCanvas className="h-full" />
        </main>
      </div>

      <AnimatePresence>
        {selectedTable && viewMode === 'view' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 p-4 bg-dark/95 backdrop-blur-xl rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{selectedTable.number}</p>
                <p className="text-xs text-white/50">Mesa</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{selectedTable.capacity}</p>
                <p className="text-xs text-white/50">Capacidad</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className={cn(
                  'text-lg font-semibold',
                  selectedTable.status === 'free' && 'text-green-400',
                  selectedTable.status === 'occupied' && 'text-gray-400',
                  selectedTable.status === 'reserved' && 'text-yellow-400'
                )}>
                  {selectedTable.status === 'free' && 'Libre'}
                  {selectedTable.status === 'occupied' && 'Ocupada'}
                  {selectedTable.status === 'reserved' && 'Reservada'}
                </p>
                <p className="text-xs text-white/50">Estado</p>
              </div>
              {selectedTable.status === 'free' && (
                <>
                  <div className="h-10 w-px bg-white/10" />
                  <Button onClick={() => setIsReservationFormOpen(true)}>
                    Asignar Reserva
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReservationForm
        isOpen={isReservationFormOpen}
        onClose={() => setIsReservationFormOpen(false)}
      />
    </div>
  )
}
