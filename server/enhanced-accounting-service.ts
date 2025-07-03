import { db } from "./db";
import { storage } from "./storage";
import { 
  accounts, 
  journalEntries, 
  journalEntryLines, 
  supportDocuments,
  financialReports,
  dgiiCompliance,
  dgiiChartOfAccounts,
  type Account,
  type JournalEntry,
  type InsertJournalEntry,
  type InsertJournalEntryLine,
  type InsertSupportDocument,
  type InsertFinancialReport,
  type InsertDgiiCompliance
} from "../shared/schema";
import { eq, and, sql, desc, asc, gte, lte, between } from "drizzle-orm";
import fs from "fs";
import path from "path";

/**
 * Enhanced Accounting Service - Compliant with DGII standards
 * Implements complete chart of accounts, automatic journal entries, and financial reporting
 */
export class EnhancedAccountingService {
  
  /**
   * Initialize DGII-compliant chart of accounts for a company
   */
  async initializeDGIIChartOfAccounts(companyId: number, userId: string) {
    const dgiiAccounts = [
      // ACTIVOS (1xxxxx)
      { code: "110000", name: "ACTIVOS CORRIENTES", category: "ACTIVO", subcategory: "Corriente", level: 1, parentCode: null },
      { code: "110100", name: "EFECTIVO Y EQUIVALENTES", category: "ACTIVO", subcategory: "Corriente", level: 2, parentCode: "110000" },
      { code: "110101", name: "Caja General RD$", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "110100" },
      { code: "110102", name: "Caja General US$", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "110100" },
      { code: "110103", name: "Caja Chica RD$", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "110100" },
      { code: "110201", name: "Banco Popular - Cta. Corriente RD$", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "110100" },
      { code: "110202", name: "Banco BHD - Cta. Corriente US$", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "110100" },
      
      { code: "120000", name: "CUENTAS POR COBRAR", category: "ACTIVO", subcategory: "Corriente", level: 2, parentCode: "110000" },
      { code: "120101", name: "Clientes Nacionales", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "120000" },
      { code: "120102", name: "Clientes del Exterior", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "120000" },
      { code: "120201", name: "Otras Cuentas por Cobrar", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "120000" },
      
      { code: "130000", name: "INVENTARIOS", category: "ACTIVO", subcategory: "Corriente", level: 2, parentCode: "110000" },
      { code: "130101", name: "Inventario de Mercancías", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "130000" },
      { code: "130102", name: "Inventario de Materia Prima", category: "ACTIVO", subcategory: "Corriente", level: 3, parentCode: "130000" },
      
      { code: "140000", name: "ACTIVOS NO CORRIENTES", category: "ACTIVO", subcategory: "No Corriente", level: 1, parentCode: null },
      { code: "140101", name: "Propiedad, Planta y Equipos", category: "ACTIVO", subcategory: "No Corriente", level: 2, parentCode: "140000" },
      { code: "140201", name: "Depreciación Acumulada", category: "ACTIVO", subcategory: "No Corriente", level: 2, parentCode: "140000" },
      
      // PASIVOS (2xxxxx)
      { code: "210000", name: "PASIVOS CORRIENTES", category: "PASIVO", subcategory: "Corriente", level: 1, parentCode: null },
      { code: "210101", name: "Cuentas por Pagar Proveedores", category: "PASIVO", subcategory: "Corriente", level: 2, parentCode: "210000" },
      { code: "210102", name: "ITBIS por Pagar", category: "PASIVO", subcategory: "Corriente", level: 2, parentCode: "210000" },
      { code: "210103", name: "ISR por Pagar", category: "PASIVO", subcategory: "Corriente", level: 2, parentCode: "210000" },
      { code: "210104", name: "Nóminas por Pagar", category: "PASIVO", subcategory: "Corriente", level: 2, parentCode: "210000" },
      { code: "210105", name: "SFS por Pagar", category: "PASIVO", subcategory: "Corriente", level: 2, parentCode: "210000" },
      { code: "210106", name: "AFP por Pagar", category: "PASIVO", subcategory: "Corriente", level: 2, parentCode: "210000" },
      
      { code: "220000", name: "PASIVOS NO CORRIENTES", category: "PASIVO", subcategory: "Largo Plazo", level: 1, parentCode: null },
      { code: "220101", name: "Préstamos Bancarios LP", category: "PASIVO", subcategory: "Largo Plazo", level: 2, parentCode: "220000" },
      
      // PATRIMONIO (3xxxxx)
      { code: "310000", name: "PATRIMONIO", category: "PATRIMONIO", subcategory: "Capital", level: 1, parentCode: null },
      { code: "310101", name: "Capital Social", category: "PATRIMONIO", subcategory: "Capital", level: 2, parentCode: "310000" },
      { code: "310201", name: "Utilidades Retenidas", category: "PATRIMONIO", subcategory: "Utilidades", level: 2, parentCode: "310000" },
      { code: "310301", name: "Utilidad del Ejercicio", category: "PATRIMONIO", subcategory: "Utilidades", level: 2, parentCode: "310000" },
      
      // INGRESOS (4xxxxx)
      { code: "410000", name: "INGRESOS OPERACIONALES", category: "INGRESO", subcategory: "Ventas", level: 1, parentCode: null },
      { code: "410101", name: "Ventas de Mercancías", category: "INGRESO", subcategory: "Ventas", level: 2, parentCode: "410000" },
      { code: "410102", name: "Ventas de Servicios", category: "INGRESO", subcategory: "Ventas", level: 2, parentCode: "410000" },
      { code: "410103", name: "Ventas al Exterior", category: "INGRESO", subcategory: "Ventas", level: 2, parentCode: "410000" },
      
      { code: "420000", name: "INGRESOS NO OPERACIONALES", category: "INGRESO", subcategory: "No Operacionales", level: 1, parentCode: null },
      { code: "420101", name: "Ingresos Financieros", category: "INGRESO", subcategory: "No Operacionales", level: 2, parentCode: "420000" },
      { code: "420102", name: "Ingresos por Diferencia Cambiaria", category: "INGRESO", subcategory: "No Operacionales", level: 2, parentCode: "420000" },
      
      // GASTOS (5xxxxx)
      { code: "510000", name: "COSTO DE VENTAS", category: "GASTO", subcategory: "Operativos", level: 1, parentCode: null },
      { code: "510101", name: "Costo de Mercancías Vendidas", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "510000" },
      
      { code: "520000", name: "GASTOS OPERACIONALES", category: "GASTO", subcategory: "Operativos", level: 1, parentCode: null },
      { code: "520101", name: "Sueldos y Salarios", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "520000" },
      { code: "520102", name: "SFS Patronal", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "520000" },
      { code: "520103", name: "AFP Patronal", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "520000" },
      { code: "520104", name: "Alquiler de Local", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "520000" },
      { code: "520105", name: "Servicios Públicos", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "520000" },
      { code: "520106", name: "Telecomunicaciones", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "520000" },
      { code: "520107", name: "Depreciación", category: "GASTO", subcategory: "Operativos", level: 2, parentCode: "520000" },
      
      { code: "530000", name: "GASTOS FINANCIEROS", category: "GASTO", subcategory: "Financieros", level: 1, parentCode: null },
      { code: "530101", name: "Intereses Bancarios", category: "GASTO", subcategory: "Financieros", level: 2, parentCode: "530000" },
      { code: "530102", name: "Comisiones Bancarias", category: "GASTO", subcategory: "Financieros", level: 2, parentCode: "530000" },
    ];

    // Insert DGII official chart first
    for (const account of dgiiAccounts) {
      await db.insert(dgiiChartOfAccounts).values({
        ...account,
        description: `Cuenta oficial DGII: ${account.name}`
      }).onConflictDoNothing();
    }

    // Create company-specific accounts based on DGII chart
    const companyAccounts = dgiiAccounts.map(dgiiAccount => ({
      companyId,
      code: dgiiAccount.code,
      name: dgiiAccount.name,
      description: dgiiAccount.description || `Cuenta ${dgiiAccount.name}`,
      dgiiCode: dgiiAccount.code,
      category: dgiiAccount.category,
      subcategory: dgiiAccount.subcategory,
      level: dgiiAccount.level,
      parentAccountId: null, // Will be set after accounts are created
      isParent: dgiiAccount.level < 3,
      allowTransactions: dgiiAccount.level === 3, // Only leaf accounts allow transactions
      currentBalance: "0.00",
      searchableText: `${dgiiAccount.code} ${dgiiAccount.name} ${dgiiAccount.category} ${dgiiAccount.subcategory}`.toLowerCase(),
      isActive: true
    }));

    await db.insert(accounts).values(companyAccounts).onConflictDoNothing();

    console.log(`DGII Chart of Accounts initialized for company ${companyId}`);
    return { success: true, accountsCreated: companyAccounts.length };
  }

  /**
   * Search accounts with smart filtering
   */
  async searchAccounts(companyId: number, query: string, category?: string) {
    let whereCondition = eq(accounts.companyId, companyId);
    
    if (category) {
      whereCondition = and(whereCondition, eq(accounts.category, category));
    }

    if (query) {
      const searchText = query.toLowerCase();
      whereCondition = and(
        whereCondition,
        sql`${accounts.searchableText} LIKE ${`%${searchText}%`}`
      );
    }

    return await db.select()
      .from(accounts)
      .where(whereCondition)
      .orderBy(asc(accounts.code));
  }

  /**
   * Create automatic journal entry for POS sales
   */
  async createPOSSaleJournalEntry(saleId: number, companyId: number, userId: string) {
    const sale = await storage.getPOSSale(saleId);
    if (!sale) throw new Error("Sale not found");

    const accountsList = await db.select().from(accounts).where(eq(accounts.companyId, companyId));
    const accountMap = new Map(accountsList.map(acc => [acc.dgiiCode || acc.code, acc]));

    // Find required accounts
    const cajaAccount = accountMap.get("110101"); // Caja General RD$
    const ventasAccount = accountMap.get("410101"); // Ventas de Mercancías
    const itbisPorPagarAccount = accountMap.get("210102"); // ITBIS por Pagar
    const costoVentasAccount = accountMap.get("510101"); // Costo de Mercancías Vendidas
    const inventarioAccount = accountMap.get("130101"); // Inventario de Mercancías

    if (!cajaAccount || !ventasAccount || !itbisPorPagarAccount) {
      throw new Error("Required accounts not found for POS sale journal entry");
    }

    const subtotal = parseFloat(sale.subtotal || "0");
    const itbis = parseFloat(sale.itbis || "0");
    const total = parseFloat(sale.total || "0");

    // Create journal entry
    const entryNumber = `POS-${sale.id}-${Date.now()}`;
    const journalEntry: InsertJournalEntry = {
      companyId,
      entryNumber,
      reference: sale.ncf || `Venta POS #${sale.id}`,
      description: `Venta POS - ${sale.customerName || 'Cliente General'}`,
      date: sale.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      totalAmount: total.toString(),
      totalDebit: total.toString(),
      totalCredit: total.toString(),
      status: "posted",
      sourceModule: "pos",
      sourceId: sale.id,
      createdBy: userId
    };

    const [newEntry] = await db.insert(journalEntries).values(journalEntry).returning();

    // Create journal entry lines
    const lines: InsertJournalEntryLine[] = [
      // Debit: Caja (total amount)
      {
        journalEntryId: newEntry.id,
        accountId: cajaAccount.id,
        description: `Cobro venta POS ${sale.ncf || '#' + sale.id}`,
        debitAmount: total.toString(),
        creditAmount: "0.00",
        lineNumber: 1
      },
      // Credit: Ventas (subtotal)
      {
        journalEntryId: newEntry.id,
        accountId: ventasAccount.id,
        description: `Venta mercancías ${sale.ncf || '#' + sale.id}`,
        debitAmount: "0.00",
        creditAmount: subtotal.toString(),
        lineNumber: 2
      }
    ];

    // Add ITBIS line if applicable
    if (itbis > 0) {
      lines.push({
        journalEntryId: newEntry.id,
        accountId: itbisPorPagarAccount.id,
        description: `ITBIS venta ${sale.ncf || '#' + sale.id}`,
        debitAmount: "0.00",
        creditAmount: itbis.toString(),
        lineNumber: 3
      });
    }

    await db.insert(journalEntryLines).values(lines);

    // Create DGII compliance record
    await this.createDGIIComplianceRecord({
      companyId,
      transactionId: sale.id,
      transactionType: "VENTA",
      ncf: sale.ncf || "",
      itbisAmount: itbis.toString(),
      itbisRate: "0.18",
      retentionAmount: "0.00",
      reportPeriod: new Date().toISOString().substring(0, 7), // YYYY-MM
      isReported: false
    });

    return newEntry;
  }

  /**
   * Create DGII compliance record
   */
  async createDGIIComplianceRecord(data: InsertDgiiCompliance) {
    return await db.insert(dgiiCompliance).values(data).returning();
  }

  /**
   * Generate Balance Sheet (Balance General)
   */
  async generateBalanceSheet(companyId: number, asOfDate: Date = new Date()) {
    const asOfDateStr = asOfDate.toISOString().split('T')[0];
    
    // Get all accounts with balances
    const accountsWithBalances = await db.select({
      id: accounts.id,
      code: accounts.code,
      name: accounts.name,
      category: accounts.category,
      subcategory: accounts.subcategory,
      currentBalance: accounts.currentBalance
    })
    .from(accounts)
    .where(and(
      eq(accounts.companyId, companyId),
      eq(accounts.isActive, true)
    ))
    .orderBy(asc(accounts.code));

    // Group by category
    const balanceSheet = {
      activos: {
        corrientes: accountsWithBalances.filter(acc => acc.category === 'ACTIVO' && acc.subcategory === 'Corriente'),
        noCorrientes: accountsWithBalances.filter(acc => acc.category === 'ACTIVO' && acc.subcategory === 'No Corriente'),
        total: 0
      },
      pasivos: {
        corrientes: accountsWithBalances.filter(acc => acc.category === 'PASIVO' && acc.subcategory === 'Corriente'),
        largoplazo: accountsWithBalances.filter(acc => acc.category === 'PASIVO' && acc.subcategory === 'Largo Plazo'),
        total: 0
      },
      patrimonio: {
        capital: accountsWithBalances.filter(acc => acc.category === 'PATRIMONIO'),
        total: 0
      }
    };

    // Calculate totals
    balanceSheet.activos.total = balanceSheet.activos.corrientes.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0) +
                                 balanceSheet.activos.noCorrientes.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0);
    
    balanceSheet.pasivos.total = balanceSheet.pasivos.corrientes.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0) +
                                balanceSheet.pasivos.largoplazo.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0);
    
    balanceSheet.patrimonio.total = balanceSheet.patrimonio.capital.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0);

    // Save as financial report
    const reportData: InsertFinancialReport = {
      companyId,
      reportType: "BALANCE_GENERAL",
      reportName: `Balance General al ${asOfDate.toLocaleDateString('es-DO')}`,
      periodo: asOfDate.toISOString().substring(0, 7),
      startDate: asOfDateStr,
      endDate: asOfDateStr,
      reportData: balanceSheet,
      generatedBy: "system" // Should be passed as parameter
    };

    const [savedReport] = await db.insert(financialReports).values(reportData).returning();

    return {
      report: balanceSheet,
      savedReport
    };
  }

  /**
   * Generate Income Statement (Estado de Resultados)
   */
  async generateIncomeStatement(companyId: number, startDate: Date, endDate: Date) {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get income and expense accounts with activity in the period
    const accountsWithActivity = await db.select({
      id: accounts.id,
      code: accounts.code,
      name: accounts.name,
      category: accounts.category,
      subcategory: accounts.subcategory,
      currentBalance: accounts.currentBalance
    })
    .from(accounts)
    .where(and(
      eq(accounts.companyId, companyId),
      eq(accounts.isActive, true),
      sql`${accounts.category} IN ('INGRESO', 'GASTO')`
    ))
    .orderBy(asc(accounts.code));

    const incomeStatement = {
      ingresos: {
        operacionales: accountsWithActivity.filter(acc => acc.category === 'INGRESO' && acc.subcategory === 'Ventas'),
        noOperacionales: accountsWithActivity.filter(acc => acc.category === 'INGRESO' && acc.subcategory === 'No Operacionales'),
        total: 0
      },
      gastos: {
        costoVentas: accountsWithActivity.filter(acc => acc.category === 'GASTO' && acc.subcategory === 'Operativos' && acc.code.startsWith('51')),
        operacionales: accountsWithActivity.filter(acc => acc.category === 'GASTO' && acc.subcategory === 'Operativos' && acc.code.startsWith('52')),
        financieros: accountsWithActivity.filter(acc => acc.category === 'GASTO' && acc.subcategory === 'Financieros'),
        total: 0
      },
      utilidadNeta: 0
    };

    // Calculate totals
    incomeStatement.ingresos.total = incomeStatement.ingresos.operacionales.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0) +
                                   incomeStatement.ingresos.noOperacionales.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0);

    incomeStatement.gastos.total = [
      ...incomeStatement.gastos.costoVentas,
      ...incomeStatement.gastos.operacionales,
      ...incomeStatement.gastos.financieros
    ].reduce((sum, acc) => sum + parseFloat(acc.currentBalance || "0"), 0);

    incomeStatement.utilidadNeta = incomeStatement.ingresos.total - incomeStatement.gastos.total;

    // Save as financial report
    const reportData: InsertFinancialReport = {
      companyId,
      reportType: "ESTADO_RESULTADOS",
      reportName: `Estado de Resultados ${startDate.toLocaleDateString('es-DO')} - ${endDate.toLocaleDateString('es-DO')}`,
      periodo: startDate.toISOString().substring(0, 7),
      startDate: startDateStr,
      endDate: endDateStr,
      reportData: incomeStatement,
      generatedBy: "system"
    };

    const [savedReport] = await db.insert(financialReports).values(reportData).returning();

    return {
      report: incomeStatement,
      savedReport
    };
  }

  /**
   * Attach support document to journal entry
   */
  async attachSupportDocument(documentData: InsertSupportDocument) {
    return await db.insert(supportDocuments).values(documentData).returning();
  }

  /**
   * Validate journal entry (double-entry bookkeeping)
   */
  validateJournalEntry(lines: InsertJournalEntryLine[]): boolean {
    const totalDebits = lines.reduce((sum, line) => sum + parseFloat(line.debitAmount || "0"), 0);
    const totalCredits = lines.reduce((sum, line) => sum + parseFloat(line.creditAmount || "0"), 0);
    
    return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for rounding differences
  }

  /**
   * Get accounts by category for financial reporting
   */
  async getAccountsByCategory(companyId: number, category: string) {
    return await db.select()
      .from(accounts)
      .where(and(
        eq(accounts.companyId, companyId),
        eq(accounts.category, category),
        eq(accounts.isActive, true)
      ))
      .orderBy(asc(accounts.code));
  }

  /**
   * Export chart of accounts to Excel format for DGII
   */
  async exportChartOfAccountsToExcel(companyId: number) {
    const accountsList = await db.select()
      .from(accounts)
      .where(eq(accounts.companyId, companyId))
      .orderBy(asc(accounts.code));

    // This would normally use a library like xlsx to generate Excel file
    // For now, we'll return the data structure
    return {
      headers: ["Código DGII", "Nombre de Cuenta", "Categoría", "Subcategoría", "Nivel", "Saldo Actual"],
      data: accountsList.map(account => [
        account.dgiiCode || account.code,
        account.name,
        account.category,
        account.subcategory,
        account.level,
        account.currentBalance
      ])
    };
  }

  /**
   * Get journal entries with support documents
   */
  async getJournalEntriesWithDocuments(companyId: number, startDate?: Date, endDate?: Date) {
    const baseQuery = db.select({
      entry: journalEntries,
      documents: sql`json_agg(${supportDocuments}) filter (where ${supportDocuments.id} is not null)`.as('documents')
    })
    .from(journalEntries)
    .leftJoin(supportDocuments, eq(journalEntries.id, supportDocuments.journalEntryId))
    .where(eq(journalEntries.companyId, companyId));

    if (startDate && endDate) {
      baseQuery.where(and(
        eq(journalEntries.companyId, companyId),
        between(journalEntries.date, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
      ));
    }

    return await baseQuery
      .groupBy(journalEntries.id)
      .orderBy(desc(journalEntries.createdAt));
  }
}

export const enhancedAccountingService = new EnhancedAccountingService();