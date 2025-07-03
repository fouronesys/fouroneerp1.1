import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AnimatedProgressIndicator from "./AnimatedProgressIndicator";

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number;
  saleNumber: string;
}

export default function InvoicePrintModal({ isOpen, onClose, saleId, saleNumber }: InvoicePrintModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // HTML invoice generation
  const handleHTMLInvoice = async () => {
    setIsGenerating(true);
    setShowProgress(true);
    
    try {
      // Start the progress animation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(`/api/pos/print-professional/${saleId}`, {
        method: "GET",
        credentials: 'include'
      });

      if (response.ok) {
        const htmlContent = await response.text();
        
        // Wait for progress animation to complete before opening invoice
        await new Promise(resolve => setTimeout(resolve, 4500));
        
        // Open in new window/tab for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        }

        toast({
          title: "Factura generada",
          description: "Factura profesional abierta en nueva ventana",
        });

        // Reset states and close modal
        setShowProgress(false);
        setIsGenerating(false);
        onClose();
      } else {
        throw new Error("Failed to generate HTML invoice");
      }
    } catch (error) {
      toast({
        title: "Error al generar factura",
        description: "No se pudo generar la factura",
        variant: "destructive",
      });
      setShowProgress(false);
      setIsGenerating(false);
    }
  };

  // 80mm POS receipt generation with robust popup handling
  const handlePOS80mmReceipt = async () => {
    setIsGenerating(true);
    setShowProgress(true);
    
    try {
      // Start the progress animation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(`/api/pos/print-pos-80mm/${saleId}`, {
        method: "POST",
        credentials: 'include'
      });

      if (response.ok) {
        const htmlContent = await response.text();
        console.log('POS receipt HTML received, length:', htmlContent.length);
        
        // Create data URL immediately
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Try to open a properly sized receipt window
        const printWindow = window.open('', '_blank', 'width=380,height=600,scrollbars=no,resizable=no,toolbar=no,menubar=no,location=no,status=no');
        
        if (printWindow) {
          // Write content to the opened window
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Auto-trigger print dialog after content loads
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
          
          console.log('POS receipt window opened and content written successfully');
          
          // Wait for progress animation to complete
          await new Promise(resolve => setTimeout(resolve, 4500));
          
          toast({
            title: "Recibo POS generado",
            description: "Recibo de 80mm abierto en nueva ventana",
          });
        } else {
          console.log('Popup blocked, waiting for animation then trying alternative method');
          
          // Wait for progress animation to complete
          await new Promise(resolve => setTimeout(resolve, 4500));
          
          // Fallback: open with blob URL
          const fallbackWindow = window.open(url, '_blank');
          if (fallbackWindow) {
            console.log('POS receipt opened in new tab via fallback');
          } else {
            // Last resort: download
            const link = document.createElement('a');
            link.href = url;
            link.download = `Recibo-POS-80mm-${new Date().toISOString().slice(0,10)}-${Date.now()}.html`;
            link.click();
            console.log('POS receipt downloaded as HTML file');
          }
          
          toast({
            title: "Recibo POS generado",
            description: "Si no se abrió automáticamente, verifica el bloqueador de ventanas emergentes",
          });
        }
        
        // Clean up the URL
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 5000);

        // Reset states and close modal
        setShowProgress(false);
        setIsGenerating(false);
        onClose();
      } else {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating POS receipt:', error);
      toast({
        title: "Error al generar recibo",
        description: error instanceof Error ? error.message : "No se pudo generar el recibo POS",
        variant: "destructive",
      });
      setShowProgress(false);
      setIsGenerating(false);
    }
  };

  const handleProgressComplete = () => {
    // This will be called when the progress animation completes
    setShowProgress(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar Factura {saleNumber}</DialogTitle>
        </DialogHeader>

        {showProgress ? (
          <AnimatedProgressIndicator 
            isActive={showProgress} 
            onComplete={handleProgressComplete}
          />
        ) : (
          <div className="space-y-4">
            {/* Professional Invoice Option */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Factura Profesional
                </CardTitle>
                <CardDescription>
                  Genera una factura con diseño profesional que incluye logo, QR code y formato optimizado para impresión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• Logo de la empresa en alta calidad</li>
                    <li>• Código QR de verificación</li>
                    <li>• Diseño negro profesional</li>
                    <li>• Formato completo tamaño carta</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleHTMLInvoice} 
                  disabled={isGenerating}
                  className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGenerating ? "Iniciando..." : "Generar Factura Profesional"}
                </Button>
              </CardContent>
            </Card>

            {/* 80mm POS Receipt Option */}
            <Card className="animate-slide-up animation-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Recibo POS 80mm
                </CardTitle>
                <CardDescription>
                  Genera un recibo optimizado para impresoras térmicas de 80mm con logo y diseño compacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• Logo en encabezado optimizado</li>
                    <li>• Código QR de verificación</li>
                    <li>• Formato 80mm para impresoras térmicas</li>
                    <li>• Diseño compacto y legible</li>
                  </ul>
                </div>

                <Button 
                  onClick={handlePOS80mmReceipt} 
                  disabled={isGenerating}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {isGenerating ? "Iniciando..." : "Generar Recibo POS 80mm"}
                </Button>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground text-center animate-fade-in">
              Los documentos se abrirán en una nueva ventana listos para imprimir o guardar como PDF
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}