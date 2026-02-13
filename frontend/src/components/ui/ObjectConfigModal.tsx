import * as React from 'react'
import { useAtom, type PrimitiveAtom } from 'jotai'
import { Circle, Square } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { CanvasObjectShape } from '@/types'

export function ObjectConfigModal({
  openAtom,
  onCreate,
  editing,
  onEdit,
}: {
  openAtom: PrimitiveAtom<boolean>
  onCreate: (config: { shape: CanvasObjectShape; width: number; height: number }) => void
  editing?: { id: string; shape: CanvasObjectShape; width: number; height: number } | null
  onEdit?: (id: string, config: { shape: CanvasObjectShape; width: number; height: number }) => void
}) {
  const [open, setOpen] = useAtom(openAtom)
  const isEdit = Boolean(editing)

  const [shape, setShape] = React.useState<CanvasObjectShape>('square')
  const [size, setSize] = React.useState<'s' | 'm' | 'l'>('m')

  React.useEffect(() => {
    if (!editing) return
    setShape(editing.shape)
    // Roughly map to our presets.
    const maxDim = Math.max(editing.width, editing.height)
    setSize(maxDim <= 80 ? 's' : maxDim <= 120 ? 'm' : 'l')
  }, [editing])

  const sizePx = size === 's' ? 80 : size === 'm' ? 120 : 170

  const close = () => setOpen(false)

  const submit = () => {
    const cfg = { shape, width: sizePx, height: sizePx }
    if (isEdit && editing && onEdit) onEdit(editing.id, cfg)
    else onCreate(cfg)
    close()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-[1.8rem]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Objeto' : 'Nuevo Objeto'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <p className="text-xs text-white/60 mb-2">Forma</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShape('square')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.8rem] text-sm border transition-colors',
                  shape === 'square'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 active:bg-white/10'
                )}
              >
                <Square className="w-4 h-4" />
                Cuadrado
              </button>
              <button
                type="button"
                onClick={() => setShape('round')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.8rem] text-sm border transition-colors',
                  shape === 'round'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 active:bg-white/10'
                )}
              >
                <Circle className="w-4 h-4" />
                Circulo
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-white/60 mb-2">Tamano</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 's', label: 'S' },
                { key: 'm', label: 'M' },
                { key: 'l', label: 'L' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSize(opt.key)}
                  className={cn(
                    'py-2 rounded-[1.8rem] border text-sm transition-colors',
                    size === opt.key
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 active:bg-white/10'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close} className="rounded-[1.8rem]">
              Cancelar
            </Button>
            <Button onClick={submit} className="rounded-[1.8rem]">
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
