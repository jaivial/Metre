import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  LayoutGrid,
  Calendar,
  Settings,
  Users,
  Clock,
  ChefHat,
  X,
  ChevronLeft,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAtom } from 'jotai'
import { isSidebarOpenAtom, tablesAtom, viewModeAtom, isAddTableModalOpenAtom, editingTableIdAtom, canvasLimitsAtom } from '@/stores/atoms'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TableConfigModal } from '@/components/ui/TableConfigModal'
import type { TableShape } from '@/types'
import { calculateTableSize } from '@/lib/utils'
import { clamp, pointInPolygon, rectCorners } from '@/lib/geometry'

const TABLE_SIZES = [
  { label: 'Pequeña', scale: 0.7 },
  { label: 'Mediana', scale: 1 },
  { label: 'Grande', scale: 1.3 },
  { label: 'Extra Grande', scale: 1.6 },
  { label: 'Gigante', scale: 2 },
]

interface SidebarProps {
  children?: React.ReactNode
}

const menuItems = [
  { icon: LayoutGrid, label: 'Mesas', id: 'tables' },
  { icon: Calendar, label: 'Reservas', id: 'reservations' },
  { icon: Clock, label: 'Horarios', id: 'schedule' },
  { icon: Users, label: 'Clientes', id: 'clients' },
  { icon: ChefHat, label: 'Menú', id: 'menu' },
  { icon: Settings, label: 'Ajustes', id: 'settings' },
]

export function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom)
  const [tables, setTables] = useAtom(tablesAtom)
  const [, setViewMode] = useAtom(viewModeAtom)
  const [, setShowConfigModal] = useAtom(isAddTableModalOpenAtom)
  const [editingTableId, setEditingTableId] = useAtom(editingTableIdAtom)
  const [limits] = useAtom(canvasLimitsAtom)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const existingNumbers = tables.map(t => t.number.toString())

  const editingTable = editingTableId ? tables.find(t => t.id === editingTableId) : null

  const handleAddTable = (config: {
    shape: TableShape
    number: string
    capacity: number
    sizeIndex: number
    colorIndex: number
  }) => {
    const size = calculateTableSize(config.shape, config.capacity)
    const scale = TABLE_SIZES[config.sizeIndex].scale
    const rect = limits.kind === 'rect' ? limits.rect : null
    const newTable = {
      id: crypto.randomUUID(),
      number: config.number,
      shape: config.shape,
      capacity: config.capacity,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
      width: Math.round(size.width * scale),
      height: Math.round(size.height * scale),
      status: 'free' as const,
    }
    if (limits.kind === 'poly' && limits.points.length >= 3) {
      const avg = limits.points.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
      )
      const centroid = { x: avg.x / limits.points.length, y: avg.y / limits.points.length }
      const corners = rectCorners({ x: centroid.x, y: centroid.y, width: newTable.width, height: newTable.height })
      if (corners.every((p) => pointInPolygon(p, limits.points))) {
        newTable.x = Math.round(centroid.x)
        newTable.y = Math.round(centroid.y)
      }
    }
    if (rect) {
      newTable.x = Math.round(clamp(newTable.x, rect.x, rect.x + rect.width - newTable.width))
      newTable.y = Math.round(clamp(newTable.y, rect.y, rect.y + rect.height - newTable.height))
    }
    setTables((prev) => [...prev, newTable])
    setViewMode('edit')
  }

  const handleEditTable = (config: {
    shape: TableShape
    number: string
    capacity: number
    sizeIndex: number
    colorIndex: number
  }) => {
    if (!editingTableId) return
    const size = calculateTableSize(config.shape, config.capacity)
    const scale = TABLE_SIZES[config.sizeIndex].scale
    setTables((prev) =>
      prev.map((t) =>
        t.id === editingTableId
          ? {
              ...t,
              number: config.number,
              shape: config.shape,
              capacity: config.capacity,
              width: Math.round(size.width * scale),
              height: Math.round(size.height * scale),
            }
          : t
      )
    )
    setEditingTableId(null)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-[60] h-11 w-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 xl:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsOpen(false)}
              />
            )}
            <motion.aside
              initial={isMobile ? { y: -400 } : { x: -280 }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: -400 } : { x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'fixed bg-dark/95 backdrop-blur-xl z-50',
                isMobile 
                  ? 'top-0 left-0 right-0 h-screen rounded-none border-b-0'
                  : 'top-0 left-0 h-full w-72 border-r border-white/10 xl:top-16 xl:h-[calc(100vh-64px)]'
              )}
            >
              <div className={cn('flex flex-col h-full', isMobile ? 'p-2' : 'p-4')}>
                <div className="flex items-center justify-between px-1 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={cn('rounded-xl bg-white/10 flex items-center justify-center', isMobile ? 'w-8 h-8' : 'w-9 h-9')}>
                      <ChefHat className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                    </div>
                    <div>
                      <h2 className={cn('font-semibold text-white', isMobile ? 'text-xs' : 'text-sm')}>Metre</h2>
                      <p className="text-[9px] text-white/50">Gestión</p>
                    </div>
                  </div>
                  {isMobile && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4 text-white/70" />
                    </button>
                  )}
                </div>

                <nav className={cn('flex-1 py-2 space-y-0.5', isMobile && 'overflow-y-auto')}>
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        'w-full flex items-center gap-2 rounded-xl transition-all duration-200',
                        isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm',
                        'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className={isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  
                    <div className="pt-2 mt-2 border-t border-white/10">
                      <button
                        className={cn(
                          'w-full flex items-center gap-2 rounded-xl transition-all duration-200',
                          isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm',
                          'text-green-400 hover:bg-green-500/10'
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowConfigModal(true)
                        }}
                      >
                        <Plus className={isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                        <span className="font-medium">Añadir Mesa</span>
                      </button>
                    </div>
                </nav>

                <div className="border-t border-white/10 pt-2">
                  <p className="px-1 text-[9px] text-white/40">Restaurant Demo</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <TableConfigModal
        onAdd={handleAddTable}
        onEdit={handleEditTable}
        existingNumbers={existingNumbers}
        editingTable={editingTable}
      />

      {children}
    </>
  )
}
