import fetch from 'node-fetch';

export interface CedulaValidationResponse {
  isValid: boolean;
  citizen?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    cedula: string;
  };
  error?: string;
}

export class CedulaValidationService {
  private static readonly API_BASE_URL = 'https://api.digital.gob.do';
  private static readonly API_KEY = process.env.DIGITAL_GOB_API_KEY; // Usar variable de entorno para la API key

  /**
   * Valida una cédula dominicana usando la API oficial del gobierno
   */
  static async validateCedula(cedula: string): Promise<CedulaValidationResponse> {
    try {
      // Limpiar la cédula (remover guiones y espacios)
      const cleanCedula = cedula.replace(/[\s-]/g, '');
      
      // Validar formato básico (11 dígitos)
      if (!/^\d{11}$/.test(cleanCedula)) {
        return {
          isValid: false,
          error: 'La cédula debe tener 11 dígitos'
        };
      }

      // Si no hay API key configurada, hacer solo validación local básica
      if (!this.API_KEY) {
        console.warn('DIGITAL_GOB_API_KEY not configured - usando validación local básica');
        const localValidation = this.validateCedulaLocally(cleanCedula);
        return {
          isValid: localValidation.isValid,
          citizen: localValidation.isValid ? {
            cedula: cleanCedula,
            fullName: 'Ciudadano Verificado (Local)'
          } : undefined,
          error: localValidation.error
        };
      }

      // Hacer la llamada a la API oficial
      const response = await fetch(`${this.API_BASE_URL}/citizens/${cleanCedula}/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Four-One-Solutions-ERP/1.0'
        },
        timeout: 10000 // 10 segundos de timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            isValid: false,
            error: 'Cédula no encontrada en el registro oficial'
          };
        }
        
        if (response.status === 429) {
          return {
            isValid: false,
            error: 'Límite de consultas excedido. Intente más tarde'
          };
        }

        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Procesar respuesta de la API oficial
      return {
        isValid: true,
        citizen: {
          cedula: cleanCedula,
          firstName: data.firstName || data.nombres || '',
          lastName: data.lastName || data.apellidos || '',
          fullName: data.fullName || data.nombreCompleto || `${data.firstName || ''} ${data.lastName || ''}`.trim()
        }
      };

    } catch (error) {
      console.error('Error validating cedula:', error);
      
      // En caso de error de API, hacer validación local como fallback
      const localValidation = this.validateCedulaLocally(cedula.replace(/[\s-]/g, ''));
      
      return {
        isValid: localValidation.isValid,
        citizen: localValidation.isValid ? {
          cedula: cedula.replace(/[\s-]/g, ''),
          fullName: 'Ciudadano Verificado (Offline)'
        } : undefined,
        error: localValidation.isValid ? undefined : localValidation.error || 'Error de conexión con el servicio de validación'
      };
    }
  }

  /**
   * Validación local básica usando el algoritmo de verificación de cédulas dominicanas
   */
  private static validateCedulaLocally(cedula: string): { isValid: boolean; error?: string } {
    // Remover espacios y guiones
    const cleanCedula = cedula.replace(/[\s-]/g, '');
    
    // Verificar que tenga 11 dígitos
    if (!/^\d{11}$/.test(cleanCedula)) {
      return {
        isValid: false,
        error: 'La cédula debe tener 11 dígitos'
      };
    }

    // Verificar dígito verificador usando algoritmo oficial dominicano
    const digits = cleanCedula.split('').map(Number);
    const checkDigit = digits[10];
    
    // Multiplicadores para el algoritmo de validación
    const multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let product = digits[i] * multipliers[i];
      if (product > 9) {
        product = Math.floor(product / 10) + (product % 10);
      }
      sum += product;
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    
    if (calculatedCheckDigit !== checkDigit) {
      return {
        isValid: false,
        error: 'Cédula inválida: dígito verificador incorrecto'
      };
    }

    return { isValid: true };
  }

  /**
   * Formatea una cédula para mostrar (XXX-XXXXXXX-X)
   */
  static formatCedula(cedula: string): string {
    const clean = cedula.replace(/[\s-]/g, '');
    if (clean.length === 11) {
      return `${clean.substring(0, 3)}-${clean.substring(3, 10)}-${clean.substring(10)}`;
    }
    return cedula;
  }

  /**
   * Verifica si una cédula tiene un formato válido (antes de hacer la llamada a la API)
   */
  static isValidFormat(cedula: string): boolean {
    const clean = cedula.replace(/[\s-]/g, '');
    return /^\d{11}$/.test(clean);
  }
}