import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} ${formatTime(time)}`
}

export function getShiftLabel(shift: string): string {
  const labels: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    afternoon_snack: 'Merienda',
    dinner: 'Cena',
  }
  return labels[shift] || shift
}

export function getShiftTimeRange(shift: string): { start: string; end: string } {
  const ranges: Record<string, { start: string; end: string }> = {
    breakfast: { start: '08:00', end: '12:00' },
    lunch: { start: '12:00', end: '17:00' },
    afternoon_snack: { start: '17:00', end: '19:00' },
    dinner: { start: '19:00', end: '23:00' },
  }
  return ranges[shift] || { start: '00:00', end: '23:59' }
}

export function getTableCapacityLabel(capacity: number): string {
  if (capacity === 1) return '1 persona'
  return `${capacity} personas`
}

export function generateTimeSlots(start: string, end: string, interval: number = 30): string[] {
  const slots: string[] = []
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)

  let currentHour = startHour
  let currentMin = startMin

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`)
    currentMin += interval
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return slots
}

export function calculateTableSize(shape: 'round' | 'square', capacity: number): { width: number; height: number } {
  const baseSize = 80
  const sizePerPerson = 15
  
  if (shape === 'round') {
    const radius = Math.min(baseSize + (capacity - 1) * sizePerPerson, 150)
    return { width: radius * 2, height: radius * 2 }
  }
  
  const size = baseSize + (capacity - 1) * sizePerPerson
  return { width: size, height: size }
}

export function isWithinBounds(x: number, y: number, width: number, height: number, canvasWidth: number, canvasHeight: number): boolean {
  return x >= 0 && y >= 0 && x + width <= canvasWidth && y + height <= canvasHeight
}

export function areTablesOverlapping(
  table1: { x: number; y: number; width: number; height: number },
  table2: { x: number; y: number; width: number; height: number },
  threshold: number = 20
): boolean {
  return (
    Math.abs(table1.x - table2.x) < (table1.width + table2.width) / 2 + threshold &&
    Math.abs(table1.y - table2.y) < (table1.height + table2.height) / 2 + threshold
  )
}

export function getRandomColor(): string {
  const colors = [
    'rgba(59, 130, 246, 0.3)',
    'rgba(168, 85, 247, 0.3)',
    'rgba(236, 72, 153, 0.3)',
    'rgba(34, 197, 94, 0.3)',
    'rgba(251, 191, 36, 0.3)',
    'rgba(249, 115, 22, 0.3)',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
