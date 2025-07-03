import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCedulaValidation } from '@/hooks/useCedulaValidation';
import { CheckCircle, XCircle, Loader2, User, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CedulaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoValidate?: boolean;
  onValidationChange?: (isValid: boolean, citizen?: any) => void;
  required?: boolean;
  label?: string;
  error?: string;
}

export default function CedulaInput({
  value,
  onChange,
  placeholder = "000-0000000-0",
  disabled = false,
  className,
  autoValidate = true,
  onValidationChange,
  required = false,
  label,
  error: externalError
}: CedulaInputProps) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const {
    validateCedula,
    clearValidation,
    formatCedula,
    isValidFormat,
    isValidating,
    validationResult,
    isValid,
    error,
    citizen
  } = useCedulaValidation();

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid, citizen);
    }
  }, [isValid, citizen, onValidationChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Limpiar validación anterior
    if (validationResult) {
      clearValidation();
      setShowValidation(false);
    }

    // Limpiar timeout anterior
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Si autoValidate está habilitado y el formato es válido, validar después de 1 segundo
    if (autoValidate && isValidFormat(inputValue)) {
      const timeout = setTimeout(() => {
        handleValidation(inputValue);
      }, 1000);
      setValidationTimeout(timeout);
    }
  };

  const handleValidation = async (cedulaToValidate?: string) => {
    const targetCedula = cedulaToValidate || value;
    if (!targetCedula || !isValidFormat(targetCedula)) {
      return;
    }

    setShowValidation(true);
    await validateCedula(targetCedula);
  };

  const handleManualValidation = () => {
    handleValidation();
  };

  const formatAndSet = () => {
    if (value && isValidFormat(value)) {
      onChange(formatCedula(value));
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (showValidation && validationResult) {
      return isValid ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      );
    }
    return null;
  };

  const getValidationBadge = () => {
    if (!showValidation || !validationResult) return null;

    if (isValid && citizen) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <User className="h-3 w-3 mr-1" />
          {citizen.fullName || `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim()}
        </Badge>
      );
    }

    if (!isValid && error) {
      return (
        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          {error}
        </Badge>
      );
    }

    return null;
  };

  const hasError = externalError || (showValidation && !isValid);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={formatAndSet}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-20",
            hasError && "border-red-500 focus-visible:ring-red-500",
            isValid && showValidation && "border-green-500 focus-visible:ring-green-500",
            className
          )}
          maxLength={13} // 11 dígitos + 2 guiones
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {getValidationIcon()}
          {!autoValidate && isValidFormat(value) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleManualValidation}
              disabled={isValidating}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Mostrar badge de validación */}
      {getValidationBadge()}

      {/* Mostrar error externo */}
      {externalError && (
        <p className="text-sm text-red-600">{externalError}</p>
      )}

      {/* Ayuda de formato */}
      {!value && (
        <p className="text-xs text-muted-foreground">
          Formato: 000-0000000-0 (11 dígitos)
        </p>
      )}
    </div>
  );
}