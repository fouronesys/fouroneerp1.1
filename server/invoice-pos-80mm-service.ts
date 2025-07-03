import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

export interface InvoiceData {
  sale: any;
  items: any[];
  company: any;
  customerInfo?: {
    name?: string;
    phone?: string;
    rnc?: string;
    address?: string;
  };
}

export class InvoicePOS80mmService {
  /**
   * Generate 80mm POS receipt using HTML/CSS optimized for thermal printing
   */
  static async generatePOS80mmReceipt(invoiceData: InvoiceData): Promise<string> {
    const { sale, items, company, customerInfo } = invoiceData;
    
    // Generate QR code for verification
    const verificationUrl = `${process.env.BASE_URL || 'https://fourone.com.do'}/verify/sale/${sale.id}`;
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Load company logo if available
    let logoBase64 = '';
    
    try {
      if (company.logoUrl) {
        // If company has uploaded a logo, use it
        if (company.logoUrl.startsWith('data:')) {
          // Logo is already in base64 format
          logoBase64 = company.logoUrl;
          console.log('Company logo loaded from database for POS receipt');
        } else if (company.logoUrl.startsWith('/uploads/') || company.logoUrl.startsWith('uploads/')) {
          // Logo is a file path, read it
          const logoPath = path.join(process.cwd(), company.logoUrl);
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const ext = path.extname(logoPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
            logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
            console.log('Company logo loaded from file for POS receipt');
          }
        }
      }
      
      // Fallback to default logo only if no company logo is available
      if (!logoBase64) {
        const defaultLogoPath = path.join(process.cwd(), 'attached_assets', 'Four One Solutions Logo_20250130_143011_0000_1749182433509.png');
        if (fs.existsSync(defaultLogoPath)) {
          const logoBuffer = fs.readFileSync(defaultLogoPath);
          logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
          console.log('Using default logo for POS receipt (no company logo configured)');
        } else {
          console.log('No logo available, using text header only');
        }
      }
    } catch (error) {
      console.log('Error loading company logo:', error);
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo POS ${sale.saleNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            color: #000000;
            background: white;
            width: 80mm;
            max-width: 80mm;
            font-weight: bold;
        }
        
        body {
            padding: 1mm 2mm 2mm 2mm;
        }
        
        .receipt-container {
            width: 100%;
            max-width: 76mm;
        }
        
        .header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
        }
        
        .company-logo {
            max-width: 60mm;
            max-height: 20mm;
            margin-bottom: 4px;
        }
        
        .company-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
            color: #000000;
        }
        
        .company-info {
            font-size: 9px;
            line-height: 1.1;
            color: #000000;
            font-weight: bold;
        }
        
        .receipt-title {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            margin: 6px 0;
            text-transform: uppercase;
            color: #000000;
        }
        
        .receipt-number {
            text-align: center;
            font-weight: bold;
            margin-bottom: 4px;
            color: #000000;
        }
        
        .date-time {
            text-align: center;
            font-size: 10px;
            margin-bottom: 8px;
            color: #000000;
            font-weight: bold;
        }
        
        .customer-section {
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
        }
        
        .section-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        
        .info-line {
            margin-bottom: 1px;
            font-size: 10px;
        }
        
        .items-section {
            margin-bottom: 8px;
        }
        
        .items-header {
            border-bottom: 1px solid #000;
            border-top: 1px solid #000;
            padding: 2px 0;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
        }
        
        .item-row {
            padding: 2px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .item-name {
            font-weight: bold;
            margin-bottom: 1px;
            color: #000000;
        }
        
        .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #000000;
            font-weight: bold;
        }
        
        .totals-section {
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-bottom: 8px;
        }
        
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
            color: #000000;
            font-weight: bold;
        }
        
        .total-line.final {
            font-weight: bold;
            font-size: 12px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 2px 0;
            margin-top: 2px;
            color: #000000;
        }
        
        .payment-section {
            margin-bottom: 8px;
            text-align: center;
            color: #000000;
        }
        
        .payment-method {
            font-weight: bold;
            text-transform: uppercase;
            color: #000000;
        }
        
        .cash-details {
            font-size: 10px;
            margin-top: 2px;
            color: #000000;
            font-weight: bold;
        }
        
        .qr-section {
            text-align: center;
            margin-bottom: 8px;
            border-top: 1px dashed #000;
            padding-top: 6px;
        }
        
        .qr-code {
            width: 60px;
            height: 60px;
            margin: 4px auto;
        }
        
        .qr-text {
            font-size: 8px;
            text-transform: uppercase;
            margin-top: 2px;
            color: #000000;
            font-weight: bold;
        }
        
        .footer {
            text-align: center;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 4px;
            margin-top: 8px;
            color: #000000;
        }
        
        .thank-you {
            font-weight: bold;
            margin-bottom: 2px;
            color: #000000;
        }
        
        .website {
            font-style: italic;
            color: #000000;
            font-weight: bold;
        }
        
        .cut-line {
            text-align: center;
            margin: 8px 0;
            font-size: 8px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        @media print {
            @page {
                margin: 0;
                padding: 0;
                size: 80mm auto;
            }
            
            html, body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                width: 80mm;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }
            
            body {
                padding: 0 2mm 2mm 2mm !important;
            }
            
            .receipt-container {
                page-break-inside: avoid;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .header {
                margin-top: 0 !important;
                padding-top: 0 !important;
            }
            
            .no-print {
                display: none !important;
            }
        }
        
        .print-button {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #000;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #333;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir</button>
    
    <div class="receipt-container">
        <!-- Header with logo and company info -->
        <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="company-logo">` : ''}
            <div class="company-name">${company.name}</div>
            <div class="company-info">
                RNC: ${company.rnc || 'N/A'}<br>
                Tel: ${company.phone || 'N/A'}<br>
                ${company.address || 'N/A'}
            </div>
        </div>
        
        <!-- Receipt title and number -->
        <div class="receipt-title">
            ${sale.ncf ? '*** COMPROBANTE FISCAL ***' : '*** RECIBO DE VENTA ***'}
        </div>
        <div class="receipt-number"># ${sale.saleNumber}</div>
        ${sale.ncf ? `<div class="ncf-section" style="text-align: center; font-weight: bold; margin: 4px 0; padding: 2px; border: 1px solid #000;">
            NCF: ${sale.ncf}
        </div>` : ''}
        <div class="date-time">
            ${new Date(sale.createdAt).toLocaleDateString('es-DO')}<br>
            ${new Date(sale.createdAt).toLocaleTimeString('es-DO', { hour12: false })}
        </div>
        
        <!-- Customer info -->
        ${customerInfo?.name || customerInfo?.phone || customerInfo?.rnc || customerInfo?.address ? `
        <div class="customer-section">
            <div class="section-title">${sale.ncf ? 'DATOS DEL CLIENTE/Empresa:' : 'CLIENTE:'}</div>
            ${customerInfo?.name ? `<div class="info-line">Nombre: ${customerInfo.name}</div>` : ''}
            ${customerInfo?.phone ? `<div class="info-line">Tel: ${customerInfo.phone}</div>` : ''}
            ${customerInfo?.rnc ? `<div class="info-line">RNC/Cédula: ${customerInfo.rnc}</div>` : ''}
            ${customerInfo?.address ? `<div class="info-line">Dirección: ${customerInfo.address}</div>` : ''}
        </div>
        ` : ''}
        
        <!-- Items -->
        <div class="items-section">
            <div class="items-header">
                <span>DESCRIPCION</span>
                <span>TOTAL</span>
            </div>
            
            ${items.map(item => `
            <div class="item-row">
                <div class="item-name">${item.productName || item.name}</div>
                <div class="item-details">
                    <span>${item.quantity} x $${parseFloat(item.unitPrice || '0').toFixed(2)}</span>
                    <span class="text-right">$${parseFloat(item.subtotal || '0').toFixed(2)}</span>
                </div>
            </div>
            `).join('')}
        </div>
        
        <!-- Totals -->
        <div class="totals-section">
            <div class="total-line">
                <span>SUBTOTAL:</span>
                <span>$${parseFloat(sale.subtotal || '0').toFixed(2)}</span>
            </div>
            <div class="total-line">
                <span>ITBIS (18%):</span>
                <span>$${parseFloat(sale.itbis || '0').toFixed(2)}</span>
            </div>
            <div class="total-line final">
                <span>TOTAL:</span>
                <span>$${parseFloat(sale.total || '0').toFixed(2)}</span>
            </div>
        </div>
        
        <!-- Payment info -->
        <div class="payment-section">
            <div class="payment-method">
                PAGO: ${sale.paymentMethod === 'cash' ? 'EFECTIVO' : sale.paymentMethod === 'card' ? 'TARJETA' : 'TRANSFERENCIA'}
            </div>
            ${sale.paymentMethod === 'cash' ? `
            <div class="cash-details">
                Recibido: $${parseFloat(sale.cashReceived || '0').toFixed(2)}<br>
                Cambio: $${parseFloat(sale.cashChange || '0').toFixed(2)}
            </div>
            ` : ''}
        </div>
        
        <!-- QR Code -->
        <div class="qr-section">
            <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code">
            <div class="qr-text">
                CODIGO QR DE VERIFICACION<br>
                Escanea para verificar
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="thank-you">¡GRACIAS POR SU COMPRA!</div>
            <div>Este recibo fue generado electronicamente</div>
            ${company.website ? `<div class="website">${company.website}</div>` : ''}
        </div>
        
        <!-- Cut line -->
        <div class="cut-line">
            ✂ - - - - - - - - - - - - - - - - - - - - -
        </div>
    </div>
</body>
</html>`;

    return html;
  }
}