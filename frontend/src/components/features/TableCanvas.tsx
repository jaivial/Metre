import { useCallback, useState, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  NodeProps,
  BackgroundVariant,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAtom } from 'jotai'
import {
  tablesAtom,
  selectedTableIdAtom,
  viewModeAtom,
  statusFilterAtom,
} from '@/stores/atoms'
import { cn, calculateTableSize } from '@/lib/utils'
import type { Table, TableShape } from '@/types'
import { Plus, Trash2, Users, MoreVertical, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface TableNodeData extends Record<string, unknown> {
  table: Table
  isSelected: boolean
  viewMode: 'edit' | 'view'
}

function TableNode({ data, selected }: NodeProps<Node<TableNodeData>>) {
  const { table, isSelected, viewMode } = data
  
  const statusColors = {
    free: 'bg-green-500/30 border-green-500/50',
    occupied: 'bg-gray-500/40 border-gray-500/60',
    reserved: 'bg-yellow-500/30 border-yellow-500/50',
  }

  const baseClasses = 'rounded-xl border-2 transition-all duration-200 flex items-center justify-center'
  
  const size = table.shape === 'round' 
    ? { width: table.width, height: table.height }
    : { width: table.width, height: table.height }

  return (
    <div
      className={cn(
        baseClasses,
        statusColors[table.status],
        selected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-dark',
        table.shape === 'round' && 'rounded-full'
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
    </div>
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
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [showFiltersMenu, setShowFiltersMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const initialNodes: Node<TableNodeData>[] = useMemo(() => {
    return tables.map((table) => ({
      id: table.id,
      type: 'tableNode',
      position: { x: table.x, y: table.y },
      data: { 
        table, 
        isSelected: table.id === selectedTableId,
        viewMode 
      },
      selected: table.id === selectedTableId,
    }))
  }, [tables, selectedTableId, viewMode])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedTableId(selectedTableId === node.id ? null : node.id)
      setShowTableMenu(false)
    },
    [selectedTableId, setSelectedTableId]
  )

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setTables((prev: Table[]) =>
        prev.map((t) =>
          t.id === node.id ? { ...t, x: node.position.x, y: node.position.y } : t
        )
      )
    },
    [setTables]
  )

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setTables((prev: Table[]) =>
        prev.map((t) => (t.id === id ? { ...t, x, y } : t))
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
      setShowTableMenu(false)
    },
    [selectedTableId, setTables, setSelectedTableId]
  )

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId),
    [tables, selectedTableId]
  )

  const nodeTypes = {
    tableNode: TableNode,
  }

  return (
    <div className={cn('w-full h-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
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
        
        <Panel position="bottom-center" className="!bottom-6">
          <div className="relative">
            <Button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={cn(
                'rounded-xl bg-white/10 border border-white/20 hover:bg-white/20',
                isMobile ? 'h-10 px-4 text-xs' : 'h-12 px-6 text-sm'
              )}
            >
              <MoreVertical className={cn('mr-1', isMobile ? 'w-3 h-3' : 'w-4 h-4')} />
              {isMobile ? 'Más' : 'Añadir Mesa'}
            </Button>

            <AnimatePresence>
              {showMobileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-dark/95 backdrop-blur-xl rounded-xl border border-white/10"
                >
                  <Button
                    variant="secondary"
                    onClick={() => { addTable('round'); setShowMobileMenu(false); }}
                    className="rounded-xl text-xs px-3 py-2"
                  >
                    + Redonda
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => { addTable('square'); setShowMobileMenu(false); }}
                    className="rounded-xl text-xs px-3 py-2"
                  >
                    + Cuadrada
                  </Button>
                  {selectedTable && viewMode === 'edit' && (
                    <Button
                      variant="destructive"
                      onClick={() => { deleteTable(selectedTable.id); setShowMobileMenu(false); }}
                      className="rounded-xl text-xs px-3 py-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>

        <Panel position="top-center" className="!top-4">
          <div className="relative">
            <button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark/80 backdrop-blur-xl rounded-xl border border-white/10 text-white/70 hover:text-white"
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
                      'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                      'bg-white/20 text-white'
                    )}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => { setStatusFilter('free'); setShowFiltersMenu(false); }}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                      'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                  >
                    Libres
                  </button>
                  <button
                    onClick={() => { setStatusFilter('occupied'); setShowFiltersMenu(false); }}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                      'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                  >
                    Ocupadas
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>

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
                className="ml-2 p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </motion.div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
