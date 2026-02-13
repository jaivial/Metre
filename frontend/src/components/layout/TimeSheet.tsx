import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  Users,
  Check,
} from 'lucide-react'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAtom } from 'jotai'
import {
  selectedDateAtom,
  selectedShiftAtom,
  selectedTimeAtom,
  isSheetOpenAtom,
  reservationsAtom,
  upcomingReservationsAtom,
  seatedReservationsAtom,
} from '@/stores/atoms'
import { cn, formatTime, getShiftLabel } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/components/ui/Calendar'
import { Card } from '@/components/ui/Card'
import type { ShiftType, Reservation } from '@/types'

const shifts: { type: ShiftType; label: string; hours: string }[] = [
  { type: 'breakfast', label: 'Desayuno', hours: '08:00 - 12:00' },
  { type: 'lunch', label: 'Almuerzo', hours: '12:00 - 17:00' },
  { type: 'afternoon_snack', label: 'Merienda', hours: '17:00 - 19:00' },
  { type: 'dinner', label: 'Cena', hours: '19:00 - 23:00' },
]

const timeSlots = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00',
]

interface ReservationItemProps {
  reservation: Reservation
  onClick: () => void
}

function ReservationItem({ reservation, onClick }: ReservationItemProps) {
  const isSeated = reservation.status === 'seated'
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200',
        'hover:bg-white/10 border border-white/5',
        isSeated && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold',
          isSeated ? 'bg-gray-500/30' : 'bg-white/10'
        )}>
          {reservation.tableNumber || '-'}
        </div>
        <div>
          <p className={cn('font-medium text-white', isSeated && 'line-through')}>
            {reservation.name}
          </p>
          <p className="text-xs text-white/50">
            {reservation.guestsCount} personas • {reservation.time}
          </p>
        </div>
      </div>
      {isSeated && (
        <span className="px-2 py-1 text-xs rounded-lg bg-gray-500/30 text-white/70">
          Sentado
        </span>
      )}
    </button>
  )
}

export function TimeSheet() {
  const [isOpen, setIsOpen] = useAtom(isSheetOpenAtom)
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom)
  const [selectedShift, setSelectedShift] = useAtom(selectedShiftAtom)
  const [selectedTime, setSelectedTime] = useAtom(selectedTimeAtom)
  const [upcomingReservations] = useAtom(upcomingReservationsAtom)
  const [seatedReservations] = useAtom(seatedReservationsAtom)

  const currentDate = useMemo(() => new Date(selectedDate), [selectedDate])

  const filteredReservations = useMemo(() => {
    return upcomingReservations.filter(
      (r) => r.date === selectedDate && r.shift === selectedShift
    )
  }, [upcomingReservations, selectedDate, selectedShift])

  const seatedForShift = useMemo(() => {
    return seatedReservations.filter(
      (r) => r.date === selectedDate && r.shift === selectedShift
    )
  }, [seatedReservations, selectedDate, selectedShift])

  const currentShiftHours = shifts.find((s) => s.type === selectedShift)?.hours || ''

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        className="fixed top-4 right-4 z-50 h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-dark/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-hidden"
            >
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    {format(currentDate, 'EEEE, d MMMM', { locale: es })}
                  </h2>
                  
                  <div className="calendar-wrapper">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => date && setSelectedDate(format(date, 'yyyy-MM-dd'))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-6 border-b border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-3">Turno</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {shifts.map((shift) => (
                      <button
                        key={shift.type}
                        onClick={() => setSelectedShift(shift.type)}
                        className={cn(
                          'p-3 rounded-xl text-left transition-all duration-200 border',
                          selectedShift === shift.type
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        )}
                      >
                        <p className="font-medium text-sm">{shift.label}</p>
                        <p className="text-xs text-white/50">{shift.hours}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-b border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-3">Hora</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.slice(0, 12).map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'p-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                          selectedTime === time
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        )}
                      >
                        {formatTime(time)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-white/70 mb-3">
                      Próximas ({filteredReservations.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredReservations.length === 0 ? (
                        <p className="text-sm text-white/40 text-center py-4">
                          No hay reservas para este turno
                        </p>
                      ) : (
                        filteredReservations.map((res) => (
                          <ReservationItem
                            key={res.id}
                            reservation={res}
                            onClick={() => {}}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {seatedForShift.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-white/70 mb-3">
                        Sentados ({seatedForShift.length})
                      </h3>
                      <div className="space-y-2">
                        {seatedForShift.map((res) => (
                          <ReservationItem
                            key={res.id}
                            reservation={res}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
