import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Delete, Divide, Minus, Plus, Equal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Calculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(String(num));
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay("0.");
      setWaitingForNewValue(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const performOperation = (nextOperation: string) => {
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

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "*":
        return firstValue * secondValue;
      case "/":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const buttons = [
    { label: "C", action: clear, type: "function", color: "bg-red-500 hover:bg-red-600" },
    { label: "⌫", action: backspace, type: "function", color: "bg-gray-500 hover:bg-gray-600" },
    { label: "/", action: () => performOperation("/"), type: "operator", color: "bg-blue-500 hover:bg-blue-600" },
    { label: "*", action: () => performOperation("*"), type: "operator", color: "bg-blue-500 hover:bg-blue-600" },
    
    { label: "7", action: () => inputNumber("7"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "8", action: () => inputNumber("8"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "9", action: () => inputNumber("9"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "-", action: () => performOperation("-"), type: "operator", color: "bg-blue-500 hover:bg-blue-600" },
    
    { label: "4", action: () => inputNumber("4"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "5", action: () => inputNumber("5"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "6", action: () => inputNumber("6"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "+", action: () => performOperation("+"), type: "operator", color: "bg-blue-500 hover:bg-blue-600" },
    
    { label: "1", action: () => inputNumber("1"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "2", action: () => inputNumber("2"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "3", action: () => inputNumber("3"), type: "number", color: "bg-gray-700 hover:bg-gray-600" },
    { label: "=", action: performCalculation, type: "equals", color: "bg-green-500 hover:bg-green-600", rowSpan: 2 },
    
    { label: "0", action: () => inputNumber("0"), type: "number", color: "bg-gray-700 hover:bg-gray-600", colSpan: 2 },
    { label: ".", action: inputDecimal, type: "decimal", color: "bg-gray-700 hover:bg-gray-600" },
  ];

  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Format large numbers with commas
    if (Math.abs(num) >= 1000) {
      return num.toLocaleString('es-DO', { 
        maximumFractionDigits: 8,
        useGrouping: true 
      });
    }
    
    return value;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Calculator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:inset-auto z-50 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 rounded-none md:rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6 w-full h-full md:w-96 md:h-auto max-w-none md:max-w-[90vw]">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">Calculadora</h3>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Display */}
              <div className="mb-4">
                <div className="bg-black rounded-lg p-4 border border-gray-600">
                  <div className="text-right">
                    {/* Operation indicator */}
                    {operation && previousValue !== null && (
                      <div className="text-gray-400 text-sm">
                        {formatDisplay(String(previousValue))} {operation}
                      </div>
                    )}
                    {/* Main display */}
                    <div className="text-white text-xl sm:text-2xl font-mono leading-tight break-all">
                      {formatDisplay(display)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Grid */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {buttons.map((button, index) => {
                  if (button.label === "=") {
                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={button.action}
                        className={`
                          ${button.color} text-white font-semibold rounded-lg h-10 sm:h-12
                          row-span-2 flex items-center justify-center
                          transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95
                          border border-gray-600 touch-manipulation select-none
                        `}
                        style={{ gridRow: "span 2" }}
                      >
                        <Equal className="w-5 h-5" />
                      </motion.button>
                    );
                  }
                  
                  if (button.label === "0") {
                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={button.action}
                        className={`
                          ${button.color} text-white font-semibold rounded-lg h-10 sm:h-12 text-sm sm:text-base
                          col-span-2 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95
                          border border-gray-600 touch-manipulation select-none
                        `}
                        style={{ gridColumn: "span 2" }}
                      >
                        {button.label}
                      </motion.button>
                    );
                  }

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={button.action}
                      className={`
                        ${button.color} text-white font-semibold rounded-lg h-10 sm:h-12 text-sm sm:text-base
                        transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95
                        border border-gray-600 flex items-center justify-center
                        touch-manipulation select-none
                      `}
                    >
                      {button.label === "⌫" ? (
                        <Delete className="w-4 h-4" />
                      ) : button.label === "/" ? (
                        <Divide className="w-4 h-4" />
                      ) : button.label === "-" ? (
                        <Minus className="w-4 h-4" />
                      ) : button.label === "+" ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        button.label
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-xs">
                  Four One Solutions - Calculadora
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}