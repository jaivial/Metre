import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Square, Circle, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { isAddTableModalOpenAtom, editingTableIdAtom } from "@/stores/atoms";
import type { TableShape, Table } from "@/types";
import { calculateTableSize } from "@/lib/utils";

const TABLE_COLORS = [
  {
    name: "Verde",
    bg: "bg-green-500/30",
    border: "border-green-500/50",
    text: "text-green-400",
  },
  {
    name: "Azul",
    bg: "bg-blue-500/30",
    border: "border-blue-500/50",
    text: "text-blue-400",
  },
  {
    name: "Morado",
    bg: "bg-purple-500/30",
    border: "border-purple-500/50",
    text: "text-purple-400",
  },
  {
    name: "Naranja",
    bg: "bg-orange-500/30",
    border: "border-orange-500/50",
    text: "text-orange-400",
  },
  {
    name: "Rosa",
    bg: "bg-pink-500/30",
    border: "border-pink-500/50",
    text: "text-pink-400",
  },
  {
    name: "Gris",
    bg: "bg-gray-500/30",
    border: "border-gray-500/50",
    text: "text-gray-400",
  },
];

const TABLE_SIZES = [
  { label: "Pequeña", scale: 0.7 },
  { label: "Mediana", scale: 1 },
  { label: "Grande", scale: 1.3 },
  { label: "Extra Grande", scale: 1.6 },
  { label: "Gigante", scale: 2 },
];

interface TableConfigModalProps {
  onAdd?: (config: {
    shape: TableShape;
    number: string;
    capacity: number;
    sizeIndex: number;
    colorIndex: number;
  }) => void;
  onEdit?: (config: {
    shape: TableShape;
    number: string;
    capacity: number;
    sizeIndex: number;
    colorIndex: number;
  }) => void;
  existingNumbers: string[];
  editingTable?: Table | null;
}

export function TableConfigModal({
  onAdd,
  onEdit,
  existingNumbers,
  editingTable,
}: TableConfigModalProps) {
  const [isOpen, setIsOpen] = useAtom(isAddTableModalOpenAtom);
  const [editingTableId, setEditingTableId] = useAtom(editingTableIdAtom);
  
  const isEditMode = editingTableId !== null;
  
  const [shape, setShape] = useState<TableShape>("square");
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [colorIndex, setColorIndex] = useState(0);

  // Populate form when editing a table
  useEffect(() => {
    if (editingTable) {
      setShape(editingTable.shape);
      setNumber(editingTable.number.toString());
      setCapacity(editingTable.capacity);
      
      // Calculate size index based on current width
      const baseSize = calculateTableSize(editingTable.shape, editingTable.capacity);
      const currentScale = editingTable.width / baseSize.width;
      const sizeIdx = TABLE_SIZES.findIndex(s => Math.abs(s.scale - currentScale) < 0.1);
      setSizeIndex(sizeIdx >= 0 ? sizeIdx : 1);
    }
  }, [editingTable]);

  const onClose = () => {
    setIsOpen(false);
    setEditingTableId(null);
    resetForm();
  };

  // For edit mode, allow same number (current table's number)
  const isValidNumber = number.trim() !== "" && 
    (!isEditMode || existingNumbers.filter(n => n !== editingTable?.number.toString()).includes(number.trim()) === false);

  const handleSubmit = () => {
    if (!isValidNumber) return;
    
    const config = {
      shape,
      number: number.trim(),
      capacity,
      sizeIndex,
      colorIndex,
    };
    
    if (isEditMode && editingTable && onEdit) {
      onEdit(config);
    } else if (onAdd) {
      onAdd(config);
    }
    
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setShape("square");
    setNumber("");
    setCapacity(4);
    setSizeIndex(1);
    setColorIndex(0);
  };

  const previewSize = useMemo(() => {
    const baseSize = 100;
    return baseSize * TABLE_SIZES[sizeIndex].scale;
  }, [sizeIndex]);

  const selectedColor = TABLE_COLORS[colorIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 m-auto w-[90vw] max-w-3xl h-fit z-[100]"
          >
            <div className="flex rounded-3xl overflow-hidden">
              <div className="flex-1 flex items-center justify-center p-8 min-h-[400px] rounded-l-[1.8rem]">
                <div
                  className={cn(
                    "flex items-center justify-center border-2 transition-all duration-300",
                    selectedColor.bg,
                    selectedColor.border,
                    shape === "round" ? "rounded-full" : "rounded-xl",
                  )}
                  style={{
                    width: previewSize,
                    height: previewSize,
                    minWidth: 60,
                    minHeight: 60,
                  }}
                >
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">
                      {number || "#"}
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-white/70" />
                      <span className="text-sm text-white/70">{capacity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-80 p-6 bg-dark/95 backdrop-blur-xl rounded-l-[1.8rem] border-white/10 flex flex-col rounded-r-[1.8rem]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    {isEditMode ? "Editar Mesa" : "Configurar Mesa"}
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>

                <div className="flex-1 space-y-5">
                  <div>
                    <label className="text-xs text-white/50 font-medium mb-2 block">
                      Forma
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShape("square")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all",
                          shape === "square"
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10",
                        )}
                      >
                        <Square className="w-4 h-4" />
                        Cuadrada
                      </button>
                      <button
                        onClick={() => setShape("round")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all",
                          shape === "round"
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10",
                        )}
                      >
                        <Circle className="w-4 h-4" />
                        Redonda
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 font-medium mb-2 block">
                      Número de mesa
                    </label>
                    <Input
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="Ej: 1A, VIP, 99"
                      className={cn(
                        number.trim() !== "" &&
                          !isValidNumber &&
                          "border-red-500/50",
                      )}
                    />
                    {number.trim() !== "" && !isValidNumber && (
                      <p className="text-[10px] text-red-400 mt-1">
                        Número ya existe o está vacío
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-white/50 font-medium mb-2 block">
                      Capacidad máxima
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={capacity}
                        onChange={(e) =>
                          setCapacity(parseInt(e.target.value) || 1)
                        }
                        className="pl-10"
                      />
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 font-medium mb-2 block">
                      Tamaño
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {TABLE_SIZES.map((size, idx) => (
                        <button
                          key={size.label}
                          onClick={() => setSizeIndex(idx)}
                          className={cn(
                            "py-2 rounded-lg text-[10px] font-medium transition-all",
                            sizeIndex === idx
                              ? "bg-white/20 text-white"
                              : "bg-white/5 text-white/60 hover:bg-white/10",
                          )}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 font-medium mb-2 block">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {TABLE_COLORS.map((color, idx) => (
                        <button
                          key={color.name}
                          onClick={() => setColorIndex(idx)}
                          className={cn(
                            "w-8 h-8 rounded-lg transition-all flex items-center justify-center",
                            color.bg,
                            color.border,
                            "border-2",
                            colorIndex === idx &&
                              "ring-2 ring-white ring-offset-2 ring-offset-dark",
                          )}
                        >
                          {colorIndex === idx && (
                            <Check className={cn("w-4 h-4", color.text)} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!isValidNumber}
                  className="w-full mt-6"
                  size="lg"
                >
                  {isEditMode ? "Guardar Cambios" : "Añadir Mesa"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
