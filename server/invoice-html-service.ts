import type { Invoice, InvoiceItem, Customer, Company } from "@shared/schema";
import QRCode from 'qrcode';

// Format currency in Dominican Pesos
function formatDOP(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Calculate included ITBIS from total amount
function calculateIncludedITBIS(totalWithTax: number): number {
  // Total = Base + (Base * 0.18) = Base * 1.18
  // ITBIS = Total - Base = Total - (Total / 1.18)
  const basePrice = totalWithTax / 1.18;
  const itbis = totalWithTax - basePrice;
  return Math.ceil(itbis * 100) / 100;
}

export class InvoiceHTMLService {
  static async generateInvoiceHTML(
    invoice: Invoice,
    customer: Customer,
    company: Company,
    invoiceItems: InvoiceItem[],
    pageFormat: 'A4' | 'letter' = 'A4'
  ): Promise<string> {
    // Generate QR code for invoice verification
    const verificationUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify-invoice/${invoice.number}`;
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 80,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      qrCodeDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjwvP3ZnPgo=';
    }
    // Calculate totals
    const subtotalNum = parseFloat(invoice.subtotal);
    const taxNum = parseFloat(invoice.itbis || "0");
    const totalNum = parseFloat(invoice.total);
    
    // Check if any item has ITBIS included by looking at taxType
    const hasIncludedTax = invoiceItems.some(item => 
      (item as any).taxType === 'itbis_incluido' || 
      (item as any).taxType === 'included'
    );
    
    // If ITBIS is included, calculate the implicit tax
    let displayTax = taxNum;
    let displaySubtotal = subtotalNum;
    
    if (hasIncludedTax && taxNum === 0) {
      // Calculate implicit ITBIS from total
      displayTax = calculateIncludedITBIS(totalNum);
      displaySubtotal = totalNum - displayTax;
    }

    // Page format styles
    const pageStyles = pageFormat === 'letter' 
      ? { 
          size: 'letter', 
          maxWidth: '216mm', 
          containerWidth: '216mm' 
        }
      : { 
          size: 'A4', 
          maxWidth: '210mm', 
          containerWidth: '210mm' 
        };

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura ${invoice.number}</title>
    <style>
        @page {
            margin: 20mm;
            size: ${pageStyles.size};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            line-height: 1.5;
            color: #1f2937;
            background: white;
        }
        
        .invoice-container {
            max-width: ${pageStyles.maxWidth};
            margin: 0 auto;
            padding: 20mm;
            background: white;
            position: relative;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .company-info {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .company-logo {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
        }
        
        .company-details-wrapper {
            flex: 1;
        }
        
        .company-name {
            font-size: 26px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
        }
        
        .company-details {
            font-size: 11px;
            color: #666;
            line-height: 1.3;
        }
        
        .invoice-info {
            text-align: right;
            min-width: 200px;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .invoice-dates {
            font-size: 11px;
            color: #666;
        }
        
        .ncf-section {
            background: #f8f8f8;
            border: 2px solid #000;
            padding: 8px;
            text-align: center;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        .ncf-title {
            font-weight: bold;
            font-size: 14px;
            color: #000;
            margin-bottom: 3px;
        }
        
        .ncf-number {
            font-size: 16px;
            font-weight: bold;
            color: #000;
        }
        
        .billing-section {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
        }
        
        .billing-to, .shipping-to {
            flex: 1;
            margin-right: 20px;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 14px;
            color: #000;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .customer-info {
            background: #f8f8f8;
            padding: 12px;
            border-radius: 4px;
            border-left: 4px solid #2563eb;
        }
        
        .customer-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 3px;
        }
        
        .customer-details {
            font-size: 11px;
            color: #666;
            line-height: 1.3;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }
        
        .items-table th {
            background: #2563eb;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }
        
        .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .item-description {
            font-weight: 500;
            color: #374151;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals-section {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 8px 12px;
            font-size: 12px;
        }
        
        .totals-table .label {
            text-align: right;
            font-weight: 500;
            color: #374151;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .totals-table .amount {
            text-align: right;
            font-weight: bold;
            border-bottom: 1px solid #e2e8f0;
            width: 120px;
        }
        
        .total-row .label,
        .total-row .amount {
            background: #000;
            color: white;
            font-size: 14px;
            border: none;
        }
        
        .notes-section {
            margin-top: 30px;
            padding: 15px;
            background: #f8f8f8;
            border-radius: 4px;
            border-left: 4px solid #000;
        }
        
        .notes-title {
            font-weight: bold;
            font-size: 12px;
            color: #000;
            margin-bottom: 5px;
        }
        
        .notes-content {
            font-size: 11px;
            color: #333;
            line-height: 1.4;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        
        .payment-info {
            background: #f8f8f8;
            border: 1px solid #000;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
        }
        
        .payment-title {
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .payment-details {
            font-size: 11px;
            color: #333;
        }
        
        @media print {
            .invoice-container {
                padding: 0;
                margin: 0;
                max-width: none;
            }
            
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                ${company.logoUrl ? `<img src="${company.logoUrl}" alt="Logo" class="company-logo" onerror="this.style.display='none'">` : ''}
                <div class="company-details-wrapper">
                    <div class="company-name">${company.name || 'Mi Empresa'}</div>
                    <div class="company-details">
                        ${company.address ? `${company.address}<br>` : ''}
                        ${company.phone ? `Tel: ${company.phone}<br>` : ''}
                        ${company.email ? `Email: ${company.email}<br>` : ''}
                        ${company.rnc ? `RNC: ${company.rnc}` : ''}
                    </div>
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">FACTURA</div>
                <div class="invoice-number"># ${invoice.number}</div>
                <div class="invoice-dates">
                    <div><strong>Fecha:</strong> ${new Date(invoice.date).toLocaleDateString('es-DO')}</div>
                    <div><strong>Vencimiento:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-DO') : 'N/A'}</div>
                </div>
            </div>
        </div>

        <!-- NCF Section -->
        ${invoice.ncf ? `
        <div class="ncf-section">
            <div class="ncf-title">*** COMPROBANTE FISCAL ***</div>
            <div class="ncf-number">NCF: ${invoice.ncf}</div>
        </div>
        ` : ''}

        <!-- Billing Information -->
        <div class="billing-section">
            <div class="billing-to">
                <div class="section-title">Facturar a:</div>
                <div class="customer-info">
                    <div class="customer-name">${customer.name || 'Cliente General'}</div>
                    <div class="customer-details">
                        ${customer.email ? `Email: ${customer.email}<br>` : ''}
                        ${customer.phone ? `Teléfono: ${customer.phone}<br>` : ''}
                        ${customer.address ? `Dirección: ${customer.address}<br>` : ''}
                        ${customer.rnc ? `RNC: ${customer.rnc}<br>` : ''}
                        ${customer.cedula ? `Cédula: ${customer.cedula}` : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="items-section">
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px; color: #374151;">Detalles de Productos</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%">Descripción</th>
                        <th style="width: 12%" class="text-center">Cant.</th>
                        <th style="width: 19%" class="text-right">Precio Unit.</th>
                        <th style="width: 19%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceItems.map(item => `
                    <tr>
                        <td class="item-description" style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
                            <div style="font-weight: 500; color: #111827;">${item.description || 'Producto'}</div>
                            ${item.productId ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Código: ${item.productId}</div>` : ''}
                        </td>
                        <td class="text-center" style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                        <td class="text-right" style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${formatDOP(parseFloat(item.price))}</td>
                        <td class="text-right" style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formatDOP(parseFloat(item.subtotal))}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals-section" style="margin-top: 30px; display: flex; justify-content: flex-end;">
            <div style="min-width: 300px;">
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background: #f9fafb; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                        <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151;">Resumen de Factura</h4>
                    </div>
                    <div style="padding: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                            <span style="color: #6b7280;">Subtotal:</span>
                            <span style="font-weight: 500;">${formatDOP(displaySubtotal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                            <span style="color: #6b7280;">${hasIncludedTax ? 'ITBIS (18% incluido):' : 'ITBIS (18%):'}</span>
                            <span style="font-weight: 500;">${formatDOP(displayTax)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #e5e7eb; margin-top: 10px;">
                            <span style="font-size: 16px; font-weight: 600; color: #111827;">TOTAL:</span>
                            <span style="font-size: 18px; font-weight: 700; color: #059669;">${formatDOP(totalNum)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Information -->
        <div class="payment-info">
            <div class="payment-title">Estado de Pago</div>
            <div class="payment-details">
                Estado: <strong>${invoice.status === 'paid' ? 'PAGADA' : invoice.status === 'pending' ? 'PENDIENTE' : 'VENCIDA'}</strong>
            </div>
        </div>

        <!-- Notes -->
        ${invoice.notes ? `
        <div class="notes-section">
            <div class="notes-title">Notas:</div>
            <div class="notes-content">${invoice.notes}</div>
        </div>
        ` : ''}

        <!-- QR Code Section -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div>
                <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px;">CÓDIGO QR DE VERIFICACIÓN</div>
                <div style="font-size: 11px; color: #6b7280;">Escanea para verificar esta factura</div>
            </div>
            <div id="qr-code" style="width: 80px; height: 80px; background: white; border: 1px solid #d1d5db; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 75px; height: 75px;" />
            </div>
        </div>

        <!-- Footer -->
        <div class="footer" style="margin-top: 30px;">
            <p>Gracias por su preferencia</p>
            <p>Esta factura fue generada electrónicamente y es válida sin firma</p>
        </div>
    </div>
</body>
</html>`;
  }
}