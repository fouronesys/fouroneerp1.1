import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard } from "lucide-react";

interface PayPalPaymentProps {
  plan: "monthly" | "annual";
  userEmail: string;
  onSuccess: () => void;
}

interface ExchangeRate {
  currency: string;
  rate: number;
}

export default function PayPalPayment({ plan, userEmail, onSuccess }: PayPalPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0.018); // Default DOP to USD rate
  const { toast } = useToast();

  // Plan prices in DOP
  const planPrices = {
    monthly: { first: 5000, recurring: 3500 },
    annual: { first: 35000, recurring: 24000 }
  };

  // Get current exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch("/api/exchange-rates");
        const rates: ExchangeRate[] = await response.json();
        const usdRate = rates.find(r => r.currency === 'USD');
        if (usdRate) {
          setExchangeRate(usdRate.rate);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        // Use fallback rate
      }
    };

    fetchExchangeRate();
  }, []);

  const convertToUSD = (dopAmount: number): number => {
    return Math.round((dopAmount * exchangeRate) * 100) / 100; // Round to 2 decimal places
  };

  const handlePayPalPayment = async () => {
    setIsLoading(true);
    try {
      const dopAmount = planPrices[plan].first;
      const usdAmount = convertToUSD(dopAmount);

      // Create PayPal order with USD amount
      const orderResponse = await fetch("/api/paypal/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          amount: usdAmount.toString(),
          currency: "USD"
        })
      });

      const orderData = await orderResponse.json();

      if (orderData.id) {
        // Redirect to PayPal
        const approvalUrl = orderData.links?.find((link: any) => link.rel === "approve")?.href;
        if (approvalUrl) {
          window.location.href = approvalUrl;
        } else {
          throw new Error("No approval URL found");
        }
      } else {
        throw new Error("Failed to create PayPal order");
      }
    } catch (error: any) {
      console.error("PayPal payment error:", error);
      toast({
        title: "Error en el pago",
        description: error.message || "Error al procesar el pago con PayPal",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardPayment = async () => {
    toast({
      title: "Próximamente",
      description: "El pago con tarjeta estará disponible pronto. Por favor usa PayPal o transferencia bancaria.",
      variant: "default"
    });
  };

  const dopAmount = planPrices[plan].first;
  const usdAmount = convertToUSD(dopAmount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Métodos de Pago Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold mb-2">Precio del Plan {plan === 'monthly' ? 'Mensual' : 'Anual'}</h4>
          <div className="flex justify-between items-center mb-2">
            <span>Precio inicial (DOP):</span>
            <span className="font-bold">RD$ {dopAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Equivalente en USD:</span>
            <span className="font-bold text-green-600">$ {usdAmount.toFixed(2)} USD</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Tasa de cambio: 1 USD = {(1/exchangeRate).toFixed(2)} DOP
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handlePayPalPayment}
            disabled={isLoading}
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h8.418c2.508 0 4.459.891 5.661 2.584 1.205 1.697 1.108 3.815-.289 6.309-1.394 2.488-3.664 3.754-6.764 3.754h-2.02c-.408 0-.747.301-.809.703l-.809 4.987a.641.641 0 0 1-.633.74z"/>
                  <path d="M20.154 2.832c-.394 2.653-1.828 4.459-4.3 5.416-.394.157-.817.284-1.26.381l-.809 4.987c-.069.438-.477.784-.933.784H9.045a.641.641 0 0 1-.633-.74l1.52-9.385c.069-.438.477-.784.933-.784h2.02c1.695 0 3.084-.326 4.135-1.004 1.051-.677 1.828-1.697 2.32-3.055.098-.271.177-.552.236-.842.196-1.005.177-1.875-.068-2.652C19.394 1.339 19.745 2.044 20.154 2.832z"/>
                </svg>
                Pagar con PayPal (${usdAmount.toFixed(2)} USD)
              </>
            )}
          </Button>

          <Button 
            onClick={handleCardPayment}
            variant="outline"
            className="w-full"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar con Tarjeta (Próximamente)
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• PayPal convierte automáticamente de USD a su moneda local</p>
          <p>• Plan {plan === 'monthly' ? 'Mensual' : 'Anual'}: 
            {plan === 'monthly' 
              ? ' RD$ 5,000 inicial, luego RD$ 3,500/mes' 
              : ' RD$ 35,000 inicial, luego RD$ 24,000/año'
            }
          </p>
          <p>• Pago seguro y protegido por PayPal</p>
        </div>
      </CardContent>
    </Card>
  );
}