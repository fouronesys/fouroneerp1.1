import { db } from './db';
import {
  accounts,
  accountTypes,
  journalEntries,
  companies,
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export class SimpleAccountingService {
  // Initialize basic chart of accounts for a company
  async initializeChartOfAccounts(companyId: number, userId: string) {
    try {
      // Create default account types
      const defaultAccountTypes = [
        { code: 'ACTIVO', name: 'Activo', normalBalance: 'DEBIT', description: 'Activos de la empresa' },
        { code: 'PASIVO', name: 'Pasivo', normalBalance: 'CREDIT', description: 'Pasivos de la empresa' },
        { code: 'PATRIMONIO', name: 'Patrimonio', normalBalance: 'CREDIT', description: 'Patrimonio de la empresa' },
        { code: 'INGRESOS', name: 'Ingresos', normalBalance: 'CREDIT', description: 'Ingresos de la empresa' },
        { code: 'GASTOS', name: 'Gastos', normalBalance: 'DEBIT', description: 'Gastos de la empresa' },
      ];

      // Insert account types if they don't exist
      for (const accountType of defaultAccountTypes) {
        await db.insert(accountTypes)
          .values(accountType)
          .onConflictDoNothing();
      }

      // Get account types for reference
      const accountTypesData = await db.select().from(accountTypes);
      const activoType = accountTypesData.find(at => at.code === 'ACTIVO')!;
      const pasivoType = accountTypesData.find(at => at.code === 'PASIVO')!;
      const patrimonioType = accountTypesData.find(at => at.code === 'PATRIMONIO')!;
      const ingresosType = accountTypesData.find(at => at.code === 'INGRESOS')!;
      const gastosType = accountTypesData.find(at => at.code === 'GASTOS')!;

      // Create main account groups
      const defaultAccounts = [
        // ACTIVOS
        { companyId, code: '1', name: 'ACTIVOS', accountTypeId: activoType.id, level: 1, isParent: true, allowTransactions: false, currentBalance: '0.00' },
        { companyId, code: '1.1', name: 'Activo Corriente', accountTypeId: activoType.id, level: 2, isParent: true, allowTransactions: false, currentBalance: '0.00' },
        { companyId, code: '1.1.1', name: 'Efectivo y Equivalentes', accountTypeId: activoType.id, level: 3, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        { companyId, code: '1.1.2', name: 'Cuentas por Cobrar', accountTypeId: activoType.id, level: 3, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        { companyId, code: '1.1.3', name: 'Inventario', accountTypeId: activoType.id, level: 3, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        
        // PASIVOS
        { companyId, code: '2', name: 'PASIVOS', accountTypeId: pasivoType.id, level: 1, isParent: true, allowTransactions: false, currentBalance: '0.00' },
        { companyId, code: '2.1', name: 'Pasivo Corriente', accountTypeId: pasivoType.id, level: 2, isParent: true, allowTransactions: false, currentBalance: '0.00' },
        { companyId, code: '2.1.1', name: 'Cuentas por Pagar', accountTypeId: pasivoType.id, level: 3, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        { companyId, code: '2.1.2', name: 'ITBIS por Pagar', accountTypeId: pasivoType.id, level: 3, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        
        // PATRIMONIO
        { companyId, code: '3', name: 'PATRIMONIO', accountTypeId: patrimonioType.id, level: 1, isParent: true, allowTransactions: false, currentBalance: '0.00' },
        { companyId, code: '3.1', name: 'Capital', accountTypeId: patrimonioType.id, level: 2, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        { companyId, code: '3.2', name: 'Utilidades Retenidas', accountTypeId: patrimonioType.id, level: 2, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        
        // INGRESOS
        { companyId, code: '4', name: 'INGRESOS', accountTypeId: ingresosType.id, level: 1, isParent: true, allowTransactions: false, currentBalance: '0.00' },
        { companyId, code: '4.1', name: 'Ingresos por Ventas', accountTypeId: ingresosType.id, level: 2, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        
        // GASTOS
        { companyId, code: '5', name: 'GASTOS', accountTypeId: gastosType.id, level: 1, isParent: true, allowTransactions: false, currentBalance: '0.00' },
        { companyId, code: '5.1', name: 'Costo de Ventas', accountTypeId: gastosType.id, level: 2, isParent: false, allowTransactions: true, currentBalance: '0.00' },
        { companyId, code: '5.2', name: 'Gastos Operacionales', accountTypeId: gastosType.id, level: 2, isParent: false, allowTransactions: true, currentBalance: '0.00' },
      ];

      // Insert accounts
      for (const account of defaultAccounts) {
        await db.insert(accounts)
          .values(account)
          .onConflictDoNothing();
      }

      return { success: true, message: 'Chart of accounts initialized successfully' };
    } catch (error) {
      console.error('Error initializing chart of accounts:', error);
      throw error;
    }
  }

  // Get accounts for a company
  async getAccounts(companyId: number) {
    return await db.select({
      id: accounts.id,
      code: accounts.code,
      name: accounts.name,
      accountType: accountTypes.name,
      currentBalance: accounts.currentBalance,
      allowTransactions: accounts.allowTransactions,
      level: accounts.level,
      isParent: accounts.isParent,
    })
    .from(accounts)
    .leftJoin(accountTypes, eq(accounts.accountTypeId, accountTypes.id))
    .where(eq(accounts.companyId, companyId))
    .orderBy(accounts.code);
  }

  // Get journal entries for a company
  async getJournalEntries(companyId: number) {
    return await db.select({
      id: journalEntries.id,
      entryNumber: journalEntries.entryNumber,
      reference: journalEntries.reference,
      description: journalEntries.description,
      entryDate: journalEntries.date,
      totalDebit: journalEntries.totalDebit,
      totalCredit: journalEntries.totalCredit,
      status: journalEntries.status,
      sourceModule: journalEntries.sourceModule,
    })
    .from(journalEntries)
    .where(eq(journalEntries.companyId, companyId))
    .orderBy(journalEntries.date);
  }
}

export const simpleAccountingService = new SimpleAccountingService();