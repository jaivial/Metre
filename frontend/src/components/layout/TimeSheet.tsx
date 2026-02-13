import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  X,
  ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAtom } from 'jotai'
import {
  selectedDateAtom,
  selectedShiftAtom,
  selectedTimeAtom,
  isSheetOpenAtom,
  upcomingReservationsAtom,
  seatedReservationsAtom,
} from '@/stores/atoms'
import { cn, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/components/ui/Calendar'
import type { ShiftType, Reservation } from '@/types'
import { useMediaQuery } from '@/hooks/useMediaQuery'

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
        'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200',
        'hover:bg-white/10 border border-white/5',
        isSeated && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold',
          isSeated ? 'bg-gray-500/30' : 'bg-white/10'
        )}>
          {reservation.tableNumber || '-'}
        </div>
        <div>
          <p className={cn('font-medium text-white text-sm', isSeated && 'line-through')}>
            {reservation.name}
          </p>
          <p className="text-[10px] text-white/50">
            {reservation.guestsCount}p • {reservation.time}
          </p>
        </div>
      </div>
      {isSeated && (
        <span className="px-1.5 py-0.5 text-[10px] rounded-lg bg-gray-500/30 text-white/70">
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
  
  const isMobile = useMediaQuery('(max-width: 768px)')

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

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        className="fixed top-4 right-4 z-50 h-11 w-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
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
              initial={isMobile ? { y: 400 } : { x: 400 }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: 400 } : { x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'fixed bg-dark/95 backdrop-blur-xl z-50 overflow-hidden',
                isMobile 
                  ? 'bottom-0 left-0 right-0 h-screen rounded-none border-t-0'
                  : 'top-0 right-0 h-full w-full max-w-sm border-l border-white/10'
              )}
            >
              <div className="flex flex-col h-full">
                <div className={cn(
                  'flex items-center justify-between border-b border-white/10',
                  isMobile ? 'p-3' : 'p-4'
                )}>
                  <h2 className="text-base font-semibold text-white">
                    {format(currentDate, 'EEEE, d MMMM', { locale: es })}
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10"
                  >
                    <X className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                  </button>
                </div>

                {isMobile && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center py-2"
                  >
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </button>
                )}

                <div className={cn('flex-1 overflow-y-auto', isMobile ? 'p-3' : 'p-4')}>
                  <div className={cn('calendar-wrapper mb-4', isMobile && '!mb-3')}>
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => date && setSelectedDate(format(date, 'yyyy-MM-dd'))}
                      className="rounded-xl text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-white/70 mb-2">Turno</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {shifts.map((shift) => (
                        <button
                          key={shift.type}
                          onClick={() => setSelectedShift(shift.type)}
                          className={cn(
                            'p-2 rounded-xl text-left transition-all duration-200 border text-xs',
                            selectedShift === shift.type
                              ? 'bg-white/20 border-white/30 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          )}
                        >
                          <p className="font-medium">{shift.label}</p>
                          <p className="text-[10px] text-white/50">{shift.hours}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-white/70 mb-2">Hora</h3>
                    <div className="grid grid-cols-4 gap-1">
                      {timeSlots.slice(0, 8).map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            'p-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
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

                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-white/70 mb-2">
                      Próximas ({filteredReservations.length})
                    </h3>
                    <div className="space-y-1.5">
                      {filteredReservations.length === 0 ? (
                        <p className="text-xs text-white/40 text-center py-3">
                          No hay reservas
                        </p>
                      ) : (
                        filteredReservations.slice(0, 5).map((res) => (
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
                      <h3 className="text-xs font-medium text-white/70 mb-2">
                        Sentados ({seatedForShift.length})
                      </h3>
                      <div className="space-y-1.5">
                        {seatedForShift.slice(0, 3).map((res) => (
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
