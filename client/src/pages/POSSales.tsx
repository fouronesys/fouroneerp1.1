import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ShoppingCart, Calendar, DollarSign, Eye, Receipt, Plus, Printer, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { PrintReceipt } from "@/components/PrintReceipt";
import type { POSSale, POSSaleItem, Product, Company, POSPrintSettings } from "@shared/schema";

export default function POSSales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<POSSale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printingSale, setPrintingSale] = useState<POSSale | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: sales, isLoading } = useQuery<POSSale[]>({
    queryKey: ["/api/pos/sales"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: saleItems } = useQuery<POSSaleItem[]>({
    queryKey: ["/api/pos/sales", selectedSale?.id, "items"],
    enabled: !!selectedSale,
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies/current"],
  });

  const { data: printSettings } = useQuery<POSPrintSettings>({
    queryKey: ["/api/pos/print-settings"],
  });

  const { data: printingItems } = useQuery<POSSaleItem[]>({
    queryKey: ["/api/pos/sales", printingSale?.id, "items"],
    enabled: !!printingSale,
  });

  const filteredSales = sales?.filter(sale =>
    sale.id.toString().includes(searchTerm) ||
    (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const getTotalSales = () => {
    return sales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;
  };

  const handleViewDetails = (sale: POSSale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handleReprintInvoice = async (sale: POSSale) => {
    try {
      // Use the same endpoint as POS to ensure identical receipts
      const response = await fetch(`/api/pos/print-pos-80mm/${sale.id}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const htmlContent = await response.text();
        
        // Open the receipt window with the same logic as POS
        const printWindow = window.open('', '_blank', 'width=380,height=600,scrollbars=no,resizable=no,toolbar=no,menubar=no,location=no,status=no');
        
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Auto-trigger print dialog
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
          
          toast({
            title: "Recibo reimpreso",
            description: "Recibo de 80mm abierto en nueva ventana",
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo abrir la ventana de impresión. Verifica el bloqueador de ventanas emergentes.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('Error al generar recibo');
      }
    } catch (error) {
      console.error("Error reprinting receipt:", error);
      toast({
        title: "Error",
        description: "No se pudo reimprimir el recibo",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    // This function is no longer needed as we use the server endpoint directly
    setShowPrintPreview(false);
    setPrintingSale(null);
  };

  const generatePrintContent = (sale: POSSale) => {
    const printerWidth = printSettings?.printerWidth || "80mm";
    const is58mm = printerWidth === "58mm";
    const logoUrl = company?.logoUrl;
    
    return `
      <div class="receipt" style="width: ${is58mm ? '58mm' : '80mm'}; max-width: ${is58mm ? '220px' : '300px'};">
        ${logoUrl ? `
          <div class="logo-container">
            <img src="${logoUrl}" alt="Logo" class="logo" style="max-width: ${is58mm ? '80px' : '100px'};" />
          </div>
        ` : ''}
        
        <div class="company-info">
          <div class="bold" style="font-size: ${is58mm ? '14px' : '16px'};">${company?.name || 'Four One System'}</div>
          ${company?.address ? `<div style="font-size: ${is58mm ? '10px' : '11px'};">${company.address}</div>` : ''}
          ${company?.phone ? `<div style="font-size: ${is58mm ? '10px' : '11px'};">Tel: ${company.phone}</div>` : ''}
          ${company?.rnc ? `<div style="font-size: ${is58mm ? '10px' : '11px'};">RNC: ${company.rnc}</div>` : ''}
        </div>

        <div class="document-header" style="font-size: ${is58mm ? '12px' : '14px'};">
          RECIBO DE VENTA
        </div>

        <table style="width: 100%; margin: 8px 0;">
          <tr>
            <td style="font-size: ${is58mm ? '10px' : '11px'};">Recibo #:</td>
            <td class="right bold" style="font-size: ${is58mm ? '10px' : '11px'};">${sale.id}</td>
          </tr>
          <tr>
            <td style="font-size: ${is58mm ? '10px' : '11px'};">Fecha:</td>
            <td class="right" style="font-size: ${is58mm ? '10px' : '11px'};">${new Date(sale.createdAt || new Date()).toLocaleString('es-DO', {
              timeZone: 'America/Santo_Domingo',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
          </tr>
          ${sale.customerName ? `
          <tr>
            <td style="font-size: ${is58mm ? '10px' : '11px'};">Cliente:</td>
            <td class="right" style="font-size: ${is58mm ? '10px' : '11px'};">${sale.customerName}</td>
          </tr>
          ` : ''}
          ${sale.ncf ? `
          <tr>
            <td colspan="2" class="ncf-section" style="font-size: ${is58mm ? '9px' : '10px'};">
              NCF: <span class="bold">${sale.ncf}</span>
            </td>
          </tr>
          ` : ''}
        </table>

        <div class="line"></div>

        <table style="width: 100%;">
          ${printingItems?.map(item => `
            <tr class="item-row">
              <td style="font-size: ${is58mm ? '9px' : '10px'};" class="item-name">${getProductName(item.productId)}</td>
            </tr>
            <tr class="item-row">
              <td style="font-size: ${is58mm ? '9px' : '10px'};">${item.quantity}x ${formatCurrency(parseFloat(item.unitPrice))}</td>
              <td class="right bold" style="font-size: ${is58mm ? '9px' : '10px'};">${formatCurrency(parseFloat(item.subtotal))}</td>
            </tr>
          `).join('') || ''}
        </table>

        <div class="double-line"></div>

        <div class="total-section">
          <table style="width: 100%;">
            <tr>
              <td class="bold" style="font-size: ${is58mm ? '11px' : '12px'};">TOTAL:</td>
              <td class="right bold total-amount" style="font-size: ${is58mm ? '14px' : '16px'};">${formatCurrency(parseFloat(sale.total))}</td>
            </tr>
          </table>
        </div>

        <div class="payment-section">
          <table style="width: 100%;">
            <tr>
              <td style="font-size: ${is58mm ? '10px' : '11px'};">Método de pago:</td>
              <td class="right" style="font-size: ${is58mm ? '10px' : '11px'};">${sale.paymentMethod || 'Efectivo'}</td>
            </tr>
            <tr>
              <td style="font-size: ${is58mm ? '10px' : '11px'};">Pagado:</td>
              <td class="right" style="font-size: ${is58mm ? '10px' : '11px'};">${formatCurrency(parseFloat(sale.amountPaid || sale.total))}</td>
            </tr>
            ${parseFloat(sale.change || '0') > 0 ? `
            <tr>
              <td style="font-size: ${is58mm ? '10px' : '11px'};">Cambio:</td>
              <td class="right" style="font-size: ${is58mm ? '10px' : '11px'};">${formatCurrency(parseFloat(sale.change))}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${sale.qrCode ? `
        <div class="qr-section">
          <div style="font-size: ${is58mm ? '9px' : '10px'}; margin-bottom: 8px;">CÓDIGO QR DE VERIFICACIÓN</div>
          <div style="font-size: ${is58mm ? '8px' : '9px'};">Escanea para verificar esta venta</div>
          <div style="margin: 8px 0; font-family: monospace; font-size: ${is58mm ? '6px' : '7px'};">${sale.qrCode}</div>
        </div>
        ` : ''}

        <div class="footer">
          <div class="thank-you" style="font-size: ${is58mm ? '11px' : '12px'};">¡GRACIAS POR SU COMPRA!</div>
          <div style="font-size: ${is58mm ? '8px' : '9px'}; margin-top: 4px;">
            Powered by Four One System<br/>
            ${new Date().toLocaleString('es-DO')}
          </div>
        </div>
      </div>
    `;
  };

  const handleMobilePrint = (content: string) => {
    // Enhanced mobile Bluetooth printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      const printerWidth = printSettings?.printerWidth || "80mm";
      const is58mm = printerWidth === "58mm";
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recibo POS #${printingSale?.id}</title>
            <style>
              @media print {
                @page { 
                  margin: 0; 
                  size: ${is58mm ? '58mm' : '80mm'} auto;
                }
                body { 
                  margin: 0; 
                  padding: 4px; 
                  font-family: 'Courier New', monospace; 
                  font-size: ${is58mm ? '9px' : '10px'};
                  line-height: 1.2;
                  width: ${is58mm ? '58mm' : '80mm'};
                  max-width: ${is58mm ? '220px' : '300px'};
                }
              }
              
              body { 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                margin: 0; 
                padding: 10px; 
                background: #f5f5f5;
              }
              
              .receipt { 
                width: 100%;
                max-width: ${is58mm ? '220px' : '300px'};
                margin: 0 auto;
                background: white;
                padding: 12px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: 600; }
              .line { border-bottom: 1px dotted #ccc; margin: 8px 0; }
              .double-line { border-bottom: 2px solid #333; margin: 10px 0; }
              
              table { width: 100%; border-collapse: collapse; margin: 6px 0; }
              td { padding: 2px 0; vertical-align: top; }
              
              .company-info {
                text-align: center;
                margin-bottom: 12px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 6px;
              }
              
              .document-header {
                text-align: center;
                font-weight: 700;
                margin: 10px 0;
                padding: 8px;
                background: #e3f2fd;
                border-radius: 6px;
              }
              
              .total-section {
                margin: 10px 0;
                padding: 8px;
                background: #f0f9ff;
                border-radius: 6px;
                border: 1px solid #0ea5e9;
              }
              
              .payment-section {
                margin: 8px 0;
                padding: 8px;
                background: #fefce8;
                border-radius: 6px;
                border: 1px solid #eab308;
              }
              
              .qr-section {
                text-align: center;
                margin: 10px 0;
                padding: 8px;
                border: 1px dashed #666;
                border-radius: 6px;
              }
              
              .footer {
                text-align: center;
                margin-top: 12px;
                border-top: 1px solid #ddd;
                padding-top: 8px;
              }
              
              .ncf-section {
                text-align: center;
                padding: 6px;
                background: #f0f5ff;
                border: 1px solid #3b82f6;
                border-radius: 4px;
                margin: 6px 0;
              }
              
              .logo-container { text-align: center; margin-bottom: 8px; }
              .logo { max-height: ${is58mm ? '40px' : '50px'}; width: auto; }
              
              .item-row td {
                padding: 3px 0;
                border-bottom: 1px solid #eee;
              }
              
              .total-amount { color: #0ea5e9; font-size: larger; }
              .thank-you { font-weight: 700; margin: 6px 0; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDesktopPrint = (content: string) => {
    // Enhanced desktop printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printerWidth = printSettings?.printerWidth || "80mm";
      const is58mm = printerWidth === "58mm";
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Recibo POS #${printingSale?.id}</title>
            <style>
              @media print {
                @page { 
                  margin: 0; 
                  size: ${is58mm ? '58mm' : '80mm'} auto;
                }
                body { 
                  margin: 0; 
                  padding: 6px; 
                  font-family: 'Courier New', monospace; 
                  font-size: ${is58mm ? '8px' : '9px'};
                  line-height: 1.1;
                  width: ${is58mm ? '58mm' : '80mm'};
                  max-width: ${is58mm ? '220px' : '300px'};
                }
              }
              
              body { 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f9fafb;
              }
              
              .receipt { 
                width: 100%;
                max-width: ${is58mm ? '240px' : '320px'};
                margin: 0 auto;
                background: white;
                padding: 16px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                border: 1px solid #e5e7eb;
              }
              
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: 600; }
              .line { border-bottom: 1px dotted #d1d5db; margin: 10px 0; }
              .double-line { border-bottom: 2px solid #374151; margin: 12px 0; }
              
              table { width: 100%; border-collapse: collapse; margin: 8px 0; }
              td { padding: 3px 0; vertical-align: top; font-size: ${is58mm ? '10px' : '11px'}; }
              
              .company-info {
                text-align: center;
                margin-bottom: 16px;
                padding: 12px;
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                border-radius: 8px;
              }
              
              .document-header {
                text-align: center;
                font-weight: 700;
                margin: 12px 0;
                padding: 10px;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-radius: 8px;
                color: #1e40af;
              }
              
              .total-section {
                margin: 12px 0;
                padding: 12px;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-radius: 8px;
                border: 2px solid #0ea5e9;
              }
              
              .payment-section {
                margin: 10px 0;
                padding: 10px;
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                border-radius: 8px;
                border: 1px solid #f59e0b;
              }
              
              .qr-section {
                text-align: center;
                margin: 12px 0;
                padding: 10px;
                border: 2px dashed #6b7280;
                border-radius: 8px;
                background: #f9fafb;
              }
              
              .footer {
                text-align: center;
                margin-top: 16px;
                border-top: 2px solid #d1d5db;
                padding-top: 12px;
                color: #6b7280;
              }
              
              .ncf-section {
                text-align: center;
                padding: 8px;
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border: 1px solid #3b82f6;
                border-radius: 6px;
                margin: 8px 0;
              }
              
              .logo-container { text-align: center; margin-bottom: 10px; }
              .logo { max-height: ${is58mm ? '50px' : '60px'}; width: auto; }
              
              .item-row td {
                padding: 4px 0;
                border-bottom: 1px solid #f3f4f6;
              }
              
              .total-amount { color: #0ea5e9; font-weight: 700; }
              .thank-you { font-weight: 700; margin: 8px 0; color: #1f2937; }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getTodaySales = () => {
    const today = new Date().toDateString();
    return sales?.filter(sale => 
      new Date(sale.createdAt || sale.date).toDateString() === today
    ).reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;
  };

  const getTodayTransactions = () => {
    const today = new Date().toDateString();
    return sales?.filter(sale => 
      new Date(sale.createdAt).toDateString() === today
    ).length || 0;
  };

  const getAverageTicket = () => {
    if (!sales || sales.length === 0) return 0;
    return getTotalSales() / sales.length;
  };

  const getProductName = (productId: number) => {
    return products?.find(p => p.id === productId)?.name || `Producto #${productId}`;
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <Header title="Ventas POS" subtitle="Historial de ventas del punto de venta" />
        <div className="p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando ventas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-4 space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Ventas POS
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Historial de ventas del punto de venta
            </p>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ventas Totales
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 truncate">
                    {formatCurrency(getTotalSales())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ventas Hoy
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
                    {formatCurrency(getTodaySales())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Transacciones Hoy
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {getTodayTransactions()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Receipt className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ticket Promedio
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 truncate">
                    {formatCurrency(getAverageTicket())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por ID o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay ventas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Las ventas realizadas en el POS aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm sm:text-base">
                        Venta #{sale.id}
                      </CardTitle>
                      {sale.customerName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          Cliente: {sale.customerName}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300">
                        Completada
                      </Badge>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReprintInvoice(sale)}
                        className="h-8 w-8 p-0"
                        title="Reimprimir factura"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(sale)}
                        className="h-8 w-8 p-0"
                        title="Ver detalles"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{new Date(sale.createdAt).toLocaleString('es-DO')}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Total:
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </span>
                    </div>
                    
                    {sale.discount > 0 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Descuento:
                        </span>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          -{formatCurrency(sale.discount)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sale Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalle de Venta #{selectedSale?.id}
              </DialogTitle>
            </DialogHeader>
            
            {selectedSale && (
              <div className="space-y-4">
                {/* Sale Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Información de la Venta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</p>
                        <p className="text-sm">{new Date(selectedSale.createdAt).toLocaleString('es-DO')}</p>
                      </div>
                      {selectedSale.customerName && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cliente</p>
                          <p className="text-sm">{selectedSale.customerName}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Método de Pago</p>
                        <p className="text-sm capitalize">{selectedSale.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(selectedSale.total)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sale Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Productos Vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {saleItems && saleItems.length > 0 ? (
                      <div className="space-y-3">
                        {saleItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {getProductName(item.productId)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.quantity} x {formatCurrency(parseFloat(item.unitPrice))}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">
                                {formatCurrency(parseFloat(item.quantity) * parseFloat(item.unitPrice))}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Totals */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="text-sm font-medium">
                              {formatCurrency(selectedSale.subtotal)}
                            </span>
                          </div>
                          {selectedSale.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Descuento:</span>
                              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                -{formatCurrency(selectedSale.discount)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-green-600 dark:text-green-400">
                              {formatCurrency(selectedSale.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No se encontraron productos para esta venta
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Preview Dialog */}
        <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Vista Previa - Factura #{printingSale?.id}</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {printingSale && company && printingItems && (
                <PrintReceipt
                  sale={{
                    id: printingSale.id.toString(),
                    saleNumber: printingSale.saleNumber,
                    date: printingSale.date,
                    subtotal: printingSale.subtotal,
                    itbis: printingSale.itbis,
                    total: printingSale.total,
                    paymentMethod: printingSale.paymentMethod,
                    cashReceived: printingSale.cashReceived,
                    cashChange: printingSale.cashChange,
                    ncf: printingSale.ncf,
                    customerName: printingSale.customerName || "Cliente General",
                    customerPhone: printingSale.customerPhone,
                  }}
                  items={printingItems.map(item => ({
                    id: item.id,
                    saleId: item.saleId,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                  }))}
                  company={company}
                  printSettings={printSettings}
                />
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPrintPreview(false);
                  setPrintingSale(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}