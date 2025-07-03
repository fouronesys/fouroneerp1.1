import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatDOP } from "@/lib/dominican";
import type {
  POSSale,
  POSSaleItem,
  Company,
  POSPrintSettings,
} from "@shared/schema";

interface EnhancedPrintReceiptProps {
  sale: POSSale;
  items: POSSaleItem[];
  company: Company;
  printSettings?: POSPrintSettings;
  isCommand?: boolean;
  size?: "sm" | "default";
}

export function EnhancedPrintReceipt({
  sale,
  items = [],
  company,
  printSettings,
  isCommand = false,
  size = "default",
}: EnhancedPrintReceiptProps) {
  const printReceipt = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const documentTitle = isCommand ? `Comanda #${sale.id}` : `Recibo #${sale.id}`;
    const printerWidth = printSettings?.printerWidth === "58mm" ? "200px" : "300px";

    printWindow.document.write(`
      <html>
        <head>
          <title>${documentTitle}</title>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            
            @media print {
              body { 
                font-family: 'Roboto', monospace; 
                margin: 0; 
                padding: 6px; 
                font-size: ${printSettings?.printerWidth === "58mm" ? "10px" : "11px"};
                line-height: 1.3;
                color: #000;
                background: white;
              }
              @page { margin: 0; }
            }
            
            body { 
              font-family: 'Roboto', monospace; 
              margin: 0; 
              padding: 8px; 
              font-size: ${printSettings?.printerWidth === "58mm" ? "11px" : "12px"};
              line-height: 1.4;
              color: #333;
              background: white;
            }
            
            .receipt { 
              width: ${printerWidth}; 
              max-width: 100%;
              margin: 0 auto;
              background: white;
            }
            
            .center { text-align: center; }
            .right { text-align: right; }
            .left { text-align: left; }
            .bold { font-weight: 600; }
            
            .line { 
              border-bottom: 1px dashed #ccc; 
              margin: 6px 0; 
              height: 1px;
            }
            
            .double-line {
              border-bottom: 2px solid #000;
              margin: 8px 0;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 4px 0;
            }
            
            td { 
              padding: 2px 1px; 
              vertical-align: top;
              border: none;
            }
            
            .company-header {
              text-align: center;
              margin-bottom: 10px;
              padding-bottom: 6px;
            }
            
            .company-name {
              font-size: ${printSettings?.printerWidth === "58mm" ? "13px" : "15px"};
              font-weight: bold;
              margin-bottom: 3px;
              color: #000;
            }
            
            .company-details {
              font-size: ${printSettings?.printerWidth === "58mm" ? "9px" : "10px"};
              color: #555;
              margin-bottom: 1px;
            }
            
            .document-header {
              text-align: center;
              margin: 8px 0;
              padding: 6px;
              background: #f0f0f0;
              border: 1px solid #ddd;
              border-radius: 3px;
            }
            
            .document-title {
              font-size: ${printSettings?.printerWidth === "58mm" ? "12px" : "14px"};
              font-weight: bold;
              margin-bottom: 3px;
              color: #000;
            }
            
            .document-number {
              font-size: ${printSettings?.printerWidth === "58mm" ? "10px" : "11px"};
              font-weight: bold;
              background: #000;
              color: white;
              padding: 2px 6px;
              border-radius: 8px;
              display: inline-block;
              margin: 2px 0;
            }
            
            .document-date {
              font-size: ${printSettings?.printerWidth === "58mm" ? "8px" : "9px"};
              color: #666;
            }
            
            .customer-section, .restaurant-section {
              margin: 6px 0;
              padding: 4px;
              background: #f8f8f8;
              border-radius: 3px;
              border: 1px solid #e0e0e0;
            }
            
            .section-title {
              font-weight: bold;
              font-size: ${printSettings?.printerWidth === "58mm" ? "9px" : "10px"};
              margin-bottom: 3px;
              color: #000;
            }
            
            .section-content {
              font-size: ${printSettings?.printerWidth === "58mm" ? "8px" : "9px"};
              color: #555;
              line-height: 1.2;
            }
            
            .items-table {
              margin: 8px 0;
            }
            
            .items-header {
              border-bottom: 1px solid #000;
              font-weight: bold;
              color: #000;
              font-size: ${printSettings?.printerWidth === "58mm" ? "9px" : "10px"};
            }
            
            .item-row {
              border-bottom: 1px solid #f0f0f0;
              font-size: ${printSettings?.printerWidth === "58mm" ? "8px" : "9px"};
            }
            
            .item-row:last-child {
              border-bottom: none;
            }
            
            .item-name {
              font-weight: 400;
              color: #000;
              word-wrap: break-word;
              max-width: 100px;
            }
            
            .totals-section {
              margin-top: 8px;
              border-top: 2px solid #000;
              padding-top: 6px;
            }
            
            .total-row {
              font-weight: 500;
              font-size: ${printSettings?.printerWidth === "58mm" ? "9px" : "10px"};
            }
            
            .final-total {
              font-weight: bold;
              color: #000;
              border-top: 1px solid #000;
              padding-top: 3px;
              font-size: ${printSettings?.printerWidth === "58mm" ? "10px" : "11px"};
            }
            
            .payment-section {
              margin: 8px 0;
              padding: 4px;
              background: #f5f5f5;
              border-radius: 3px;
              border: 1px solid #ddd;
            }
            
            .ncf-section {
              margin: 8px 0;
              padding: 4px;
              border: 2px solid #000;
              background: #f0f0f0;
              text-align: center;
              font-weight: bold;
              border-radius: 3px;
              font-size: ${printSettings?.printerWidth === "58mm" ? "9px" : "10px"};
            }
            
            .footer {
              margin-top: 12px;
              text-align: center;
              font-size: ${printSettings?.printerWidth === "58mm" ? "8px" : "9px"};
              border-top: 1px dashed #ccc;
              padding-top: 6px;
              color: #666;
            }
            
            .thank-you {
              font-weight: bold;
              color: #000;
              margin-bottom: 6px;
              font-size: ${printSettings?.printerWidth === "58mm" ? "10px" : "11px"};
            }
            
            .powered-by {
              font-size: ${printSettings?.printerWidth === "58mm" ? "7px" : "8px"};
              margin-top: 6px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- Company Header -->
            <div class="company-header">
              <div class="company-name">${company.businessName || company.name}</div>
              ${company.rnc ? `<div class="company-details">RNC: ${company.rnc}</div>` : ''}
              ${company.address ? `<div class="company-details">${company.address}</div>` : ''}
              ${company.phone ? `<div class="company-details">Tel: ${company.phone}</div>` : ''}
              ${company.email ? `<div class="company-details">${company.email}</div>` : ''}
            </div>

            <!-- Document Header -->
            <div class="document-header">
              <div class="document-title">${isCommand ? 'COMANDA DE COCINA' : 'RECIBO DE VENTA'}</div>
              <div class="document-number">#${sale.id}</div>
              <div class="document-date">
                ${new Date(sale.createdAt || Date.now()).toLocaleString("es-DO", {
                  timeZone: "America/Santo_Domingo",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <!-- Customer Info -->
            ${sale.customerName || sale.customerPhone ? `
              <div class="customer-section">
                <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
                <div class="section-content">
                  ${sale.customerName ? `Cliente: ${sale.customerName}<br>` : ''}
                  ${sale.customerPhone ? `Teléfono: ${sale.customerPhone}` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Restaurant Info -->
            ${company.businessType === "restaurant" && (sale.orderType || sale.tableNumber || sale.preparationNotes) ? `
              <div class="restaurant-section">
                <div class="section-title">INFORMACIÓN DE RESTAURANTE</div>
                <div class="section-content">
                  ${sale.orderType ? `Tipo: ${sale.orderType === 'dine_in' ? 'Para Comer Aquí' : sale.orderType === 'takeout' ? 'Para Llevar' : 'Delivery'}<br>` : ''}
                  ${sale.tableNumber ? `Mesa: ${sale.tableNumber}<br>` : ''}
                  ${sale.preparationNotes ? `Notas: ${sale.preparationNotes}` : ''}
                </div>
              </div>
            ` : ''}

            <div class="line"></div>

            <!-- Items -->
            <table class="items-table">
              <tr class="items-header">
                <td style="width: 50%;">Producto</td>
                <td class="center" style="width: 15%;">Cant.</td>
                ${!isCommand ? `<td class="right" style="width: 17.5%;">Precio</td>` : ''}
                ${!isCommand ? `<td class="right" style="width: 17.5%;">Total</td>` : ''}
              </tr>
              ${items.map(item => `
                <tr class="item-row">
                  <td class="item-name">${item.productName || `Producto #${item.productId}`}</td>
                  <td class="center bold">${item.quantity}</td>
                  ${!isCommand ? `<td class="right">${formatDOP(parseFloat(item.unitPrice))}</td>` : ''}
                  ${!isCommand ? `<td class="right bold">${formatDOP(parseFloat(item.subtotal || (parseFloat(item.unitPrice) * parseFloat(item.quantity))))}</td>` : ''}
                </tr>
              `).join('')}
            </table>

            ${!isCommand ? `
              <!-- Totals -->
              <div class="totals-section">
                <table>
                  <tr class="total-row">
                    <td>Subtotal:</td>
                    <td class="right">${formatDOP(parseFloat(sale.subtotal))}</td>
                  </tr>
                  <tr class="total-row">
                    <td>ITBIS (18%):</td>
                    <td class="right">${formatDOP(parseFloat(sale.itbis))}</td>
                  </tr>
                  <tr class="final-total">
                    <td class="bold">TOTAL:</td>
                    <td class="right bold">${formatDOP(parseFloat(sale.total))}</td>
                  </tr>
                </table>
              </div>

              <!-- Payment Info -->
              <div class="payment-section">
                <div class="section-title">INFORMACIÓN DE PAGO</div>
                <table>
                  <tr>
                    <td class="section-content">Método:</td>
                    <td class="right bold section-content">${sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}</td>
                  </tr>
                  ${sale.paymentMethod === "cash" && sale.cashReceived ? `
                    <tr>
                      <td class="section-content">Recibido:</td>
                      <td class="right section-content">${formatDOP(parseFloat(sale.cashReceived))}</td>
                    </tr>
                    <tr>
                      <td class="section-content">Cambio:</td>
                      <td class="right bold section-content">${formatDOP(parseFloat(sale.cashChange || "0"))}</td>
                    </tr>
                  ` : ''}
                </table>
              </div>

              <!-- NCF -->
              ${sale.ncf || printSettings?.showNCF ? `
                <div class="ncf-section">
                  NCF: ${sale.ncf || 'B01-00000000'}
                </div>
              ` : ''}
            ` : ''}

            <!-- Footer -->
            <div class="footer">
              <div class="thank-you">${isCommand ? '¡Para preparar!' : '¡Gracias por su compra!'}</div>
              ${printSettings?.receiptFooter && !isCommand ? `<div>${printSettings.receiptFooter}</div>` : ''}
              <div class="powered-by">
                Powered by Four One Solutions
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const buttonText = isCommand ? "Imprimir Comanda" : "Imprimir Recibo";
  
  return (
    <Button
      onClick={printReceipt}
      size={size}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      {buttonText}
    </Button>
  );
}