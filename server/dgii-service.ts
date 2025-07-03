import { db } from './db';
import { promises as fs } from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import * as zlib from 'zlib';
import * as https from 'https';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';

export interface NCFBatch {
  id?: number;
  tipo: 'B01' | 'B02' | 'B14' | 'B15' | 'E31' | 'E32' | 'E33' | 'E34' | 'E41' | 'E43' | 'E44' | 'E45';
  prefijo: string;
  inicio: number;
  fin: number;
  vencimiento: Date;
  companyId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NCFType {
  codigo: string;
  descripcion: string;
  aplicaCredito: boolean;
  aplicaConsumidor: boolean;
}

export interface RNCInfo {
  rnc: string;
  nombre: string;
  estado: 'Activo' | 'Suspendido' | 'Cancelado';
  tipo: string;
}

export class DGIIService {
  private static instance: DGIIService;
  private rncMap: Map<string, RNCInfo> = new Map();
  private lastUpdate: Date | null = null;
  private readonly configPath = './dgii.config.json';
  private readonly rncPath = './storage/dgii/rncs.txt';
  
  // NCF Types definitions for Dominican Republic
  private readonly ncfTypes: Record<string, NCFType> = {
    'B01': { codigo: 'B01', descripcion: 'Facturas con Valor Fiscal', aplicaCredito: true, aplicaConsumidor: false },
    'B02': { codigo: 'B02', descripcion: 'Facturas Consumidor Final', aplicaCredito: false, aplicaConsumidor: true },
    'B14': { codigo: 'B14', descripcion: 'Facturas Gubernamentales', aplicaCredito: true, aplicaConsumidor: false },
    'B15': { codigo: 'B15', descripcion: 'Facturas para Exportaciones', aplicaCredito: true, aplicaConsumidor: false },
    'E31': { codigo: 'E31', descripcion: 'Facturas de Compras', aplicaCredito: true, aplicaConsumidor: false },
    'E32': { codigo: 'E32', descripcion: 'Facturas para Gastos Menores', aplicaCredito: true, aplicaConsumidor: false },
    'E33': { codigo: 'E33', descripcion: 'Facturas de Gastos', aplicaCredito: true, aplicaConsumidor: false },
    'E34': { codigo: 'E34', descripcion: 'Notas de Débito', aplicaCredito: true, aplicaConsumidor: false },
    'E41': { codigo: 'E41', descripcion: 'Comprobantes de Compras', aplicaCredito: false, aplicaConsumidor: false },
    'E43': { codigo: 'E43', descripcion: 'Notas de Crédito que afectan al NCF Fiscal', aplicaCredito: true, aplicaConsumidor: false },
    'E44': { codigo: 'E44', descripcion: 'Notas de Crédito al Consumidor Final', aplicaCredito: false, aplicaConsumidor: true },
    'E45': { codigo: 'E45', descripcion: 'Comprobantes de Anulación', aplicaCredito: false, aplicaConsumidor: false }
  };

  private constructor() {}

  public static getInstance(): DGIIService {
    if (!DGIIService.instance) {
      DGIIService.instance = new DGIIService();
    }
    return DGIIService.instance;
  }

  // Initialize service and load RNC data
  public async initialize(): Promise<void> {
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Load RNC data if exists
      await this.loadRNCData();
      
      // Schedule automatic updates
      this.scheduleRNCUpdates();
      
      console.log('DGII Service initialized successfully');
    } catch (error) {
      console.error('Error initializing DGII Service:', error);
    }
  }

  private async ensureDirectories(): Promise<void> {
    const dgiiDir = path.dirname(this.rncPath);
    try {
      await fs.access(dgiiDir);
    } catch {
      await fs.mkdir(dgiiDir, { recursive: true });
    }
  }

  // NCF Generation Functions
  public generarSecuenciaNCF(batch: NCFBatch): string[] {
    const ncfList: string[] = [];
    for (let i = batch.inicio; i <= batch.fin; i++) {
      const consecutivo = i.toString().padStart(11, '0');
      ncfList.push(`${batch.prefijo}${consecutivo}`);
    }
    return ncfList;
  }

  public validarNCF(ncf: string, tipo: string): boolean {
    // Dominican Republic NCF format: XXX + 11 digits
    const pattern = /^[A-Z]\d{2}\d{11}$/;
    return pattern.test(ncf) && ncf.startsWith(tipo);
  }

  public getNCFTypes(): NCFType[] {
    return Object.values(this.ncfTypes);
  }

  public getNCFTypeInfo(codigo: string): NCFType | null {
    return this.ncfTypes[codigo] || null;
  }

  // RNC Validation Functions
  public async loadRNCData(): Promise<void> {
    try {
      const exists = await this.fileExists(this.rncPath);
      if (!exists) {
        console.log('RNC file not found. Please update from DGII.');
        return;
      }

      const data = await fs.readFile(this.rncPath, 'latin1');
      const lines = data.split('\n');
      
      this.rncMap.clear();
      
      lines.forEach(line => {
        if (line.trim()) {
          const [rnc, nombre, estado, tipo] = line.split('|').map(s => s.trim());
          if (rnc && nombre) {
            this.rncMap.set(rnc, {
              rnc,
              nombre,
              estado: (estado as RNCInfo['estado']) || 'Activo',
              tipo: tipo || 'PERSONA FISICA'
            });
          }
        }
      });

      this.lastUpdate = new Date();
      console.log(`Loaded ${this.rncMap.size} RNC records`);
    } catch (error) {
      console.error('Error loading RNC data:', error);
    }
  }

  public buscarRNC(rnc: string): RNCInfo | null {
    const cleaned = rnc.replace(/\D/g, '');
    return this.rncMap.get(cleaned) || null;
  }

  public validarRNC(rnc: string): { valido: boolean; info?: RNCInfo; mensaje?: string } {
    const cleaned = rnc.replace(/\D/g, '');
    
    // Basic format validation
    if (!cleaned || (cleaned.length !== 9 && cleaned.length !== 11)) {
      return { valido: false, mensaje: 'RNC debe tener 9 o 11 dígitos' };
    }

    const info = this.buscarRNC(cleaned);
    
    if (!info) {
      return { valido: false, mensaje: 'RNC no registrado en DGII' };
    }

    if (info.estado !== 'Activo') {
      return { valido: false, info, mensaje: `RNC ${info.estado}` };
    }

    return { valido: true, info };
  }

  // Download and update RNC data from DGII
  public async updateRNCData(): Promise<void> {
    const config = await this.loadConfig();
    const url = config.rnc.sourceUrl;

    try {
      console.log('Downloading RNC data from DGII...');
      
      const tempZipPath = path.join(path.dirname(this.rncPath), 'temp_rnc.zip');
      
      await this.downloadFile(url, tempZipPath);
      
      // Extract ZIP file (simplified - in production use proper zip library)
      // For now, assume direct text file
      await fs.rename(tempZipPath, this.rncPath);
      
      await this.loadRNCData();
      
      console.log('RNC data updated successfully');
    } catch (error) {
      console.error('Error updating RNC data:', error);
      throw error;
    }
  }

  private async downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(dest);
      
      https.get(url, response => {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', err => {
        fs.unlink(dest); // Delete incomplete file
        reject(err);
      });
    });
  }

  private scheduleRNCUpdates(): void {
    // Schedule daily updates at 3 AM
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(3, 0, 0, 0);
    
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    const timeout = scheduled.getTime() - now.getTime();
    
    setTimeout(() => {
      this.updateRNCData().catch(console.error);
      // Schedule next update
      setInterval(() => {
        this.updateRNCData().catch(console.error);
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeout);
  }

  // Report Generation Functions
  public async generarReporte606(fechaInicio: Date, fechaFin: Date, companyId: number): Promise<string> {
    const ventas = await this.getVentasPeriodo(fechaInicio, fechaFin, companyId);
    let contenido = '';
    let totalRegistros = 0;
    let montoTotal = 0;
    let itbisTotal = 0;

    ventas.forEach(v => {
      const fecha = this.formatDateRD(v.fecha);
      const tipoNCF = v.ncf.substring(0, 3);
      const rncCliente = v.rncCliente || '';
      
      contenido += `T|${tipoNCF}|${v.ncf}|${fecha}|${rncCliente}|`;
      contenido += `${this.formatAmount(v.total)}|${this.formatAmount(v.itbis)}|`;
      contenido += `${this.formatAmount(v.isc)}|${this.formatAmount(v.otros)}|`;
      contenido += `${this.formatAmount(v.propina)}|${v.formaPago}|`;
      contenido += `${v.numeroFacturaModificada || ''}|${v.tipoIngreso}|\n`;
      
      totalRegistros++;
      montoTotal += v.total;
      itbisTotal += v.itbis;
    });

    // Add footer with totals and checksum
    const checksum = this.calculateChecksum(contenido);
    contenido += `F|${totalRegistros}|${this.formatAmount(montoTotal)}|`;
    contenido += `${this.formatAmount(itbisTotal)}|${checksum}`;

    return contenido;
  }

  public async generarReporte607(fechaInicio: Date, fechaFin: Date, companyId: number): Promise<string> {
    const compras = await this.getComprasPeriodo(fechaInicio, fechaFin, companyId);
    let contenido = '';
    let totalRegistros = 0;
    let montoTotal = 0;
    let itbisTotal = 0;

    compras.forEach(c => {
      const fecha = this.formatDateRD(c.fecha);
      const tipoNCF = c.ncf.substring(0, 3);
      const rncProveedor = c.rncProveedor || '';
      
      contenido += `E|${tipoNCF}|${c.ncf}|${fecha}|${rncProveedor}|`;
      contenido += `${this.formatAmount(c.total)}|${this.formatAmount(c.itbis)}|`;
      contenido += `${this.formatAmount(c.isc)}|${this.formatAmount(c.otros)}|`;
      contenido += `${this.formatAmount(c.propina)}|${c.formaPago}|`;
      contenido += `${c.numeroFacturaModificada || ''}|${c.tipoGasto}|\n`;
      
      totalRegistros++;
      montoTotal += c.total;
      itbisTotal += c.itbis;
    });

    // Add footer
    const checksum = this.calculateChecksum(contenido);
    contenido += `F|${totalRegistros}|${this.formatAmount(montoTotal)}|`;
    contenido += `${this.formatAmount(itbisTotal)}|${checksum}`;

    return contenido;
  }

  public async generarTRegistro(mes: number, año: number, companyId: number): Promise<string> {
    const nominas = await this.getNominasPeriodo(mes, año, companyId);
    let contenido = '';

    nominas.forEach(n => {
      const cedula = this.formatCedula(n.cedula);
      const nombre = n.nombre.padEnd(40, ' ').substring(0, 40);
      const salario = this.formatAmount(n.salario);
      const sfs = this.formatAmount(n.sfs);
      const afp = this.formatAmount(n.afp);
      const isr = this.formatAmount(n.isr);
      const otros = this.formatAmount(n.otrasRetenciones);
      const periodo = `${año}${mes.toString().padStart(2, '0')}`;
      
      contenido += `${cedula}|${nombre}|${salario}|${sfs}|${afp}|${isr}|${otros}|${periodo}|\n`;
    });

    return contenido;
  }

  // Helper functions
  private formatDateRD(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  private formatCedula(cedula: string): string {
    // Ensure format XXX-XXXXXXX-X
    const cleaned = cedula.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 10)}-${cleaned.substring(10)}`;
    }
    return cedula;
  }

  private calculateChecksum(content: string): string {
    const hash = createHash('md5');
    hash.update(content);
    return hash.digest('hex').toUpperCase().substring(0, 8);
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async loadConfig(): Promise<any> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch {
      // Return default config
      return {
        rnc: {
          updateSchedule: "0 0 3 * * *",
          sourceUrl: "https://dgii.gov.do/app/WebApps/Consultas/rnc/DGII_RNC.zip",
          localPath: "./storage/dgii/rncs.txt"
        },
        reportes: {
          606: {
            campos: ["T", "TipoNCF", "NCF", "Fecha", "RNC", "Monto", "ITBIS"],
            separador: "|"
          },
          607: {
            campos: ["E", "TipoNCF", "NCF", "Fecha", "RNC", "Monto", "ITBIS"],
            separador: "|"
          },
          formatoFecha: "DD/MM/YYYY"
        }
      };
    }
  }

  // Database query functions (placeholders - implement with actual DB queries)
  private async getVentasPeriodo(inicio: Date, fin: Date, companyId: number): Promise<any[]> {
    // TODO: Implement actual database query
    return [];
  }

  private async getComprasPeriodo(inicio: Date, fin: Date, companyId: number): Promise<any[]> {
    // TODO: Implement actual database query
    return [];
  }

  private async getNominasPeriodo(mes: number, año: number, companyId: number): Promise<any[]> {
    // TODO: Implement actual database query
    return [];
  }

  // Utility function for RNC search with autocomplete
  public searchRNC(query: string, limit: number = 10): RNCInfo[] {
    const results: RNCInfo[] = [];
    const cleanedQuery = query.replace(/\D/g, '').toLowerCase();
    
    for (const [rnc, info] of Array.from(this.rncMap.entries())) {
      if (rnc.includes(cleanedQuery) || 
          info.nombre.toLowerCase().includes(query.toLowerCase())) {
        results.push(info);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  public getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  public getRNCCount(): number {
    return this.rncMap.size;
  }
}

// Create singleton instance
export const dgiiService = DGIIService.getInstance();

// Helper function for creating writeStream
function createWriteStream(path: string) {
  const { createWriteStream } = require('fs');
  return createWriteStream(path);
}