/**
 * Dominican Republic specific utilities for RNC, Cedula, and other local validations
 */

// RNC (Registro Nacional del Contribuyente) utilities
export function validateRNC(rnc: string): boolean {
  if (!rnc) return false;
  
  // Remove any non-digit characters and dashes
  const cleanRnc = rnc.replace(/\D/g, '');
  
  // RNC should be 9 digits
  if (cleanRnc.length !== 9) return false;
  
  // Validate using the official RNC algorithm
  const weights = [7, 9, 8, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanRnc[i]) * weights[i];
  }
  
  const remainder = sum % 11;
  let checkDigit = 11 - remainder;
  
  if (checkDigit >= 10) checkDigit -= 9;
  
  return parseInt(cleanRnc[8]) === checkDigit;
}

export function formatRNC(rnc: string): string {
  if (!rnc) return '';
  
  const cleanRnc = rnc.replace(/\D/g, '');
  if (cleanRnc.length !== 9) return rnc;
  
  // Format as XXX-XXXXX-X
  return `${cleanRnc.slice(0, 3)}-${cleanRnc.slice(3, 8)}-${cleanRnc.slice(8)}`;
}

// Cedula utilities
export function validateCedula(cedula: string): boolean {
  if (!cedula) return false;
  
  // Remove any non-digit characters
  const cleanCedula = cedula.replace(/\D/g, '');
  
  // Cedula should be 11 digits
  if (cleanCedula.length !== 11) return false;
  
  // Validate using the official Cedula algorithm
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    let product = parseInt(cleanCedula[i]) * weights[i];
    if (product >= 10) {
      product = Math.floor(product / 10) + (product % 10);
    }
    sum += product;
  }
  
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  
  return parseInt(cleanCedula[10]) === checkDigit;
}

export function formatCedula(cedula: string): string {
  if (!cedula) return '';
  
  const cleanCedula = cedula.replace(/\D/g, '');
  if (cleanCedula.length !== 11) return cedula;
  
  // Format as XXX-XXXXXXX-X
  return `${cleanCedula.slice(0, 3)}-${cleanCedula.slice(3, 10)}-${cleanCedula.slice(10)}`;
}

// Phone number utilities
export function validateDominicanPhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Dominican phone numbers are 10 digits with specific area codes
  if (cleanPhone.length !== 10) return false;
  
  const validAreaCodes = ['809', '829', '849'];
  const areaCode = cleanPhone.slice(0, 3);
  
  return validAreaCodes.includes(areaCode);
}

export function formatDominicanPhone(phone: string): string {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) return phone;
  
  // Format as (XXX) XXX-XXXX
  return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
}

// Currency utilities for Dominican Peso (DOP)
export function formatDOP(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return 'RD$ 0.00';
  
  // Redondear hacia arriba usando Math.ceil para centavos
  const roundedAmount = Math.ceil(num * 100) / 100;
  
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundedAmount);
}

export function formatUSD(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return 'US$ 0.00';
  
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

// NCF (Número de Comprobante Fiscal) utilities
export function validateNCF(ncf: string): boolean {
  if (!ncf) return true; // Optional field
  
  // NCF format patterns for different document types
  const patterns = {
    // Facturas de Crédito Fiscal
    creditFiscal: /^B01\d{8}$/,
    // Facturas de Consumo
    consumer: /^B02\d{8}$/,
    // Notas de Débito
    debitNote: /^B03\d{8}$/,
    // Notas de Crédito
    creditNote: /^B04\d{8}$/,
    // Comprobantes de Compras
    purchase: /^B11\d{8}$/,
    // Registro Único de Ingresos
    income: /^B12\d{8}$/,
    // Comprobantes para Gastos Menores
    minorExpenses: /^B13\d{8}$/,
    // Comprobantes de Regímenes Especiales
    specialRegime: /^B14\d{8}$/,
    // Comprobantes Gubernamentales
    government: /^B15\d{8}$/,
  };
  
  return Object.values(patterns).some(pattern => pattern.test(ncf));
}

export function generateNCF(type: string, sequence?: number): string {
  const types = {
    'credit_fiscal': 'B01',
    'consumer': 'B02',
    'debit_note': 'B03',
    'credit_note': 'B04',
    'purchase': 'B11',
    'income': 'B12',
    'minor_expenses': 'B13',
    'special_regime': 'B14',
    'government': 'B15',
  };
  
  const prefix = types[type as keyof typeof types] || 'B02';
  const safeSequence = sequence || Math.floor(Math.random() * 99999999) + 1;
  const sequenceStr = safeSequence.toString().padStart(8, '0');
  
  return `${prefix}${sequenceStr}`;
}

// ITBIS (Dominican VAT) utilities
export const ITBIS_RATE = 0.18; // 18% ITBIS rate

export function calculateITBIS(subtotal: number, taxType: string = "itbis_18"): number {
  switch (taxType) {
    case "included":
      // ITBIS incluído - devolver 0 para no sumar adicional
      return 0;
    case "no_itbis":
      // Sin ITBIS
      return 0;
    case "itbis_18":
      // 18% ITBIS
      const itbis = subtotal * ITBIS_RATE;
      return Math.ceil(itbis * 100) / 100;
    case "tip_10":
      // 10% propina
      const tip = subtotal * 0.10;
      return Math.ceil(tip * 100) / 100;
    case "itbis_18_tip_10":
      // 18% ITBIS + 10% propina
      const combined = subtotal * 0.28;
      return Math.ceil(combined * 100) / 100;
    default:
      const defaultItbis = subtotal * ITBIS_RATE;
      return Math.ceil(defaultItbis * 100) / 100;
  }
}

// Función para calcular el ITBIS implícito cuando está incluido en el precio
export function calculateIncludedITBIS(totalWithTax: number): number {
  // El precio incluye 18% de ITBIS
  // Total = Base + (Base * 0.18) = Base * 1.18
  // ITBIS = Total - Base = Total - (Total / 1.18)
  const basePrice = totalWithTax / 1.18;
  const itbis = totalWithTax - basePrice;
  return Math.ceil(itbis * 100) / 100;
}

export function calculateSubtotalFromTotal(totalWithITBIS: number): number {
  const subtotal = totalWithITBIS / (1 + ITBIS_RATE);
  // Redondear hacia arriba para subtotal
  return Math.ceil(subtotal * 100) / 100;
}

export function calculateITBISFromTotal(totalWithITBIS: number): number {
  const subtotal = calculateSubtotalFromTotal(totalWithITBIS);
  const itbis = totalWithITBIS - subtotal;
  // Redondear hacia arriba para ITBIS
  return Math.ceil(itbis * 100) / 100;
}

// Date utilities for Dominican locale
export function formatDominicanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDominicanDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
