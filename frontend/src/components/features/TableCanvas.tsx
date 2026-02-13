import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  NodeProps,
  BackgroundVariant,
  ConnectionMode,
  ViewportPortal,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAtom } from 'jotai'
import {
  tablesAtom,
  selectedTableIdAtom,
  viewModeAtom,
  statusFilterAtom,
  isAddTableModalOpenAtom,
  editingTableIdAtom,
  canvasObjectsAtom,
  selectedObjectIdAtom,
  isAddObjectModalOpenAtom,
  editingObjectIdAtom,
  canvasLimitsAtom,
} from '@/stores/atoms'
import { cn } from '@/lib/utils'
import type { Table, CanvasObject, CanvasLimits, CanvasObjectShape } from '@/types'
import { Trash2, Users, MoreVertical, X, Maximize2, Pencil, Plus, Lock, Unlock, Ruler, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ObjectConfigModal } from '@/components/ui/ObjectConfigModal'
import { clamp, normalizeRect, pointInPolygon, rectCorners } from '@/lib/geometry'

interface TableNodeData extends Record<string, unknown> {
  table: Table
  isSelected: boolean
  viewMode: 'edit' | 'view'
}

interface ObjectNodeData extends Record<string, unknown> {
  object: CanvasObject
  isSelected: boolean
  viewMode: 'edit' | 'view'
}

type CanvasNodeData = TableNodeData | ObjectNodeData

type ResizeHandle = 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' | 'radius'

function TableNode({ data, selected }: NodeProps<Node<TableNodeData>>) {
  const { table, viewMode } = data
  const [, setShowAddTableModal] = useAtom(isAddTableModalOpenAtom)
  const [, setEditingTableId] = useAtom(editingTableIdAtom)
  const [, setTables] = useAtom(tablesAtom)
  const [selectedTableId, setSelectedTableId] = useAtom(selectedTableIdAtom)
  const [limits] = useAtom(canvasLimitsAtom)
  
  const [showMenu, setShowMenu] = useState(false)
  const [isResizeMode, setIsResizeMode] = useState(false)
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null)
  const resizeSessionRef = useRef<{
    pointerId: number
    handle: ResizeHandle
    startClientX: number
    startClientY: number
    startWidth: number
    startHeight: number
    startTableX: number
    startTableY: number
  } | null>(null)
  
  const statusColors = {
    free: 'bg-green-500/30 border-green-500/50',
    occupied: 'bg-gray-500/40 border-gray-500/60',
    reserved: 'bg-yellow-500/30 border-yellow-500/50',
  }

  const baseClasses =
    'rounded-xl border-2 flex items-center justify-center relative transition-[box-shadow,background-color,border-color] duration-200'
  
  const size = table.shape === 'round' 
    ? { width: table.width, height: table.height }
    : { width: table.width, height: table.height }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTableId(table.id)
    setShowAddTableModal(true)
    setShowMenu(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTables((prev: Table[]) => prev.filter((t) => t.id !== table.id))
    if (selectedTableId === table.id) {
      setSelectedTableId(null)
    }
    setShowMenu(false)
  }

  useEffect(() => {
    if (!activeResizeHandle) return

    const MIN_SIZE = 60
    const rect = limits.kind === 'rect' ? limits.rect : null

    const handlePointerMove = (e: PointerEvent) => {
      const session = resizeSessionRef.current
      if (!session) return
      if (e.pointerId !== session.pointerId) return

      const deltaX = e.clientX - session.startClientX
      const deltaY = e.clientY - session.startClientY

      if (table.shape === 'round') {
        const startDiameter = session.startWidth
        const startRadius = startDiameter / 2
        const nextRadius = Math.max(MIN_SIZE / 2, startRadius + deltaY)
        let nextDiameter = Math.round(nextRadius * 2)
        if (rect) {
          nextDiameter = Math.min(nextDiameter, Math.round(Math.min(rect.width, rect.height)))
        }

        const startCenterX = session.startTableX + startDiameter / 2
        const startCenterY = session.startTableY + startDiameter / 2

        const nextX = Math.round(startCenterX - nextDiameter / 2)
        const nextY = Math.round(startCenterY - nextDiameter / 2)
        const clamped = rect
          ? {
              x: Math.round(clamp(nextX, rect.x, rect.x + rect.width - nextDiameter)),
              y: Math.round(clamp(nextY, rect.y, rect.y + rect.height - nextDiameter)),
            }
          : { x: nextX, y: nextY }

        setTables((prev: Table[]) =>
          prev.map((t) =>
            t.id === table.id
              ? { ...t, x: clamped.x, y: clamped.y, width: nextDiameter, height: nextDiameter }
              : t
          )
        )
        return
      }

      let nextWidth = session.startWidth
      let nextHeight = session.startHeight

      if (session.handle === 'corner-br') {
        nextWidth = session.startWidth + deltaX
        nextHeight = session.startHeight + deltaY
      } else if (session.handle === 'corner-bl') {
        nextWidth = session.startWidth - deltaX
        nextHeight = session.startHeight + deltaY
      } else if (session.handle === 'corner-tr') {
        nextWidth = session.startWidth + deltaX
        nextHeight = session.startHeight - deltaY
      } else if (session.handle === 'corner-tl') {
        nextWidth = session.startWidth - deltaX
        nextHeight = session.startHeight - deltaY
      }

      nextWidth = Math.round(Math.max(MIN_SIZE, nextWidth))
      nextHeight = Math.round(Math.max(MIN_SIZE, nextHeight))
      if (rect) {
        nextWidth = Math.min(nextWidth, Math.round(rect.width))
        nextHeight = Math.min(nextHeight, Math.round(rect.height))
      }

      let nextX = session.startTableX
      let nextY = session.startTableY

      if (session.handle === 'corner-bl' || session.handle === 'corner-tl') {
        nextX = Math.round(session.startTableX + (session.startWidth - nextWidth))
      }
      if (session.handle === 'corner-tr' || session.handle === 'corner-tl') {
        nextY = Math.round(session.startTableY + (session.startHeight - nextHeight))
      }

      const clamped = rect
        ? {
            x: Math.round(clamp(nextX, rect.x, rect.x + rect.width - nextWidth)),
            y: Math.round(clamp(nextY, rect.y, rect.y + rect.height - nextHeight)),
          }
        : { x: nextX, y: nextY }

      setTables((prev: Table[]) =>
        prev.map((t) =>
          t.id === table.id ? { ...t, x: clamped.x, y: clamped.y, width: nextWidth, height: nextHeight } : t
        )
      )
    }

    const handlePointerUp = (e: PointerEvent) => {
      const session = resizeSessionRef.current
      if (!session) return
      if (e.pointerId !== session.pointerId) return
      resizeSessionRef.current = null
      setActiveResizeHandle(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [activeResizeHandle, limits, setTables, table.id, table.shape])

  useEffect(() => {
    if (!showMenu) return
    
    const handleClickOutside = () => setShowMenu(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (!selected) {
      setShowMenu(false)
      setIsResizeMode(false)
      setActiveResizeHandle(null)
      resizeSessionRef.current = null
    }
  }, [selected])

  const startResize = (e: React.PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    e.stopPropagation()
    e.preventDefault()
    if (!isResizeMode || viewMode !== 'edit') return

    e.currentTarget.setPointerCapture(e.pointerId)
    resizeSessionRef.current = {
      pointerId: e.pointerId,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: table.width,
      startHeight: table.height,
      startTableX: table.x,
      startTableY: table.y,
    }
    setActiveResizeHandle(handle)
  }

  const handleBaseClasses =
    'nodrag nopan absolute w-3 h-3 bg-dark border-2 border-white/80 rounded-xl z-20 touch-none'

  return (
    <div
      className={cn(
        baseClasses,
        statusColors[table.status],
        selected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-dark',
        table.shape === 'round' && 'rounded-full',
        isResizeMode && 'nodrag'
      )}
      style={{
        width: size.width,
        height: size.height,
        minWidth: 60,
        minHeight: 60,
      }}
    >
      <div className="text-center">
        <span className="text-sm font-bold text-white block">{table.number}</span>
        <div className="flex items-center gap-1 justify-center">
          <Users className="w-3 h-3 text-white/70" />
          <span className="text-xs text-white/70">{table.capacity}</span>
        </div>
      </div>
      
      {selected && viewMode === 'edit' && (
        <div className="absolute -top-3 -right-3 flex items-center gap-1 z-20 nodrag nopan">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1.5 rounded-xl bg-dark/90 border border-white/20 shadow-lg transition-colors active:bg-white/20"
          >
            <MoreVertical className="w-3 h-3 text-white" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
              setIsResizeMode((prev) => !prev)
            }}
            aria-pressed={isResizeMode}
            className={cn(
              'p-1.5 rounded-xl bg-dark/90 border border-white/20 shadow-lg transition-colors active:bg-white/20',
              isResizeMode && 'bg-white/20'
            )}
          >
            <Maximize2 className="w-3 h-3 text-white" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-full mt-1 right-0 p-1.5 bg-dark/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl z-50 min-w-[120px]"
              >
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs text-white/80 transition-colors active:bg-white/10 active:text-white"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="mt-1 w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs text-red-300 transition-colors active:bg-red-500/10 active:text-red-200"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {selected && viewMode === 'edit' && isResizeMode && table.shape !== 'round' && (
        <>
          <div
            className={cn(handleBaseClasses, '-top-1.5 -left-1.5')}
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-tl')}
          />
          <div
            className={cn(handleBaseClasses, '-top-1.5 -right-1.5')}
            style={{ cursor: 'nesw-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-tr')}
          />
          <div
            className={cn(handleBaseClasses, '-bottom-1.5 -left-1.5')}
            style={{ cursor: 'nesw-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-bl')}
          />
          <div
            className={cn(handleBaseClasses, '-bottom-1.5 -right-1.5')}
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-br')}
          />
        </>
      )}
      
      {selected && viewMode === 'edit' && isResizeMode && table.shape === 'round' && (
        <div
          className={cn(handleBaseClasses, '-bottom-1.5 left-1/2 -translate-x-1/2')}
          style={{ cursor: 'ns-resize' }}
          onPointerDown={(e) => startResize(e, 'radius')}
        />
      )}
    </div>
  )
}

function ObjectNode({ data, selected }: NodeProps<Node<ObjectNodeData>>) {
  const { object, viewMode } = data
  const [, setObjects] = useAtom(canvasObjectsAtom)
  const [selectedObjectId, setSelectedObjectId] = useAtom(selectedObjectIdAtom)
  const [, setEditingObjectId] = useAtom(editingObjectIdAtom)
  const [, setShowObjectModal] = useAtom(isAddObjectModalOpenAtom)
  const [limits] = useAtom(canvasLimitsAtom)

  const [showMenu, setShowMenu] = useState(false)
  const [isResizeMode, setIsResizeMode] = useState(false)
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null)
  const resizeSessionRef = useRef<{
    pointerId: number
    handle: ResizeHandle
    startClientX: number
    startClientY: number
    startWidth: number
    startHeight: number
    startX: number
    startY: number
  } | null>(null)

  const rect = limits.kind === 'rect' ? limits.rect : null

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    setObjects((prev) =>
      prev.map((o) =>
        o.id === object.id
          ? { ...o, locked: !o.locked }
          : o
      )
    )
    if (!object.locked) {
      setShowMenu(false)
      setIsResizeMode(false)
      setActiveResizeHandle(null)
      resizeSessionRef.current = null
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingObjectId(object.id)
    setShowObjectModal(true)
    setShowMenu(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setObjects((prev) => prev.filter((o) => o.id !== object.id))
    if (selectedObjectId === object.id) setSelectedObjectId(null)
    setShowMenu(false)
  }

  useEffect(() => {
    if (!activeResizeHandle) return

    const MIN_SIZE = 40

    const handlePointerMove = (e: PointerEvent) => {
      const session = resizeSessionRef.current
      if (!session) return
      if (e.pointerId !== session.pointerId) return

      const deltaX = e.clientX - session.startClientX
      const deltaY = e.clientY - session.startClientY

      if (object.shape === 'round') {
        const startDiameter = session.startWidth
        const startRadius = startDiameter / 2
        const nextRadius = Math.max(MIN_SIZE / 2, startRadius + deltaY)
        let nextDiameter = Math.round(nextRadius * 2)
        if (rect) nextDiameter = Math.min(nextDiameter, Math.round(Math.min(rect.width, rect.height)))

        const startCenterX = session.startX + startDiameter / 2
        const startCenterY = session.startY + startDiameter / 2
        const nextX = Math.round(startCenterX - nextDiameter / 2)
        const nextY = Math.round(startCenterY - nextDiameter / 2)

        const clamped = rect
          ? {
              x: Math.round(clamp(nextX, rect.x, rect.x + rect.width - nextDiameter)),
              y: Math.round(clamp(nextY, rect.y, rect.y + rect.height - nextDiameter)),
            }
          : { x: nextX, y: nextY }

        setObjects((prev) =>
          prev.map((o) =>
            o.id === object.id ? { ...o, x: clamped.x, y: clamped.y, width: nextDiameter, height: nextDiameter } : o
          )
        )
        return
      }

      let nextWidth = session.startWidth
      let nextHeight = session.startHeight

      if (session.handle === 'corner-br') {
        nextWidth = session.startWidth + deltaX
        nextHeight = session.startHeight + deltaY
      } else if (session.handle === 'corner-bl') {
        nextWidth = session.startWidth - deltaX
        nextHeight = session.startHeight + deltaY
      } else if (session.handle === 'corner-tr') {
        nextWidth = session.startWidth + deltaX
        nextHeight = session.startHeight - deltaY
      } else if (session.handle === 'corner-tl') {
        nextWidth = session.startWidth - deltaX
        nextHeight = session.startHeight - deltaY
      }

      nextWidth = Math.round(Math.max(MIN_SIZE, nextWidth))
      nextHeight = Math.round(Math.max(MIN_SIZE, nextHeight))
      if (rect) {
        nextWidth = Math.min(nextWidth, Math.round(rect.width))
        nextHeight = Math.min(nextHeight, Math.round(rect.height))
      }

      let nextX = session.startX
      let nextY = session.startY

      if (session.handle === 'corner-bl' || session.handle === 'corner-tl') {
        nextX = Math.round(session.startX + (session.startWidth - nextWidth))
      }
      if (session.handle === 'corner-tr' || session.handle === 'corner-tl') {
        nextY = Math.round(session.startY + (session.startHeight - nextHeight))
      }

      const clamped = rect
        ? {
            x: Math.round(clamp(nextX, rect.x, rect.x + rect.width - nextWidth)),
            y: Math.round(clamp(nextY, rect.y, rect.y + rect.height - nextHeight)),
          }
        : { x: nextX, y: nextY }

      setObjects((prev) =>
        prev.map((o) =>
          o.id === object.id ? { ...o, x: clamped.x, y: clamped.y, width: nextWidth, height: nextHeight } : o
        )
      )
    }

    const handlePointerUp = (e: PointerEvent) => {
      const session = resizeSessionRef.current
      if (!session) return
      if (e.pointerId !== session.pointerId) return
      resizeSessionRef.current = null
      setActiveResizeHandle(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [activeResizeHandle, object.id, object.shape, rect, setObjects])

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = () => setShowMenu(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (!selected) {
      setShowMenu(false)
      setIsResizeMode(false)
      setActiveResizeHandle(null)
      resizeSessionRef.current = null
    }
  }, [selected])

  const startResize = (e: React.PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    e.stopPropagation()
    e.preventDefault()
    if (viewMode !== 'edit') return
    if (object.locked || !isResizeMode) return

    e.currentTarget.setPointerCapture(e.pointerId)
    resizeSessionRef.current = {
      pointerId: e.pointerId,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: object.width,
      startHeight: object.height,
      startX: object.x,
      startY: object.y,
    }
    setActiveResizeHandle(handle)
  }

  const baseClasses =
    'rounded-[1.8rem] border-2 flex items-center justify-center relative transition-[box-shadow,background-color,border-color] duration-200'

  const handleBaseClasses =
    'nodrag nopan absolute w-3 h-3 bg-dark border-2 border-white/80 rounded-[1.8rem] z-20 touch-none'

  return (
    <div
      className={cn(
        baseClasses,
        'bg-white/5 border-white/20',
        selected && 'ring-2 ring-white/30 ring-offset-2 ring-offset-dark',
        object.shape === 'round' && 'rounded-full'
      )}
      style={{
        width: object.width,
        height: object.height,
        minWidth: 40,
        minHeight: 40,
      }}
    >
      {selected && (
        <div className="absolute -top-3 -right-3 flex items-center gap-1 z-20 nodrag nopan">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggleLock}
            className={cn(
              'p-1.5 rounded-[1.8rem] bg-dark/90 border border-white/20 shadow-lg transition-colors',
              'active:bg-white/20'
            )}
          >
            {object.locked ? (
              <Lock className="w-3 h-3 text-white" />
            ) : (
              <Unlock className="w-3 h-3 text-white" />
            )}
          </button>

          {!object.locked && viewMode === 'edit' && (
            <>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  setIsResizeMode((prev) => !prev)
                }}
                aria-pressed={isResizeMode}
                className={cn(
                  'p-1.5 rounded-[1.8rem] bg-dark/90 border border-white/20 shadow-lg transition-colors active:bg-white/20',
                  isResizeMode && 'bg-white/20'
                )}
              >
                <Maximize2 className="w-3 h-3 text-white" />
              </button>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1.5 rounded-[1.8rem] bg-dark/90 border border-white/20 shadow-lg transition-colors active:bg-white/20"
              >
                <MoreVertical className="w-3 h-3 text-white" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-full mt-1 right-0 p-1.5 bg-dark/95 backdrop-blur-xl rounded-[1.8rem] border border-white/10 shadow-xl z-50 min-w-[120px]"
                  >
                    <button
                      onClick={handleEditClick}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[1.8rem] text-xs text-white/80 transition-colors active:bg-white/10 active:text-white"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="mt-1 w-full flex items-center gap-2 px-2 py-1.5 rounded-[1.8rem] text-xs text-red-300 transition-colors active:bg-red-500/10 active:text-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      {selected && viewMode === 'edit' && isResizeMode && !object.locked && object.shape !== 'round' && (
        <>
          <div
            className={cn(handleBaseClasses, '-top-1.5 -left-1.5')}
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-tl')}
          />
          <div
            className={cn(handleBaseClasses, '-top-1.5 -right-1.5')}
            style={{ cursor: 'nesw-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-tr')}
          />
          <div
            className={cn(handleBaseClasses, '-bottom-1.5 -left-1.5')}
            style={{ cursor: 'nesw-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-bl')}
          />
          <div
            className={cn(handleBaseClasses, '-bottom-1.5 -right-1.5')}
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={(e) => startResize(e, 'corner-br')}
          />
        </>
      )}

      {selected && viewMode === 'edit' && isResizeMode && !object.locked && object.shape === 'round' && (
        <div
          className={cn(handleBaseClasses, '-bottom-1.5 left-1/2 -translate-x-1/2')}
          style={{ cursor: 'ns-resize' }}
          onPointerDown={(e) => startResize(e, 'radius')}
        />
      )}
    </div>
  )
}

interface TableCanvasProps {
  className?: string
}

export function TableCanvas({ className }: TableCanvasProps) {
  const [tables, setTables] = useAtom(tablesAtom)
  const [objects, setObjects] = useAtom(canvasObjectsAtom)
  
  const [selectedTableId, setSelectedTableId] = useAtom(selectedTableIdAtom)
  const [selectedObjectId, setSelectedObjectId] = useAtom(selectedObjectIdAtom)
  const [viewMode] = useAtom(viewModeAtom)
  const [, setStatusFilter] = useAtom(statusFilterAtom)
  const [, setShowAddTableModal] = useAtom(isAddTableModalOpenAtom)
  const [, setEditingTableId] = useAtom(editingTableIdAtom)
  const [, setShowObjectModal] = useAtom(isAddObjectModalOpenAtom)
  const [editingObjectId, setEditingObjectId] = useAtom(editingObjectIdAtom)
  const [limits, setLimits] = useAtom(canvasLimitsAtom)
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const [showFiltersMenu, setShowFiltersMenu] = useState(false)
  const [showLimitsMenu, setShowLimitsMenu] = useState(false)
  const [drawMode, setDrawMode] = useState<'none' | 'rect' | 'poly'>('none')
  const rectStartRef = useRef<{ x: number; y: number } | null>(null)
  const [draftRect, setDraftRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [draftPoly, setDraftPoly] = useState<Array<{ x: number; y: number }>>([])
  const [rf, setRf] = useState<{ screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number } } | null>(null)
  const lastValidPositionsRef = useRef<Record<string, { x: number; y: number }>>({})

  const editingObject = useMemo(() => {
    return editingObjectId ? objects.find((o) => o.id === editingObjectId) ?? null : null
  }, [editingObjectId, objects])

  const initialNodes: Node<CanvasNodeData>[] = useMemo(() => {
    const tableNodes: Node<TableNodeData>[] = tables.map((table) => ({
      id: table.id,
      type: 'tableNode',
      position: { x: table.x, y: table.y },
      data: { 
        table, 
        isSelected: table.id === selectedTableId,
        viewMode 
      },
      selected: table.id === selectedTableId,
      draggable: viewMode === 'edit',
    }))

    const objectNodes: Node<ObjectNodeData>[] = objects.map((object) => ({
      id: object.id,
      type: 'objectNode',
      position: { x: object.x, y: object.y },
      data: {
        object,
        isSelected: object.id === selectedObjectId,
        viewMode,
      },
      selected: object.id === selectedObjectId,
      draggable: viewMode === 'edit' && !object.locked,
    }))

    return [...tableNodes, ...objectNodes]
  }, [objects, selectedObjectId, selectedTableId, tables, viewMode])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>(initialNodes)

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useEffect(() => {
    // Seed last valid positions so we can revert if polygon limits are violated.
    if (limits.kind !== 'poly') return
    const poly = limits.points
    if (poly.length < 3) return

    const next: Record<string, { x: number; y: number }> = { ...lastValidPositionsRef.current }

    for (const t of tables) {
      const pos = { x: t.x, y: t.y }
      if (rectCorners({ x: pos.x, y: pos.y, width: t.width, height: t.height }).every((p) => pointInPolygon(p, poly))) {
        next[t.id] = pos
      }
    }
    for (const o of objects) {
      const pos = { x: o.x, y: o.y }
      if (rectCorners({ x: pos.x, y: pos.y, width: o.width, height: o.height }).every((p) => pointInPolygon(p, poly))) {
        next[o.id] = pos
      }
    }

    lastValidPositionsRef.current = next
  }, [limits, objects, tables])
  
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const toFlowPos = useCallback(
    (e: { clientX: number; clientY: number }) => {
      if (!rf) return null
      return rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    },
    [rf]
  )

  const clampPosToRectLimits = useCallback(
    (pos: { x: number; y: number }, size: { width: number; height: number }) => {
      if (limits.kind !== 'rect') return pos
      const r = limits.rect
      return {
        x: Math.round(clamp(pos.x, r.x, r.x + r.width - size.width)),
        y: Math.round(clamp(pos.y, r.y, r.y + r.height - size.height)),
      }
    },
    [limits]
  )

  const fitsInPolyLimits = useCallback(
    (pos: { x: number; y: number }, size: { width: number; height: number }) => {
      if (limits.kind !== 'poly') return true
      const poly = limits.points
      if (poly.length < 3) return true
      const corners = rectCorners({ x: pos.x, y: pos.y, width: size.width, height: size.height })
      return corners.every((p) => pointInPolygon(p, poly))
    },
    [limits]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'tableNode') {
        setSelectedObjectId(null)
        setSelectedTableId(selectedTableId === node.id ? null : node.id)
        return
      }
      if (node.type === 'objectNode') {
        setSelectedTableId(null)
        setSelectedObjectId(selectedObjectId === node.id ? null : node.id)
      }
    },
    [selectedObjectId, selectedTableId, setSelectedObjectId, setSelectedTableId]
  )

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'tableNode') {
        const table = tables.find((t) => t.id === node.id)
        if (!table) return

        let next = { x: node.position.x, y: node.position.y }
        next = clampPosToRectLimits(next, { width: table.width, height: table.height })

        if (!fitsInPolyLimits(next, { width: table.width, height: table.height })) {
          const prev = lastValidPositionsRef.current[node.id]
          if (prev) next = prev
        } else {
          lastValidPositionsRef.current[node.id] = next
        }

        setTables((prev: Table[]) =>
          prev.map((t) => (t.id === node.id ? { ...t, x: next.x, y: next.y } : t))
        )
        return
      }

      if (node.type === 'objectNode') {
        const obj = objects.find((o) => o.id === node.id)
        if (!obj) return

        let next = { x: node.position.x, y: node.position.y }
        next = clampPosToRectLimits(next, { width: obj.width, height: obj.height })

        if (!fitsInPolyLimits(next, { width: obj.width, height: obj.height })) {
          const prev = lastValidPositionsRef.current[node.id]
          if (prev) next = prev
        } else {
          lastValidPositionsRef.current[node.id] = next
        }

        setObjects((prev) => prev.map((o) => (o.id === node.id ? { ...o, x: next.x, y: next.y } : o)))
      }
    },
    [clampPosToRectLimits, fitsInPolyLimits, objects, setObjects, setTables, tables]
  )

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId),
    [tables, selectedTableId]
  )

  const nodeTypes = {
    tableNode: TableNode,
    objectNode: ObjectNode,
  }

  return (
    <div className={cn('w-full h-full', className)}>
      <div className="w-full h-full bg-[#0a0a0a]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        nodesDraggable={viewMode === 'edit'}
        onInit={(instance) => setRf({ screenToFlowPosition: instance.screenToFlowPosition })}
        onPaneMouseMove={(e: React.MouseEvent) => {
          if (drawMode !== 'rect') return
          const start = rectStartRef.current
          if (!start) return
          const p = toFlowPos(e)
          if (!p) return
          setDraftRect(normalizeRect(start, { x: Math.round(p.x), y: Math.round(p.y) }))
        }}
        onPaneClick={(e: React.MouseEvent) => {
          if (drawMode === 'rect') {
            const p = toFlowPos(e)
            if (!p) return
            const start = rectStartRef.current

            setSelectedTableId(null)
            setSelectedObjectId(null)

            if (!start) {
              const nextStart = { x: Math.round(p.x), y: Math.round(p.y) }
              rectStartRef.current = nextStart
              setDraftRect({ x: nextStart.x, y: nextStart.y, width: 0, height: 0 })
              return
            }

            const r = normalizeRect(start, { x: Math.round(p.x), y: Math.round(p.y) })
            rectStartRef.current = null
            setDraftRect(null)
            if (r.width >= 40 && r.height >= 40) setLimits({ kind: 'rect', rect: r })
            setDrawMode('none')
            return
          }

          if (drawMode === 'poly') {
            const p = toFlowPos(e)
            if (!p) return
            setDraftPoly((prev) => [...prev, { x: Math.round(p.x), y: Math.round(p.y) }])
            setSelectedTableId(null)
            setSelectedObjectId(null)
          }
        }}
        fitView
        panOnScroll
        zoomOnScroll={false}
        minZoom={0.5}
        maxZoom={2}
        className="bg-dark"
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={40} 
          size={1}
          color="rgba(255,255,255,0.1)"
        />
        <Controls 
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          position="bottom-right"
          className="!bottom-20 !right-4"
        />

        <ViewportPortal>
          {(limits.kind === 'rect' || draftRect) && (
            <svg className="absolute left-0 top-0 overflow-visible pointer-events-none">
              {limits.kind === 'rect' && (
                <rect
                  x={limits.rect.x}
                  y={limits.rect.y}
                  width={limits.rect.width}
                  height={limits.rect.height}
                  fill="rgba(255,255,255,0.03)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={2}
                  rx={18}
                />
              )}
              {draftRect && (
                <rect
                  x={draftRect.x}
                  y={draftRect.y}
                  width={draftRect.width}
                  height={draftRect.height}
                  fill="rgba(255,255,255,0.02)"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  rx={18}
                />
              )}
            </svg>
          )}

          {(limits.kind === 'poly' || draftPoly.length > 0) && (
            <svg className="absolute left-0 top-0 overflow-visible pointer-events-none">
              {limits.kind === 'poly' && limits.points.length >= 3 && (
                <polygon
                  points={limits.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="rgba(255,255,255,0.03)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={2}
                />
              )}
              {draftPoly.length > 0 && (
                <>
                  <polyline
                    points={draftPoly.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                  />
                  {draftPoly.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r={4} fill="rgba(255,255,255,0.6)" />
                  ))}
                </>
              )}
            </svg>
          )}
        </ViewportPortal>
        
        <Panel position="bottom-center" className="!bottom-6">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingTableId(null)
                setShowAddTableModal(true)
              }}
              className={cn(
                'rounded-xl bg-white/10 border border-white/20 transition-colors active:bg-white/20',
                isMobile ? 'h-10 px-4 text-xs' : 'h-12 px-6 text-sm'
              )}
            >
              <Plus className={cn('mr-1', isMobile ? 'w-3 h-3' : 'w-4 h-4')} />
              Añadir Mesa
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setEditingObjectId(null)
                setShowObjectModal(true)
              }}
              className={cn(
                'rounded-xl bg-white/5 border border-white/10 transition-colors active:bg-white/10',
                isMobile ? 'h-10 px-4 text-xs' : 'h-12 px-6 text-sm'
              )}
            >
              <Plus className={cn('mr-1', isMobile ? 'w-3 h-3' : 'w-4 h-4')} />
              Añadir Objeto
            </Button>
          </div>
        </Panel>

        <Panel position="top-center" className="!top-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark/80 backdrop-blur-xl rounded-xl border border-white/10 text-white/70 transition-colors active:text-white"
              >
                <MoreVertical className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Filtros</span>
              </button>

              <AnimatePresence>
                {showFiltersMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex gap-1 p-1.5 bg-dark/95 backdrop-blur-xl rounded-xl border border-white/10"
                  >
                    <button
                      onClick={() => { setStatusFilter('all'); setShowFiltersMenu(false); }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all',
                        'bg-white/20 text-white'
                      )}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => { setStatusFilter('free'); setShowFiltersMenu(false); }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all',
                        'text-white/60 transition-colors active:text-white active:bg-white/10'
                      )}
                    >
                      Libres
                    </button>
                    <button
                      onClick={() => { setStatusFilter('occupied'); setShowFiltersMenu(false); }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all',
                        'text-white/60 transition-colors active:text-white active:bg-white/10'
                      )}
                    >
                      Ocupadas
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowLimitsMenu(!showLimitsMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark/80 backdrop-blur-xl rounded-xl border border-white/10 text-white/70 transition-colors active:text-white"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Limites</span>
                {limits.kind !== 'none' && <Check className="w-3.5 h-3.5 text-white/80" />}
              </button>

              <AnimatePresence>
                {showLimitsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 grid gap-1 p-1.5 bg-dark/95 backdrop-blur-xl rounded-xl border border-white/10 min-w-[160px]"
                  >
                    <button
                      onClick={() => {
                        setShowLimitsMenu(false)
                        setDrawMode('rect')
                        setDraftPoly([])
                      }}
                      className="px-2.5 py-2 rounded-xl text-[10px] font-medium text-white/80 transition-colors active:bg-white/10 active:text-white"
                    >
                      Dibujar rectangulo
                    </button>
                    <button
                      onClick={() => {
                        setShowLimitsMenu(false)
                        setDrawMode('poly')
                        setDraftRect(null)
                        setDraftPoly([])
                      }}
                      className="px-2.5 py-2 rounded-xl text-[10px] font-medium text-white/80 transition-colors active:bg-white/10 active:text-white"
                    >
                      Dibujar poligono
                    </button>
                    <button
                      onClick={() => {
                        setLimits({ kind: 'none' })
                        setDrawMode('none')
                        setDraftRect(null)
                        setDraftPoly([])
                        setShowLimitsMenu(false)
                      }}
                      className="px-2.5 py-2 rounded-xl text-[10px] font-medium text-white/60 transition-colors active:bg-white/10 active:text-white"
                    >
                      Borrar limites
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Panel>

        {drawMode !== 'none' && (
          <Panel position="top-left" className="!top-4 !left-4">
            <div className="p-3 bg-dark/90 backdrop-blur-xl rounded-xl border border-white/10 min-w-[220px]">
              {drawMode === 'rect' && (
                <p className="text-xs text-white/70">
                  Dibuja limites: arrastra para crear un rectangulo.
                </p>
              )}
              {drawMode === 'poly' && (
                <p className="text-xs text-white/70">
                  Dibuja limites: toca para agregar puntos.
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                {drawMode === 'poly' && (
                  <button
                    type="button"
                    disabled={draftPoly.length < 3}
                    onClick={() => {
                      if (draftPoly.length < 3) return
                      setLimits({ kind: 'poly', points: draftPoly })
                      setDrawMode('none')
                      setDraftPoly([])
                    }}
                    className={cn(
                      'px-3 py-2 rounded-xl border text-xs transition-colors',
                      draftPoly.length >= 3
                        ? 'bg-white/20 border-white/30 text-white active:bg-white/20'
                        : 'bg-white/5 border-white/10 text-white/30'
                    )}
                  >
                    Finalizar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode('none')
                    setDraftRect(null)
                    setDraftPoly([])
                    rectStartRef.current = null
                  }}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/70 transition-colors active:bg-white/10 active:text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Panel>
        )}

        {selectedTable && viewMode === 'view' && (
          <Panel position="bottom-center" className="!bottom-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-dark/95 backdrop-blur-xl rounded-xl border border-white/10 flex items-center gap-4"
            >
              <div className="text-center min-w-[50px]">
                <p className="text-xl font-bold text-white">{selectedTable.number}</p>
                <p className="text-[10px] text-white/50">Mesa</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center min-w-[50px]">
                <p className="text-xl font-bold text-white">{selectedTable.capacity}</p>
                <p className="text-[10px] text-white/50">Capacidad</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center min-w-[70px]">
                <p className={cn(
                  'text-sm font-semibold',
                  selectedTable.status === 'free' && 'text-green-400',
                  selectedTable.status === 'occupied' && 'text-gray-400',
                  selectedTable.status === 'reserved' && 'text-yellow-400'
                )}>
                  {selectedTable.status === 'free' && 'Libre'}
                  {selectedTable.status === 'occupied' && 'Ocupada'}
                  {selectedTable.status === 'reserved' && 'Reservada'}
                </p>
                <p className="text-[10px] text-white/50">Estado</p>
              </div>
              <button
                onClick={() => setSelectedTableId(null)}
                className="ml-2 p-1.5 rounded-xl transition-colors active:bg-white/10"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </motion.div>
          </Panel>
        )}
      </ReactFlow>

      <ObjectConfigModal
        openAtom={isAddObjectModalOpenAtom}
        editing={
          editingObject
            ? {
                id: editingObject.id,
                shape: editingObject.shape,
                width: editingObject.width,
                height: editingObject.height,
              }
            : null
        }
        onCreate={(config) => {
          let base = { x: 120 + Math.random() * 120, y: 120 + Math.random() * 120 }
          const nextSize = { width: config.width, height: config.height }
          if (limits.kind === 'poly' && limits.points.length >= 3) {
            const avg = limits.points.reduce(
              (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
              { x: 0, y: 0 }
            )
            const centroid = { x: avg.x / limits.points.length, y: avg.y / limits.points.length }
            if (fitsInPolyLimits(centroid, nextSize)) base = centroid
          }

          const nextPos = clampPosToRectLimits(base, nextSize)
          const newObj: CanvasObject = {
            id: crypto.randomUUID(),
            shape: config.shape,
            width: config.shape === 'round' ? Math.min(config.width, config.height) : config.width,
            height: config.shape === 'round' ? Math.min(config.width, config.height) : config.height,
            x: nextPos.x,
            y: nextPos.y,
            locked: true,
          }
          setObjects((prev) => [...prev, newObj])
          setSelectedObjectId(newObj.id)
          setSelectedTableId(null)
          lastValidPositionsRef.current[newObj.id] = { x: newObj.x, y: newObj.y }
        }}
        onEdit={(id, config) => {
          setObjects((prev) =>
            prev.map((o) => {
              if (o.id !== id) return o
              const nextW = config.shape === 'round' ? Math.min(config.width, config.height) : config.width
              const nextH = config.shape === 'round' ? Math.min(config.width, config.height) : config.height
              const nextPos = clampPosToRectLimits({ x: o.x, y: o.y }, { width: nextW, height: nextH })
              return { ...o, shape: config.shape, width: nextW, height: nextH, x: nextPos.x, y: nextPos.y }
            })
          )
          setEditingObjectId(null)
        }}
      />
      </div>
    </div>
  )
}
