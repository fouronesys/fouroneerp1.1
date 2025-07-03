import { POSSale } from '@shared/schema';

/**
 * DGII Report Generator Service
 * Generates official format files for Dominican Republic tax authority
 */

export class DGIIReportGenerator {
  
  /**
   * Generate Format 606 - Purchase Report
   * Based on official DGII specification
   */
  static generate606Report(
    companyRnc: string,
    period: string, // YYYYMM
    purchases: POSSale[] = [] // For now using POS sales as template
  ): string {
    const lines: string[] = [];
    
    // Header line with company info and summary
    const totalRecords = purchases.length;
    const totalAmount = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.total || '0'), 0);
    const totalItbis = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.itbis || '0'), 0);
    
    // 606 Format: 23 columns as per DGII specification
    purchases.forEach((purchase, index) => {
      const line = [
        purchase.customerRnc || '',                    // 1. RNC/Cedula
        purchase.customerRnc ? '1' : '2',              // 2. Tipo ID (1=RNC, 2=Cedula)
        '09',                                          // 3. Tipo Bienes/Servicios (09=Compras)
        purchase.ncf || '',                            // 4. NCF
        '',                                            // 5. NCF Modificado
        this.formatDate(purchase.createdAt || new Date()), // 6. Fecha Comprobante
        purchase.createdAt ? this.formatDate(purchase.createdAt) : '', // 7. Fecha Pago
        '0.00',                                        // 8. Monto Servicios
        purchase.subtotal || '0.00',                   // 9. Monto Bienes
        purchase.total || '0.00',                      // 10. Total Facturado
        purchase.itbis || '0.00',                      // 11. ITBIS Facturado
        '0.00',                                        // 12. ITBIS Retenido
        '0.00',                                        // 13. ITBIS Proporcionalidad
        '0.00',                                        // 14. ITBIS al Costo
        purchase.itbis || '0.00',                      // 15. ITBIS por Adelantar
        '0.00',                                        // 16. ITBIS Percibido
        '',                                            // 17. Tipo Retención ISR
        '0.00',                                        // 18. Monto Retención
        '0.00',                                        // 19. ISR Percibido
        '0.00',                                        // 20. Impuesto Selectivo
        '0.00',                                        // 21. Otros Impuestos
        '0.00',                                        // 22. Propina Legal
        this.getPaymentMethod(purchase.paymentMethod)  // 23. Forma de Pago
      ].join('|');
      
      lines.push(line);
    });
    
    return lines.join('\n');
  }
  
  /**
   * Generate Format 607 - Sales Report
   * Based on official DGII specification
   */
  static generate607Report(
    companyRnc: string,
    period: string, // YYYYMM
    sales: POSSale[]
  ): string {
    const lines: string[] = [];
    
    // 607 Format: 7 columns as per DGII specification
    sales.forEach((sale, index) => {
      const line = [
        sale.customerRnc || '',                        // 1. RNC/Cedula
        sale.customerRnc ? '1' : '3',                  // 2. Tipo ID (1=RNC, 3=Sin ID/Consumidor Final)
        sale.ncf || '',                                // 3. NCF
        '',                                            // 4. NCF Modificado
        this.formatDate(sale.createdAt || new Date()), // 5. Fecha Comprobante
        sale.itbis || '0.00',                          // 6. ITBIS Facturado
        sale.subtotal || '0.00'                        // 7. Monto Facturado (sin ITBIS)
      ].join('|');
      
      lines.push(line);
    });
    
    return lines.join('\n');
  }
  
  /**
   * Generate T-REGISTRO - Payroll Report
   * Placeholder for payroll functionality
   */
  static generateTRegistroReport(
    companyRnc: string,
    period: string, // YYYYMM
    payrollData: any[] = []
  ): string {
    const lines: string[] = [];
    
    // T-REGISTRO Format: Employee payroll information
    // This would need payroll module implementation
    if (payrollData.length === 0) {
      // Return empty report structure for now
      lines.push('# T-REGISTRO - NÓMINA');
      lines.push('# Período: ' + period);
      lines.push('# RNC: ' + companyRnc);
      lines.push('# Sin registros de nómina disponibles');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Format date to DGII standard: YYYYMMDD
   */
  private static formatDate(date: Date | string): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  }
  
  /**
   * Map payment method to DGII codes
   */
  private static getPaymentMethod(method?: string): string {
    const methodMap: { [key: string]: string } = {
      'cash': '1',        // Efectivo
      'card': '3',        // Tarjeta crédito/débito
      'transfer': '2',    // Cheques/Transferencias
      'credit': '4',      // Compra a crédito
      'mixed': '7'        // Mixto
    };
    
    return methodMap[method || 'cash'] || '1';
  }
  
  /**
   * Generate report summary for display
   */
  static generateReportSummary(reportType: string, data: any[]): {
    totalRecords: number;
    totalAmount: number;
    totalItbis: number;
  } {
    const totalRecords = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.total || item.subtotal || '0'), 0);
    const totalItbis = data.reduce((sum, item) => sum + parseFloat(item.itbis || '0'), 0);
    
    return {
      totalRecords,
      totalAmount,
      totalItbis
    };
  }
}