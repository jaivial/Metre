import { useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { z } from 'zod'
import {
  selectedDateAtom,
  selectedShiftAtom,
  selectedTimeAtom,
  reservationsAtom,
  tablesAtom,
  selectedTableIdAtom,
} from '@/stores/atoms'
import { formatTime, generateTimeSlots, getShiftTimeRange } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import type { Reservation } from '@/types'

const reservationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'El teléfono es requerido').max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  shift: z.enum(['breakfast', 'lunch', 'afternoon_snack', 'dinner']),
  guestsCount: z.number().int().min(1, 'Mínimo 1 persona').max(20, 'Máximo 20 personas'),
  comments: z.string().max(500).optional(),
})

interface ReservationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (reservation: Reservation) => void
  initialData?: Partial<Reservation>
}

export function ReservationForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ReservationFormProps) {
  const [selectedDate] = useAtom(selectedDateAtom)
  const [selectedShift] = useAtom(selectedShiftAtom)
  const [selectedTime] = useAtom(selectedTimeAtom)
  const [, setReservations] = useAtom(reservationsAtom)
  const [tables, setTables] = useAtom(tablesAtom)
  const [selectedTableId, setSelectedTableId] = useAtom(selectedTableIdAtom)

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    date: initialData?.date || selectedDate,
    time: initialData?.time || selectedTime,
    shift: initialData?.shift || selectedShift,
    guestsCount: initialData?.guestsCount || 2,
    comments: initialData?.comments || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const shiftRange = getShiftTimeRange(formData.shift as 'breakfast' | 'lunch' | 'afternoon_snack' | 'dinner')
  const availableTimes = generateTimeSlots(shiftRange.start, shiftRange.end, 30)

  const availableTables = tables.filter(
    (t) => t.status === 'free' && t.capacity >= formData.guestsCount
  )

  const handleChange = useCallback(
    (field: string, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }))
      }
    },
    [errors]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      setErrors({})

      try {
        const validated = reservationSchema.parse(formData)

        const newReservation: Reservation = {
          id: crypto.randomUUID(),
          name: validated.name,
          email: validated.email || '',
          phone: validated.phone,
          date: validated.date,
          time: validated.time,
          shift: validated.shift,
          guestsCount: validated.guestsCount,
          tableId: selectedTableId || undefined,
          tableNumber: selectedTableId
            ? tables.find((t) => t.id === selectedTableId)?.number
            : undefined,
          status: 'confirmed',
          comments: validated.comments,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setReservations((prev) => [...prev, newReservation])

        if (selectedTableId) {
          setTables((prev: typeof tables) =>
            prev.map((t) =>
              t.id === selectedTableId ? { ...t, status: 'reserved' as const, reservationId: newReservation.id } : t
            )
          )
        }

        onSuccess?.(newReservation)
        onClose()
        setSelectedTableId(null)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {}
          error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message
            }
          })
          setErrors(fieldErrors)
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, selectedTableId, tables, setReservations, setTables, onSuccess, onClose, setSelectedTableId]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Reserva</DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva reserva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Nombre del cliente</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nombre completo"
              error={errors.name}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Teléfono</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+34 000 000 000"
                error={errors.phone}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Email (opcional)</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@ejemplo.com"
                error={errors.email}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Fecha</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                error={errors.date}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Hora</label>
              <select
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {availableTimes.map((time) => (
                  <option key={time} value={time} className="bg-dark">
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Comensales</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.guestsCount}
                onChange={(e) => handleChange('guestsCount', parseInt(e.target.value) || 1)}
                error={errors.guestsCount}
              />
            </div>
          </div>

          {selectedTableId && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400">
                Mesa asignada: <strong>Mesa {tables.find((t) => t.id === selectedTableId)?.number}</strong>
              </p>
            </div>
          )}

          {!selectedTableId && availableTables.length > 0 && formData.guestsCount > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Seleccionar mesa</label>
              <div className="grid grid-cols-4 gap-2">
                {availableTables.slice(0, 8).map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => setSelectedTableId(table.id)}
                    className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-center"
                  >
                    <p className="font-semibold text-white">{table.number}</p>
                    <p className="text-xs text-white/50">{table.capacity}p</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Comentarios (opcional)</label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              placeholder="Notas especiales, alergias, ocasiones..."
              rows={3}
              className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Reserva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
