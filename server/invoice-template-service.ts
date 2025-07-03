import { POSSale, POSSaleItem, Company } from "@shared/schema";

export interface InvoiceData {
  sale: POSSale;
  items: POSSaleItem[];
  company: Company;
  customerInfo?: {
    name?: string;
    phone?: string;
    rnc?: string;
    address?: string;
  };
}

export interface ThermalPrintOptions {
  width: '80mm' | '56mm';
  showLogo: boolean;
  showNCF: boolean;
  showQR: boolean;
  paperCut: boolean;
  cashDrawer: boolean;
}

export interface PDFPrintOptions {
  format: 'letter' | 'a4' | 'legal';
  orientation: 'portrait' | 'landscape';
  showLogo: boolean;
  showNCF: boolean;
  showQR: boolean;
  watermark?: string;
}

export class InvoiceTemplateService {
  private static readonly THERMAL_API_URL = 'https://api.thermal-printer.io/v1';
  private static readonly PDF_API_URL = 'https://api.pdf-generator.io/v1';

  /**
   * Generate thermal receipt for 80mm or 56mm printers
   */
  static async generateThermalReceipt(
    invoiceData: InvoiceData,
    options: ThermalPrintOptions
  ): Promise<{ printData: string; previewUrl?: string }> {
    const { sale, items, company, customerInfo } = invoiceData;

    // Calculate totals
    const subtotal = parseFloat(sale.subtotal);
    const itbis = parseFloat(sale.itbis);
    const total = parseFloat(sale.total);

    // Build thermal print commands (ESC/POS)
    const printCommands = this.buildThermalCommands(
      sale,
      items,
      company,
      customerInfo,
      options,
      { subtotal, itbis, total }
    );

    // For external API integration, we would send to thermal service
    // For now, return ESC/POS commands directly
    return {
      printData: printCommands,
      previewUrl: await this.generateThermalPreview(printCommands, options.width)
    };
  }

  /**
   * Generate PDF invoice for letter/A4 printing
   */
  static async generatePDFInvoice(
    invoiceData: InvoiceData,
    options: PDFPrintOptions
  ): Promise<{ pdfUrl: string; downloadUrl: string }> {
    const { sale, items, company, customerInfo } = invoiceData;

    const htmlTemplate = this.buildPDFTemplate(
      sale,
      items,
      company,
      customerInfo,
      options
    );

    // For external API integration
    try {
      const response = await fetch(`${this.PDF_API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PDF_API_KEY || ''}`
        },
        body: JSON.stringify({
          html: htmlTemplate,
          options: {
            format: options.format,
            orientation: options.orientation,
            margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
          }
        })
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const result = await response.json();
      return {
        pdfUrl: result.url,
        downloadUrl: result.downloadUrl
      };
    } catch (error) {
      // Fallback to local PDF generation
      return this.generateLocalPDF(htmlTemplate, options);
    }
  }

  /**
   * Build ESC/POS thermal printer commands
   */
  private static buildThermalCommands(
    sale: POSSale,
    items: POSSaleItem[],
    company: Company,
    customerInfo: any,
    options: ThermalPrintOptions,
    totals: { subtotal: number; itbis: number; total: number }
  ): string {
    let commands = '';
    
    // Initialize printer
    commands += '\x1B\x40'; // ESC @ - Initialize
    commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment

    // Company logo (if enabled)
    if (options.showLogo && company.logoUrl) {
      commands += `[LOGO:${company.logoUrl}]\n`;
    }

    // Company header
    commands += `\x1B\x21\x30${company.name}\n`; // ESC ! 0 - Double height
    commands += `\x1B\x21\x00${company.businessName || ''}\n`; // Normal text
    if (company.rnc) commands += `RNC: ${company.rnc}\n`;
    if (company.address) commands += `${company.address}\n`;
    if (company.phone) commands += `Tel: ${company.phone}\n`;
    
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    commands += '================================\n';

    // NCF Information (if enabled)
    if (options.showNCF && sale.ncf) {
      commands += `NCF: ${sale.ncf}\n`;
      commands += `Tipo: ${sale.ncfType}\n`;
    }

    // Sale information
    commands += `Factura: ${sale.saleNumber}\n`;
    commands += `Fecha: ${new Date(sale.createdAt!).toLocaleString('es-DO')}\n`;
    commands += `Cajero: ${sale.createdBy}\n`;

    // Customer information
    if (customerInfo?.name) {
      commands += `Cliente: ${customerInfo.name}\n`;
    }
    if (customerInfo?.phone) {
      commands += `Tel: ${customerInfo.phone}\n`;
    }
    if (customerInfo?.rnc) {
      commands += `RNC: ${customerInfo.rnc}\n`;
    }

    commands += '================================\n';

    // Items
    items.forEach(item => {
      const itemTotal = parseFloat(item.subtotal);
      commands += `${item.productName}\n`;
      commands += `${item.quantity} x ${this.formatCurrency(parseFloat(item.unitPrice))}`;
      commands += ` = ${this.formatCurrency(itemTotal)}\n`;
      if (parseFloat(item.discount) > 0) {
        commands += `  Desc: -${this.formatCurrency(parseFloat(item.discount))}\n`;
      }
      commands += '\n';
    });

    commands += '================================\n';

    // Totals
    commands += `\x1B\x61\x02`; // Right alignment
    commands += `Subtotal: ${this.formatCurrency(totals.subtotal)}\n`;
    commands += `ITBIS (18%): ${this.formatCurrency(totals.itbis)}\n`;
    commands += `\x1B\x21\x30TOTAL: ${this.formatCurrency(totals.total)}\n`; // Double height
    commands += `\x1B\x21\x00`; // Normal text

    // Payment information
    commands += `\x1B\x61\x00`; // Left alignment
    commands += '================================\n';
    commands += `Pago: ${sale.paymentMethod.toUpperCase()}\n`;
    
    if (sale.cashReceived) {
      commands += `Recibido: ${this.formatCurrency(parseFloat(sale.cashReceived))}\n`;
      commands += `Cambio: ${this.formatCurrency(parseFloat(sale.cashChange || '0'))}\n`;
    }

    // QR Code (if enabled)
    if (options.showQR) {
      commands += '\x1B\x61\x01'; // Center alignment
      commands += `[QR:${sale.ncf}|${totals.total}|${sale.fiscalPeriod}]\n`;
    }

    // Footer
    commands += '\x1B\x61\x01'; // Center alignment
    commands += '\n';
    commands += 'Gracias por su compra\n';
    commands += 'Visitenos en: ' + (company.website || '') + '\n';
    commands += '\n\n\n';

    // Paper cut and cash drawer
    if (options.paperCut) {
      commands += '\x1D\x56\x41'; // GS V A - Partial cut
    }
    if (options.cashDrawer) {
      commands += '\x1B\x70\x00\x19\xFA'; // Open cash drawer
    }

    return commands;
  }

  /**
   * Build HTML template for PDF invoices
   */
  private static buildPDFTemplate(
    sale: POSSale,
    items: POSSaleItem[],
    company: Company,
    customerInfo: any,
    options: PDFPrintOptions
  ): string {
    const subtotal = parseFloat(sale.subtotal);
    const itbis = parseFloat(sale.itbis);
    const total = parseFloat(sale.total);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Factura ${sale.saleNumber}</title>
        <style>
            @page { size: ${options.format}; margin: 1cm; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-logo { max-height: 80px; margin-bottom: 15px; }
            .company-info { margin-bottom: 20px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info { margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; }
            .totals { text-align: right; margin-bottom: 30px; }
            .total-row { font-size: 16px; font-weight: bold; }
            .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #666; }
            .ncf-info { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; border: 1px solid #ddd; }
            .qr-code { text-align: center; margin: 20px 0; }
            ${options.watermark ? '.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.1); z-index: -1; }' : ''}
        </style>
    </head>
    <body>
        ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
        
        <div class="header">
            ${options.showLogo && company.logoUrl ? `<img src="${company.logoUrl}" class="company-logo" alt="Logo">` : ''}
            <h1>${company.name}</h1>
            <div class="company-info">
                ${company.businessName ? `<div>${company.businessName}</div>` : ''}
                ${company.rnc ? `<div>RNC: ${company.rnc}</div>` : ''}
                ${company.address ? `<div>${company.address}</div>` : ''}
                ${company.phone ? `<div>Tel: ${company.phone}</div>` : ''}
                ${company.email ? `<div>Email: ${company.email}</div>` : ''}
            </div>
        </div>

        ${options.showNCF && sale.ncf ? `
        <div class="ncf-info">
            <strong>Información Fiscal:</strong><br>
            NCF: ${sale.ncf}<br>
            Tipo de Comprobante: ${sale.ncfType}<br>
            Período Fiscal: ${sale.fiscalPeriod}
        </div>
        ` : ''}

        <div class="invoice-info">
            <div>
                <h2>FACTURA</h2>
                <div><strong>Número:</strong> ${sale.saleNumber}</div>
                <div><strong>Fecha:</strong> ${new Date(sale.createdAt!).toLocaleString('es-DO')}</div>
                <div><strong>Cajero:</strong> ${sale.createdBy}</div>
            </div>
            <div>
                <div><strong>Método de Pago:</strong> ${sale.paymentMethod.toUpperCase()}</div>
                ${sale.cashReceived ? `
                <div><strong>Recibido:</strong> ${this.formatCurrency(parseFloat(sale.cashReceived))}</div>
                <div><strong>Cambio:</strong> ${this.formatCurrency(parseFloat(sale.cashChange || '0'))}</div>
                ` : ''}
            </div>
        </div>

        ${customerInfo?.name || customerInfo?.phone || customerInfo?.rnc ? `
        <div class="customer-info">
            <h3>Datos del Cliente</h3>
            ${customerInfo.name ? `<div><strong>Nombre:</strong> ${customerInfo.name}</div>` : ''}
            ${customerInfo.phone ? `<div><strong>Teléfono:</strong> ${customerInfo.phone}</div>` : ''}
            ${customerInfo.rnc ? `<div><strong>RNC:</strong> ${customerInfo.rnc}</div>` : ''}
            ${customerInfo.address ? `<div><strong>Dirección:</strong> ${customerInfo.address}</div>` : ''}
        </div>
        ` : ''}

        <table class="items-table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Código</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Descuento</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr>
                    <td>${item.productName}</td>
                    <td>${item.productCode}</td>
                    <td>${item.quantity}</td>
                    <td>${this.formatCurrency(parseFloat(item.unitPrice))}</td>
                    <td>${this.formatCurrency(parseFloat(item.discount))}</td>
                    <td>${this.formatCurrency(parseFloat(item.subtotal))}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div>Subtotal: ${this.formatCurrency(subtotal)}</div>
            <div>ITBIS (18%): ${this.formatCurrency(itbis)}</div>
            <div class="total-row">TOTAL: ${this.formatCurrency(total)}</div>
        </div>

        ${options.showQR ? `
        <div class="qr-code">
            <div>Código QR para verificación:</div>
            <div>[QR:${sale.ncf}|${total}|${sale.fiscalPeriod}]</div>
        </div>
        ` : ''}

        <div class="footer">
            <div>Gracias por su compra</div>
            ${company.website ? `<div>Visitenos en: ${company.website}</div>` : ''}
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate thermal preview image
   */
  private static async generateThermalPreview(
    printCommands: string,
    width: '80mm' | '56mm'
  ): Promise<string> {
    // For external API integration
    try {
      const response = await fetch(`${this.THERMAL_API_URL}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.THERMAL_API_KEY || ''}`
        },
        body: JSON.stringify({
          commands: printCommands,
          width: width,
          format: 'png'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.previewUrl;
      }
    } catch (error) {
      console.log('Thermal preview API unavailable, using local fallback');
    }

    // Fallback: return data URL for simple preview
    return 'data:text/plain;base64,' + Buffer.from(printCommands).toString('base64');
  }

  /**
   * Generate PDF locally as fallback
   */
  private static async generateLocalPDF(
    htmlTemplate: string,
    options: PDFPrintOptions
  ): Promise<{ pdfUrl: string; downloadUrl: string }> {
    // For local PDF generation, we would use a library like puppeteer
    // For now, return the HTML as a data URL
    const htmlDataUrl = 'data:text/html;base64,' + Buffer.from(htmlTemplate).toString('base64');
    
    return {
      pdfUrl: htmlDataUrl,
      downloadUrl: htmlDataUrl
    };
  }

  /**
   * Format currency for Dominican Peso
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get available paper sizes for thermal printers
   */
  static getThermalSizes() {
    return [
      { value: '80mm', label: '80mm (Estándar)', width: 576 },
      { value: '56mm', label: '56mm (Compacto)', width: 384 }
    ];
  }

  /**
   * Get available PDF formats
   */
  static getPDFFormats() {
    return [
      { value: 'letter', label: 'Carta (8.5" x 11")' },
      { value: 'a4', label: 'A4 (210mm x 297mm)' },
      { value: 'legal', label: 'Legal (8.5" x 14")' }
    ];
  }
}