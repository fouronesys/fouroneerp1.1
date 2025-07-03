import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatDOP, generateNCF } from "@/lib/dominican";
import type {
  POSSale,
  POSSaleItem,
  Invoice,
  Customer,
  Company,
  POSPrintSettings,
} from "@shared/schema";

interface PrintReceiptProps {
  sale?: POSSale;
  invoice?: Invoice;
  items?: POSSaleItem[];
  customer?: Customer;
  company: Company;
  printSettings?: POSPrintSettings;
  size?: "sm" | "default";
}

export function PrintReceipt({
  sale,
  invoice,
  items = [],
  customer,
  company,
  printSettings,
  size = "default",
}: PrintReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && printRef.current) {
      const isInvoice = !!invoice;
      const documentTitle = isInvoice
        ? `Factura #${invoice.number}`
        : `Recibo POS #${sale?.id}`;
      const printerWidth =
        printSettings?.printerWidth === "58mm" ? "200px" : "300px";

      printWindow.document.write(`
        <html>
          <head>
            <title>${documentTitle}</title>
            <meta charset="utf-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

              /* Modern Thermal Receipt Styles */
              @media print {
                body { 
                  font-family: 'JetBrains Mono', 'Courier New', monospace; 
                  margin: 0; 
                  padding: 6px; 
                  font-size: ${printSettings?.printerWidth === "58mm" ? "9px" : "10px"};
                  line-height: 1.2;
                  color: #000; 
                  background: white;
                  width: ${printerWidth};
                  max-width: ${printerWidth};
                }
                
                @page { 
                  margin: 0; 
                  size: ${printSettings?.printerWidth === "58mm" ? "58mm" : "80mm"} auto;
                }
              }
              
              /* Enhanced Screen Preview */
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
              }
              /* Modern Receipt Container */
              .receipt { 
                width: 100%;
                max-width: ${printerWidth};
                margin: 0 auto;
                background: white;
                color: #000;
                padding: 16px;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                border: 2px solid #e2e8f0;
                position: relative;
              }
              
              .receipt::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
                border-radius: 14px;
                z-index: -1;
              }
              
              /* Typography and Layout */
              .center { text-align: center; }
              .right { text-align: right; }
              .left { text-align: left; }
              .bold { font-weight: 600; }
              
              /* Modern Dividers */
              .line { 
                border-bottom: 2px dotted #cbd5e0; 
                margin: 10px 0; 
                height: 2px;
              }
              .double-line {
                border-bottom: 3px double #4299e1;
                margin: 12px 0;
              }
              
              /* Enhanced Table Styling */
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 8px 0;
                font-family: 'JetBrains Mono', monospace;
              }
              
              td { 
                padding: 4px 2px; 
                vertical-align: top;
                border: none;
                font-size: 11px;
              }
              
              .item-row td {
                padding: 6px 2px;
                border-bottom: 1px solid #e2e8f0;
                background: rgba(66, 153, 225, 0.05);
              }
              
              .item-row:nth-child(even) td {
                background: rgba(66, 153, 225, 0.1);
              }
              
              .item-row:last-child td {
                border-bottom: 2px solid #4299e1;
              }
              
              /* Modern Total Section */
              .total-section {
                margin-top: 16px;
                border: 2px solid #4299e1;
                padding: 12px;
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border-radius: 8px;
              }
              
              .total-section td {
                padding: 4px 0;
                font-weight: 600;
                font-size: 12px;
              }
              
              /* Company Info Section */
              .company-info {
                margin-bottom: 16px;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                text-align: center;
              }
              
              /* Document Header */
              .document-header {
                margin: 16px 0;
                padding: 12px;
                background: linear-gradient(45deg, #4299e1, #3182ce);
                color: white;
                border-radius: 8px;
                text-align: center;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              /* Customer Section */
              .customer-section {
                margin: 12px 0;
                padding: 12px;
                background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
                border-radius: 8px;
                border: 2px solid #68d391;
              }
              
              /* Payment Section */
              .payment-section {
                margin: 12px 0;
                padding: 12px;
                background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
                border-radius: 8px;
                border: 2px solid #f6ad55;
              }
              
              /* Enhanced Footer */
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: ${printSettings?.printerWidth === "58mm" ? "10px" : "11px"};
                border-top: 3px double #4299e1;
                padding-top: 12px;
                color: #4a5568;
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border-radius: 8px;
                padding: 12px;
              }
              
              /* QR Code Section */
              .qr-section {
                text-align: center;
                margin: 12px 0;
                padding: 12px;
                border: 2px dashed #4299e1;
                border-radius: 8px;
                background: #f7fafc;
              }
              
              /* Thank You Message */
              .thank-you {
                font-size: 14px;
                font-weight: 700;
                color: #2d3748;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 8px 0;
              }
              .ncf-section {
                margin: 10px 0;
                padding: 8px;
                border: 1px solid #4a6cf7;
                background: #f0f5ff;
                text-align: center;
                font-weight: 500;
                border-radius: 4px;
              }
              .highlight {
                background: rgba(255,255,255,0.2);
                padding: 4px 8px;
                border-radius: 12px;
                display: inline-block;
                margin: 2px 0;
              }
              .logo-container {
                display: flex;
                justify-content: center;
                margin-bottom: 10px;
              }
              .logo {
                max-width: ${printSettings?.printerWidth === "58mm" ? "80px" : "100px"};
                height: auto;
                object-fit: contain;
              }
              .item-name {
                font-weight: 400;
              }
              .total-amount {
                font-weight: 700;
                color: #4a6cf7;
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const dateObj = new Date(date);
    return dateObj.toLocaleString("es-DO", {
      timeZone: "America/Santo_Domingo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const calculateTotals = () => {
    if (invoice) {
      return {
        subtotal: parseFloat(invoice.subtotal),
        itbis: parseFloat(invoice.itbis),
        total: parseFloat(invoice.total),
      };
    }

    if (sale) {
      return {
        subtotal: parseFloat(sale.subtotal),
        itbis: parseFloat(sale.itbis),
        total: parseFloat(sale.total),
      };
    }

    return { subtotal: 0, itbis: 0, total: 0 };
  };

  const totals = calculateTotals();

  const renderButton = () => {
    const buttonText = invoice ? "Imprimir Factura" : "Imprimir Recibo";
    
    return (
      <Button
        onClick={handlePrint}
        size={size}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        {buttonText}
      </Button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Hidden print content */}
      <div ref={printRef} style={{ display: "none" }}>
        <div className="receipt">
          {/* Company Header */}
          <div className="company-info center">
            {/* Company Logo - Modern Design */}
            {company.logoUrl && printSettings?.showLogo !== false && (
              <div className="logo-container">
                <img src={company.logoUrl} alt="Logo" className="logo" />
              </div>
            )}

            <div
              className="bold"
              style={{
                fontSize: "14px",
                marginBottom: "4px",
                color: "#4a6cf7",
              }}
            >
              {company.businessName || company.name}
            </div>
            {company.rnc && (
              <div
                style={{ fontSize: "11px", marginBottom: "3px", color: "#666" }}
              >
                RNC: {company.rnc}
              </div>
            )}
            {company.address && (
              <div
                style={{ fontSize: "10px", marginBottom: "3px", color: "#666" }}
              >
                {company.address}
              </div>
            )}
            {company.phone && (
              <div
                style={{ fontSize: "10px", marginBottom: "3px", color: "#666" }}
              >
                Tel: {company.phone}
              </div>
            )}
            {company.email && (
              <div style={{ fontSize: "10px", color: "#666" }}>
                {company.email}
              </div>
            )}
          </div>

          <div className="line"></div>

          {/* Document Info */}
          <div className="document-header center">
            <div
              className="bold"
              style={{ fontSize: "14px", marginBottom: "4px" }}
            >
              {invoice ? "FACTURA" : "RECIBO DE VENTA"}
            </div>
            <div className="highlight" style={{ marginBottom: "4px" }}>
              #{invoice ? invoice.number : sale?.id}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.9 }}>
              {formatDate((invoice ? invoice.date : sale?.createdAt) || new Date())}
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <>
              <div className="line"></div>
              <div className="customer-section">
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                    color: "#4a6cf7",
                  }}
                >
                  INFORMACIÓN DEL CLIENTE
                </div>
                <div>
                  <strong>Cliente:</strong> {customer.name}
                </div>
                {customer.rnc && (
                  <div>
                    <strong>RNC:</strong> {customer.rnc}
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <strong>Tel:</strong> {customer.phone}
                  </div>
                )}
                {customer.email && (
                  <div>
                    <strong>Email:</strong> {customer.email}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sale-specific customer info */}
          {sale && (sale.customerName || sale.customerPhone) && (
            <>
              <div className="line"></div>
              <div className="customer-section">
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                    color: "#4a6cf7",
                  }}
                >
                  INFORMACIÓN DEL CLIENTE
                </div>
                {sale.customerName && (
                  <div>
                    <strong>Cliente:</strong> {sale.customerName}
                  </div>
                )}
                {sale.customerPhone && (
                  <div>
                    <strong>Tel:</strong> {sale.customerPhone}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="line"></div>

          {/* Items */}
          <table>
            <thead>
              <tr style={{ borderBottom: "1px solid #4a6cf7" }}>
                <td className="bold" style={{ color: "#4a6cf7" }}>
                  Descripción
                </td>
                <td className="bold center" style={{ color: "#4a6cf7" }}>
                  Cant.
                </td>
                <td className="bold right" style={{ color: "#4a6cf7" }}>
                  Precio
                </td>
                <td className="bold right" style={{ color: "#4a6cf7" }}>
                  Total
                </td>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="item-row">
                  <td style={{ paddingRight: "5px" }} className="item-name">
                    {item.productName || `Producto #${item.productId}`}
                  </td>
                  <td className="center">{item.quantity}</td>
                  <td className="right">
                    {formatDOP(parseFloat(item.unitPrice))}
                  </td>
                  <td className="right">
                    {formatDOP(parseFloat(item.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="line"></div>

          {/* Totals */}
          <div className="total-section">
            <table>
              <tbody>
                <tr>
                  <td>Subtotal:</td>
                  <td className="right">{formatDOP(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td>ITBIS (18%):</td>
                  <td className="right">{formatDOP(totals.itbis)}</td>
                </tr>
                <tr style={{ borderTop: "1px solid #4a6cf7", paddingTop: "4px" }}>
                  <td className="bold">TOTAL:</td>
                  <td className="right total-amount">
                    {formatDOP(totals.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment info for POS sales */}
          {sale && (
            <>
              <div className="line"></div>
              <div className="payment-section">
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "#4a6cf7",
                  }}
                >
                  INFORMACIÓN DE PAGO
                </div>
                <table>
                  <tbody>
                    <tr>
                      <td>Método de pago:</td>
                      <td className="right bold">
                        {sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                      </td>
                    </tr>
                    {sale.paymentMethod === "cash" && sale.cashReceived && (
                      <>
                        <tr>
                          <td>Efectivo recibido:</td>
                          <td className="right">
                            {formatDOP(parseFloat(sale.cashReceived))}
                          </td>
                        </tr>
                        <tr>
                          <td>Cambio:</td>
                          <td className="right bold">
                            {formatDOP(parseFloat(sale.cashChange || "0"))}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* NCF */}
          {(invoice?.ncf || sale?.ncf || printSettings?.showNCF) && (
            <div className="ncf-section">
              <div>NCF: {invoice?.ncf || sale?.ncf || generateNCF()}</div>
            </div>
          )}

          <div className="line"></div>

          {/* QR Code Section */}
          <div className="qr-section">
            <div className="thank-you">¡Gracias por su compra!</div>
            <div style={{ margin: "8px 0" }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                  `Recibo: ${sale?.id || invoice?.number}\nEmpresa: ${company.name}\nTotal: ${formatDOP(totals.total)}\nFecha: ${new Date().toLocaleDateString('es-DO')}`
                )}`}
                alt="QR Code"
                style={{ maxWidth: "60px", height: "auto" }}
              />
            </div>
            <div style={{ fontSize: "8px", color: "#666" }}>
              Escanea para verificar
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="footer">
            {printSettings?.footerText && (
              <div style={{ marginBottom: "6px", fontSize: "10px" }}>
                {printSettings.footerText}
              </div>
            )}
            
            <div style={{ fontSize: "8px", marginBottom: "4px" }}>
              📧 Soporte: soporte@1111.com.do
            </div>
            <div style={{ fontSize: "8px", marginBottom: "4px" }}>
              📱 WhatsApp: +1 (829) 123-4567
            </div>
            <div style={{ fontSize: "8px", marginBottom: "6px" }}>
              🌐 www.1111.com.do
            </div>
            
            <div className="line"></div>
            
            <div style={{ fontSize: "7px", color: "#666", marginTop: "4px" }}>
              Sistema desarrollado por Four One Solutions
            </div>
            <div style={{ fontSize: "7px", color: "#666" }}>
              Recibo generado: {new Date().toLocaleString('es-DO')}
            </div>
            
            {/* Environmental Message */}
            <div style={{ fontSize: "7px", color: "#666", marginTop: "4px", fontStyle: "italic" }}>
              🌱 Contribuye al medio ambiente - Conserva este recibo digital
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
