import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface CedulaValidationResult {
  isValid: boolean;
  citizen?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    cedula: string;
  };
  error?: string;
}

export function useCedulaValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CedulaValidationResult | null>(null);

  const validateCedula = useCallback(async (cedula: string): Promise<CedulaValidationResult> => {
    if (!cedula || cedula.trim().length === 0) {
      const result = { isValid: false, error: 'Cédula es requerida' };
      setValidationResult(result);
      return result;
    }

    // Validación básica de formato local antes de hacer la llamada
    const cleanCedula = cedula.replace(/[\s-]/g, '');
    if (!/^\d{11}$/.test(cleanCedula)) {
      const result = { isValid: false, error: 'La cédula debe tener 11 dígitos' };
      setValidationResult(result);
      return result;
    }

    setIsValidating(true);
    try {
      const response = await fetch(`/api/verify-cedula/${encodeURIComponent(cedula)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json() as CedulaValidationResult;
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error validating cedula:', error);
      const result = { 
        isValid: false, 
        error: 'Error de conexión al validar la cédula. Intente nuevamente.' 
      };
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  const formatCedula = useCallback((cedula: string): string => {
    const clean = cedula.replace(/[\s-]/g, '');
    if (clean.length === 11) {
      return `${clean.substring(0, 3)}-${clean.substring(3, 10)}-${clean.substring(10)}`;
    }
    return cedula;
  }, []);

  const isValidFormat = useCallback((cedula: string): boolean => {
    const clean = cedula.replace(/[\s-]/g, '');
    return /^\d{11}$/.test(clean);
  }, []);

  return {
    validateCedula,
    clearValidation,
    formatCedula,
    isValidFormat,
    isValidating,
    validationResult,
    isValid: validationResult?.isValid ?? false,
    error: validationResult?.error,
    citizen: validationResult?.citizen
  };
}