import { z } from "zod";

// Dominican Republic RNC validation
export const rncSchema = z.string().refine((rnc) => {
  // Remove any non-digit characters
  const cleanRnc = rnc.replace(/\D/g, '');
  
  // RNC should be 9 digits
  if (cleanRnc.length !== 9) return false;
  
  // Basic checksum validation for Dominican RNC
  // This is a simplified validation - real RNC validation is more complex
  const weights = [7, 9, 8, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanRnc[i]) * weights[i];
  }
  
  const remainder = sum % 11;
  let checkDigit = 11 - remainder;
  
  if (checkDigit >= 10) checkDigit -= 9;
  
  return parseInt(cleanRnc[8]) === checkDigit;
}, "RNC inválido");

// Dominican Republic Cedula validation
export const cedulaSchema = z.string().refine((cedula) => {
  // Remove any non-digit characters
  const cleanCedula = cedula.replace(/\D/g, '');
  
  // Cedula should be 11 digits
  if (cleanCedula.length !== 11) return false;
  
  // Basic checksum validation for Dominican Cedula
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
}, "Cédula inválida");

// Email validation
export const emailSchema = z.string().email("Email inválido").optional().or(z.literal(""));

// Phone validation (Dominican format)
export const phoneSchema = z.string().refine((phone) => {
  if (!phone) return true; // Optional field
  
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Dominican phone numbers are typically 10 digits (including area code)
  return cleanPhone.length === 10 && cleanPhone.startsWith('809') || 
         cleanPhone.startsWith('829') || cleanPhone.startsWith('849');
}, "Teléfono debe ser un número dominicano válido (809, 829, 849)");

// General validation utilities
export const requiredString = (message: string) => 
  z.string().min(1, message);

export const optionalString = z.string().optional();

export const positiveNumber = (message: string) => 
  z.number().positive(message);

export const nonNegativeNumber = (message: string) => 
  z.number().min(0, message);

// Currency validation (for DOP amounts)
export const currencySchema = z.string().refine((value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}, "Debe ser un monto válido");

// Date validation
export const dateSchema = z.string().refine((date) => {
  if (!date) return true; // Optional
  return !isNaN(Date.parse(date));
}, "Fecha inválida");

// NCF (Número de Comprobante Fiscal) validation
export const ncfSchema = z.string().refine((ncf) => {
  if (!ncf) return true; // Optional field
  
  // NCF format: E + 8 digits + 8 digits (sequence)
  // Example: E310000000001
  const ncfPattern = /^[BE]\d{10}$/;
  return ncfPattern.test(ncf);
}, "NCF debe tener el formato correcto (ej: B01000000001)");
