import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Calendar, DollarSign, Receipt, Building2 } from "lucide-react";
import { SEOHead, SEOConfigs } from "@/components/SEOHead";

interface VerificationResult {
  valid: boolean;
  sale?: any;
  company?: any;
  items?: any[];
  message?: string;
}

export default function VerifySale() {
  const { saleId } = useParams();
  
  const { data: verification, isLoading, error } = useQuery<VerificationResult>({
    queryKey: [`/api/verify/sale/${saleId}`],
    enabled: !!saleId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <SEOHead 
          title="Verificando Venta - Four One Solutions"
          description="Verificando la autenticidad de la venta"
          keywords="verificación, venta, autenticidad, Four One Solutions"
        />
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Verificando venta...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Validando la autenticidad del comprobante
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <SEOHead 
          title="Error de Verificación - Four One Solutions"
          description="Error al verificar la venta"
          keywords="error, verificación, venta"
        />
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <XCircle className="h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error de verificación
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              No se pudo verificar este comprobante. Por favor, verifique el código QR o contacte al emisor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verification.valid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <SEOHead 
          title="Comprobante No Válido - Four One Solutions"
          description="El comprobante no es válido"
          keywords="no válido, verificación, comprobante"
        />
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <XCircle className="h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Comprobante no válido
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {verification.message || "Este comprobante no es válido o ha sido modificado."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sale, company, items } = verification;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <SEOHead 
        title={`Verificación de Venta ${sale?.saleNumber} - Four One Solutions`}
        description={`Comprobante verificado de ${company?.name} por ${parseFloat(sale?.total || '0').toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}`}
        keywords="verificación, comprobante válido, Four One Solutions, venta verificada"
      />
      
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Verification Status */}
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              ✓ Comprobante Verificado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Este comprobante es auténtico y ha sido emitido por Four One Solutions
            </p>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información del Emisor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Empresa:</span>
                <p className="text-gray-600 dark:text-gray-400">{company?.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">RNC:</span>
                <p className="text-gray-600 dark:text-gray-400">{company?.rnc || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Teléfono:</span>
                <p className="text-gray-600 dark:text-gray-400">{company?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Dirección:</span>
                <p className="text-gray-600 dark:text-gray-400">{company?.address || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Detalles de la Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Número:</span>
                <p className="text-gray-600 dark:text-gray-400">{sale?.saleNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Fecha:</span>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(sale?.createdAt).toLocaleDateString('es-DO')} {new Date(sale?.createdAt).toLocaleTimeString('es-DO')}
                </p>
              </div>
              {sale?.ncf && (
                <div className="sm:col-span-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">NCF:</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block ml-2">
                    {sale.ncf}
                  </p>
                  <Badge variant="outline" className="ml-2">Comprobante Fiscal</Badge>
                </div>
              )}
            </div>

            {/* Items */}
            {items && items.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Productos/Servicios:</h4>
                <div className="space-y-2">
                  {items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-sm text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">
                        RD$ {parseFloat(item.subtotal).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span>RD$ {parseFloat(sale?.subtotal || '0').toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ITBIS (18%):</span>
                <span>RD$ {parseFloat(sale?.itbis || '0').toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  Total:
                </span>
                <span className="text-green-600">
                  RD$ {parseFloat(sale?.total || '0').toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Esta verificación fue generada el {new Date().toLocaleDateString('es-DO')} a las {new Date().toLocaleTimeString('es-DO')}</p>
          <p className="mt-1">Powered by Four One Solutions - Sistema de verificación de comprobantes</p>
        </div>
      </div>
    </div>
  );
}