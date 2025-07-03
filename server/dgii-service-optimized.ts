import { db } from './db';
import { rncRegistry } from '../shared/schema';
import { eq, sql, like, or } from 'drizzle-orm';
import { promises as fs } from 'fs';
import * as path from 'path';

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

export class DGIIServiceOptimized {
  private static instance: DGIIServiceOptimized;
  private lastUpdate: Date | null = null;
  private readonly configPath = './dgii.config.json';
  
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
    'E41': { codigo: 'E41', descripcion: 'Comprobantes de Compras', aplicaCredito: false, aplicaConsumidor: false }
  };

  private constructor() {}

  public static getInstance(): DGIIServiceOptimized {
    if (!DGIIServiceOptimized.instance) {
      DGIIServiceOptimized.instance = new DGIIServiceOptimized();
    }
    return DGIIServiceOptimized.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Check RNC count in database - don't load into memory
      const count = await db.select({ count: sql<number>`count(*)` })
        .from(rncRegistry)
        .then(rows => rows[0]?.count || 0);
      
      console.log(`DGII Service initialized - ${count} RNC records available in database`);
      this.lastUpdate = new Date();
    } catch (error) {
      console.error('Error initializing DGII Service:', error);
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

  // Optimized RNC lookup - query database directly instead of loading all in memory
  public async buscarRNC(rnc: string): Promise<RNCInfo | null> {
    const cleaned = rnc.replace(/\D/g, '');
    
    try {
      // Try exact match first
      let result = await db.select()
        .from(rncRegistry)
        .where(eq(rncRegistry.rnc, cleaned))
        .limit(1);

      // If not found and 9 digits, try with "00" prefix
      if (!result.length && cleaned.length === 9) {
        result = await db.select()
          .from(rncRegistry)
          .where(eq(rncRegistry.rnc, '00' + cleaned))
          .limit(1);
      }

      // If not found and 11 digits with "00", try without prefix
      if (!result.length && cleaned.length === 11 && cleaned.startsWith('00')) {
        result = await db.select()
          .from(rncRegistry)
          .where(eq(rncRegistry.rnc, cleaned.substring(2)))
          .limit(1);
      }

      if (result.length > 0) {
        const row = result[0];
        return {
          rnc: row.rnc,
          nombre: row.razonSocial,
          estado: (row.estado as RNCInfo['estado']) || 'Activo',
          tipo: row.categoria || 'PERSONA FISICA'
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching RNC:', error);
      return null;
    }
  }

  public async validarRNC(rnc: string): Promise<{ valido: boolean; info?: RNCInfo; mensaje?: string }> {
    const cleaned = rnc.replace(/\D/g, '');
    
    // Basic format validation
    if (!cleaned || (cleaned.length !== 9 && cleaned.length !== 11)) {
      return { valido: false, mensaje: 'RNC debe tener 9 o 11 dígitos' };
    }

    const info = await this.buscarRNC(cleaned);
    
    if (!info) {
      return { valido: false, mensaje: 'RNC no registrado en DGII' };
    }

    if (info.estado !== 'Activo') {
      return { valido: false, info, mensaje: `RNC ${info.estado}` };
    }

    return { valido: true, info };
  }

  // Optimized search with database queries
  public async searchRNC(query: string, limit: number = 10): Promise<RNCInfo[]> {
    const cleanedQuery = query.replace(/\D/g, '');
    
    try {
      const results = await db.select()
        .from(rncRegistry)
        .where(
          or(
            like(rncRegistry.rnc, `%${cleanedQuery}%`),
            like(rncRegistry.razonSocial, `%${query}%`)
          )
        )
        .limit(limit);

      return results.map(row => ({
        rnc: row.rnc,
        nombre: row.razonSocial,
        estado: (row.estado as RNCInfo['estado']) || 'Activo',
        tipo: row.categoria || 'PERSONA FISICA'
      }));
    } catch (error) {
      console.error('Error searching RNC:', error);
      return [];
    }
  }

  public getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  public async getRNCCount(): Promise<number> {
    try {
      const count = await db.select({ count: sql<number>`count(*)` })
        .from(rncRegistry)
        .then(rows => rows[0]?.count || 0);
      return count;
    } catch (error) {
      console.error('Error getting RNC count:', error);
      return 0;
    }
  }

  // Generate 606 report
  public async generar606(companyId: number, month: number, year: number): Promise<any> {
    // Implementation for 606 report generation
    console.log('Generating 606 report for', { companyId, month, year });
    return {
      tipo: '606',
      periodo: `${year}${month.toString().padStart(2, '0')}`,
      registros: []
    };
  }

  // Generate 607 report
  public async generar607(companyId: number, month: number, year: number): Promise<any> {
    // Implementation for 607 report generation
    console.log('Generating 607 report for', { companyId, month, year });
    return {
      tipo: '607',
      periodo: `${year}${month.toString().padStart(2, '0')}`,
      registros: []
    };
  }
}

// Create singleton instance
export const dgiiServiceOptimized = DGIIServiceOptimized.getInstance();