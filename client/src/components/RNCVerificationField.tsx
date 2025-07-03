import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormMessage } from "@/components/ui/form";
import { Loader2, Search, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RNCVerificationFieldProps {
  field: any;
  onVerificationResult?: (result: any) => void;
}

interface RNCVerificationResult {
  isValid: boolean;
  rnc: string;
  companyName?: string;
  businessName?: string;
  status?: string;
  category?: string;
  regime?: string;
  message: string;
  source?: string;
}

export function RNCVerificationField({ field, onVerificationResult }: RNCVerificationFieldProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<RNCVerificationResult | null>(null);
  const { toast } = useToast();

  const handleVerification = async (rnc: string) => {
    const cleanRnc = rnc?.replace(/\D/g, '') || '';
    
    if (!cleanRnc || cleanRnc.length < 9) {
      setVerificationResult(null);
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/dgii/rnc-lookup?rnc=${encodeURIComponent(cleanRnc)}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        const verificationData = {
          isValid: true,
          rnc: cleanRnc,
          companyName: result.data.razonSocial || result.data.name,
          businessName: result.data.nombreComercial,
          status: result.data.estado,
          category: result.data.categoria,
          regime: result.data.regimen,
          message: "RNC válido y encontrado en DGII",
          source: "dgii"
        };
        
        setVerificationResult(verificationData);
        onVerificationResult?.(verificationData);
        
        toast({
          title: "RNC Verificado",
          description: `Empresa: ${result.data.razonSocial || result.data.name}`,
        });
      } else {
        const verificationData = {
          isValid: false,
          rnc: cleanRnc,
          message: result.message || "RNC no encontrado en DGII",
          source: "dgii"
        };
        
        setVerificationResult(verificationData);
        onVerificationResult?.(verificationData);
        
        toast({
          title: "RNC No Encontrado", 
          description: result.message || "RNC no encontrado en DGII",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying RNC:', error);
      const verificationData = {
        isValid: false,
        rnc: cleanRnc,
        message: "Error al verificar RNC. Intente nuevamente.",
        source: "error"
      };
      
      setVerificationResult(verificationData);
      onVerificationResult?.(verificationData);
      
      toast({
        title: "Error",
        description: "Error al verificar RNC. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <FormControl>
          <Input 
            placeholder="Ej: 101000013" 
            {...field}
            onChange={(e) => {
              field.onChange(e);
              if (verificationResult) {
                setVerificationResult(null);
              }
            }}
            onBlur={(e) => {
              const rncValue = e.target.value?.replace(/\D/g, '') || '';
              if (rncValue && rncValue.length >= 9) {
                handleVerification(rncValue);
              }
            }}
            className={
              verificationResult?.isValid === true 
                ? "border-green-500 bg-green-50 dark:bg-green-950" 
                : verificationResult?.isValid === false 
                ? "border-red-500 bg-red-50 dark:bg-red-950" 
                : ""
            }
          />
        </FormControl>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isVerifying}
          onClick={() => {
            const cleanRnc = field.value?.replace(/\D/g, '') || '';
            if (cleanRnc.length >= 9) {
              handleVerification(cleanRnc);
            }
          }}
          className="shrink-0 min-w-[100px] bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Verificando
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-1" />
              Verificar
            </>
          )}
        </Button>
      </div>
      
      {/* Verification Result */}
      {verificationResult && (
        <div className={`text-sm p-3 rounded-md border ${
          verificationResult.isValid 
            ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' 
            : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {verificationResult.isValid ? (
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {verificationResult.isValid ? 'RNC Válido' : 'RNC No Válido'}
              </p>
              {verificationResult.isValid && verificationResult.companyName && (
                <p className="text-xs opacity-90 mt-1">
                  <strong>Empresa:</strong> {verificationResult.companyName}
                </p>
              )}
              {verificationResult.isValid && verificationResult.businessName && (
                <p className="text-xs opacity-90 mt-1">
                  <strong>Nombre Comercial:</strong> {verificationResult.businessName}
                </p>
              )}
              {!verificationResult.isValid && (
                <p className="text-xs opacity-90 mt-1">
                  {verificationResult.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <FormMessage />
    </div>
  );
}