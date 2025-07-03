import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Delete, Divide, Minus, Plus, Equal } from "lucide-react";

interface MobileCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileCalculator({ isOpen, onClose }: MobileCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const formatDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('es-DO');
  };

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+": return firstValue + secondValue;
      case "-": return firstValue - secondValue;
      case "*": return firstValue * secondValue;
      case "/": return firstValue / secondValue;
      default: return secondValue;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay("0.");
      setWaitingForNewValue(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const buttons = [
    { label: "C", action: handleClear, color: "bg-red-600 hover:bg-red-700", type: "clear" },
    { label: "⌫", action: handleBackspace, color: "bg-orange-600 hover:bg-orange-700", type: "backspace" },
    { label: "%", action: () => setDisplay(String(parseFloat(display) / 100)), color: "bg-orange-600 hover:bg-orange-700", type: "operation" },
    { label: "/", action: () => handleOperation("/"), color: "bg-orange-600 hover:bg-orange-700", type: "operation" },
    
    { label: "7", action: () => handleNumber("7"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "8", action: () => handleNumber("8"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "9", action: () => handleNumber("9"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "*", action: () => handleOperation("*"), color: "bg-orange-600 hover:bg-orange-700", type: "operation" },
    
    { label: "4", action: () => handleNumber("4"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "5", action: () => handleNumber("5"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "6", action: () => handleNumber("6"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "-", action: () => handleOperation("-"), color: "bg-orange-600 hover:bg-orange-700", type: "operation" },
    
    { label: "1", action: () => handleNumber("1"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "2", action: () => handleNumber("2"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "3", action: () => handleNumber("3"), color: "bg-gray-700 hover:bg-gray-600", type: "number" },
    { label: "+", action: () => handleOperation("+"), color: "bg-orange-600 hover:bg-orange-700", type: "operation" },
    
    { label: "0", action: () => handleNumber("0"), color: "bg-gray-700 hover:bg-gray-600", type: "number", span: "col-span-2" },
    { label: ".", action: handleDecimal, color: "bg-gray-700 hover:bg-gray-600", type: "decimal" },
    { label: "=", action: handleEquals, color: "bg-blue-600 hover:bg-blue-700", type: "equals" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full sm:w-80 sm:h-auto bg-gray-900 sm:rounded-2xl shadow-2xl border border-gray-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-white font-bold text-xl">Calculadora</h3>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full w-10 h-10 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Display */}
            <div className="p-4 sm:p-6 flex-shrink-0">
              <div className="bg-black rounded-lg p-6 sm:p-8 border border-gray-600">
                <div className="text-right">
                  {operation && previousValue !== null && (
                    <div className="text-gray-400 text-lg sm:text-xl mb-2">
                      {formatDisplay(String(previousValue))} {operation}
                    </div>
                  )}
                  <div className="text-white text-3xl sm:text-4xl lg:text-5xl font-mono leading-tight break-all">
                    {formatDisplay(display)}
                  </div>
                </div>
              </div>
            </div>

            {/* Button Grid */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
              <div className="grid grid-cols-4 gap-3 sm:gap-4 flex-1">
                {buttons.map((button, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={button.action}
                    className={`
                      ${button.color} ${button.span || ""} text-white font-bold rounded-xl
                      h-12 sm:h-14 text-lg sm:text-xl transition-all duration-200 shadow-lg hover:shadow-xl
                      border border-gray-600 flex items-center justify-center
                      touch-manipulation select-none active:scale-95
                    `}
                  >
                    {button.label === "⌫" ? (
                      <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : button.label === "/" ? (
                      <Divide className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : button.label === "-" ? (
                      <Minus className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : button.label === "+" ? (
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : button.label === "=" ? (
                      <Equal className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      button.label
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Safe area for mobile devices */}
            <div className="h-safe-area-inset-bottom sm:hidden"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}