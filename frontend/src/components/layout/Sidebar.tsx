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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAtom } from 'jotai'
import { isSidebarOpenAtom } from '@/stores/atoms'

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-72 bg-dark/95 backdrop-blur-xl border-r border-white/10 z-50"
            >
              <div className="flex flex-col h-full p-4">
                <div className="flex items-center gap-3 px-2 py-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Metre</h2>
                    <p className="text-xs text-white/50">Gestión de restaurante</p>
                  </div>
                </div>

                <nav className="flex-1 py-4 space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 transition-all duration-200',
                        'hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="border-t border-white/10 pt-4">
                  <p className="px-4 text-xs text-white/40 mb-2">Restaurant Demo</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {children}
    </>
  )
}
