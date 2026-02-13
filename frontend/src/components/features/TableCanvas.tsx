import { useMemo, useCallback, useState } from 'react'
import { Rnd } from 'react-rnd'
import { useAtom, useAtomValue } from 'jotai'
import {
  tablesAtom,
  selectedTableIdAtom,
  viewModeAtom,
  statusFilterAtom,
  filteredTablesAtom,
} from '@/stores/atoms'
import { cn, calculateTableSize } from '@/lib/utils'
import type { Table, TableShape } from '@/types'
import { Users, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TableComponentProps {
  table: Table
  isSelected: boolean
  onSelect: (id: string) => void
  onPositionChange: (id: string, x: number, y: number) => void
  onResize: (id: string, width: number, height: number) => void
  viewMode: 'edit' | 'view'
}

function TableComponent({
  table,
  isSelected,
  onSelect,
  onPositionChange,
  onResize,
  viewMode,
}: TableComponentProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStop = useCallback(
    (_: unknown, d: { x: number; y: number }) => {
      onPositionChange(table.id, d.x, d.y)
    },
    [table.id, onPositionChange]
  )

  const handleResizeStop = useCallback(
    (_: unknown, __: unknown, ___: unknown, deltaP: { width: number; height: number }) => {
      const newWidth = table.width + deltaP.width
      const newHeight = table.height + deltaP.height
      onResize(table.id, Math.max(60, newWidth), Math.max(60, newHeight))
    },
    [table.id, table.width, table.height, onResize]
  )

  const statusColors = {
    free: 'bg-green-500/20 border-green-500/40',
    occupied: 'bg-gray-500/30 border-gray-500/50',
    reserved: 'bg-yellow-500/20 border-yellow-500/40',
  }

  return (
    <Rnd
      size={{ width: table.width, height: table.height }}
      position={{ x: table.x, y: table.y }}
      onDragStart={() => setIsDragging(true)}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      disableDragging={viewMode === 'view'}
      enableResizing={viewMode === 'edit'}
      bounds="parent"
      minWidth={60}
      minHeight={60}
      className={cn(
        'transition-all duration-200 border-2 cursor-pointer',
        statusColors[table.status],
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-dark',
        isDragging && 'opacity-80 scale-105 z-50'
      )}
      style={{
        touchAction: 'none',
      }}
      onClick={() => onSelect(table.id)}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{table.number}</span>
        <div className="flex items-center gap-1 text-white/70 text-xs">
          <Users className="w-3 h-3" />
          <span>{table.capacity}</span>
        </div>
      </div>
    </Rnd>
  )
}

interface TableCanvasProps {
  className?: string
}

export function TableCanvas({ className }: TableCanvasProps) {
  const [tables, setTables] = useAtom(tablesAtom)
  const [selectedTableId, setSelectedTableId] = useAtom(selectedTableIdAtom)
  const [viewMode] = useAtom(viewModeAtom)
  const [, setStatusFilter] = useAtom(statusFilterAtom)
  const filteredTables = useAtomValue(filteredTablesAtom)

  const [showAddMenu, setShowAddMenu] = useState(false)

  const displayedTables = useMemo(() => {
    return tables
  }, [tables, filteredTables])

  const handleSelectTable = useCallback(
    (id: string) => {
      setSelectedTableId(selectedTableId === id ? null : id)
    },
    [selectedTableId, setSelectedTableId]
  )

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setTables((prev: Table[]) =>
        prev.map((t) => (t.id === id ? { ...t, x, y } : t))
      )
    },
    [setTables]
  )

  const handleResize = useCallback(
    (id: string, width: number, height: number) => {
      const avgSize = (width + height) / 2
      const newCapacity = Math.max(1, Math.round((avgSize - 60) / 15) + 1)
      setTables((prev: Table[]) =>
        prev.map((t) =>
          t.id === id ? { ...t, width, height, capacity: Math.min(newCapacity, 10) } : t
        )
      )
    },
    [setTables]
  )

  const addTable = useCallback(
    (shape: TableShape) => {
      const newNumber = Math.max(0, ...tables.map((t) => t.number)) + 1
      const size = calculateTableSize(shape, 4)
      const newTable: Table = {
        id: crypto.randomUUID(),
        number: newNumber,
        shape,
        capacity: 4,
        x: 50 + Math.random() * 200,
        y: 50 + Math.random() * 200,
        width: shape === 'round' ? size.width : size.width,
        height: shape === 'round' ? size.height : size.height,
        status: 'free',
      }
      setTables((prev: Table[]) => [...prev, newTable])
      setShowAddMenu(false)
    },
    [tables, setTables]
  )

  const deleteTable = useCallback(
    (id: string) => {
      setTables((prev: Table[]) => prev.filter((t) => t.id !== id))
      if (selectedTableId === id) {
        setSelectedTableId(null)
      }
    },
    [selectedTableId, setTables, setSelectedTableId]
  )

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId),
    [tables, selectedTableId]
  )

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      <div
        className="absolute inset-4 rounded-2xl border border-white/10 bg-dark/50 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        {displayedTables.map((table) => (
          <TableComponent
            key={table.id}
            table={table}
            isSelected={selectedTableId === table.id}
            onSelect={handleSelectTable}
            onPositionChange={handlePositionChange}
            onResize={handleResize}
            viewMode={viewMode}
          />
        ))}
      </div>

      {viewMode === 'edit' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="relative">
            <Button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="h-14 px-6 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Añadir Mesa
            </Button>

            {showAddMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-dark/95 backdrop-blur-xl rounded-xl border border-white/10">
                <Button
                  variant="secondary"
                  onClick={() => addTable('round')}
                  className="rounded-xl"
                >
                  Redonda
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => addTable('square')}
                  className="rounded-xl"
                >
                  Cuadrada
                </Button>
              </div>
            )}
          </div>

          {selectedTable && (
            <Button
              variant="destructive"
              onClick={() => deleteTable(selectedTable.id)}
              className="h-14 px-6 rounded-xl"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-dark/80 backdrop-blur-xl rounded-xl p-2 border border-white/10">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            'bg-white/20 text-white'
          )}
        >
          Todas
        </button>
        <button
          onClick={() => setStatusFilter('free')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          Libres
        </button>
        <button
          onClick={() => setStatusFilter('occupied')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          Ocupadas
        </button>
      </div>
    </div>
  )
}
