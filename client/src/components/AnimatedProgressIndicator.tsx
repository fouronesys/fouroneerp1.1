import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedProgressIndicatorProps {
  isActive: boolean;
  onComplete?: () => void;
}

const progressSteps = [
  { label: "Iniciando generación...", percentage: 0 },
  { label: "Cargando datos de la venta...", percentage: 20 },
  { label: "Procesando información de la empresa...", percentage: 40 },
  { label: "Generando código QR de verificación...", percentage: 60 },
  { label: "Aplicando diseño profesional...", percentage: 80 },
  { label: "Finalizando factura...", percentage: 95 },
  { label: "¡Factura generada exitosamente!", percentage: 100 }
];

export default function AnimatedProgressIndicator({ isActive, onComplete }: AnimatedProgressIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setProgress(0);
      setIsCompleted(false);
      return;
    }

    const progressTimer = setInterval(() => {
      setCurrentStep((prevStep) => {
        if (prevStep >= progressSteps.length - 1) {
          setIsCompleted(true);
          clearInterval(progressTimer);
          setTimeout(() => {
            onComplete?.();
          }, 1000);
          return prevStep;
        }
        return prevStep + 1;
      });
    }, 800);

    return () => clearInterval(progressTimer);
  }, [isActive, onComplete]);

  useEffect(() => {
    if (currentStep < progressSteps.length) {
      const targetProgress = progressSteps[currentStep].percentage;
      const progressAnimationTimer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= targetProgress) {
            clearInterval(progressAnimationTimer);
            return targetProgress;
          }
          return Math.min(prevProgress + 2, targetProgress);
        });
      }, 50);

      return () => clearInterval(progressAnimationTimer);
    }
  }, [currentStep]);

  if (!isActive) return null;

  return (
    <div className="space-y-6 py-6">
      {/* Header with animated icon */}
      <div className="flex items-center justify-center space-x-3">
        <div className="relative">
          {isCompleted ? (
            <CheckCircle className="w-8 h-8 text-green-600 animate-pulse" />
          ) : (
            <div className="relative">
              <FileText className="w-8 h-8 text-black" />
              <Loader2 className="w-4 h-4 text-black animate-spin absolute -top-1 -right-1" />
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isCompleted ? "¡Completado!" : "Generando Factura"}
        </h3>
      </div>

      {/* Progress bar */}
      <div className="space-y-3">
        <Progress 
          value={progress} 
          className="h-3 transition-all duration-500 ease-out"
        />
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{progress}%</span>
          <span className={cn(
            "transition-all duration-300",
            isCompleted && "text-green-600 font-semibold"
          )}>
            {currentStep < progressSteps.length ? progressSteps[currentStep].label : "Completado"}
          </span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {progressSteps.slice(0, -1).map((step, index) => (
          <div
            key={index}
            className={cn(
              "w-3 h-3 rounded-full border-2 transition-all duration-300",
              index <= currentStep
                ? "bg-black border-black scale-110"
                : "bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
            )}
          />
        ))}
      </div>

      {/* Animated dots */}
      {!isCompleted && (
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className={cn(
                "w-2 h-2 bg-black rounded-full animate-pulse",
                `animation-delay-${dot * 200}`
              )}
              style={{ animationDelay: `${dot * 0.2}s` }}
            />
          ))}
        </div>
      )}

      {/* Success message */}
      {isCompleted && (
        <div className="text-center space-y-2 animate-fade-in">
          <p className="text-sm text-green-600 font-medium">
            La factura se abrirá en una nueva ventana
          </p>
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-green-600 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}