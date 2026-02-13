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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAtom } from 'jotai'
import { isSidebarOpenAtom } from '@/stores/atoms'
import { useMediaQuery } from '@/hooks/useMediaQuery'

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
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 h-11 w-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
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
              initial={isMobile ? { y: -400 } : { x: -280 }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: -400 } : { x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'fixed bg-dark/95 backdrop-blur-xl z-50',
                isMobile 
                  ? 'top-0 left-0 right-0 h-screen rounded-none border-b-0'
                  : 'top-0 left-0 h-full w-72 border-r border-white/10'
              )}
            >
              <div className={cn('flex flex-col h-full', isMobile ? 'p-2' : 'p-4')}>
                <div className="flex items-center justify-between px-1 py-2/10">
                  border-b border-white <div className="flex items-center gap-2">
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
                </nav>

                <div className="border-t border-white/10 pt-2">
                  <p className="px-1 text-[9px] text-white/40">Restaurant Demo</p>
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
