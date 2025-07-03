import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Calculator, Clock, CheckCircle } from "lucide-react";

const openSessionSchema = z.object({
  openingAmount: z.string().min(1, "Monto inicial requerido")
});

const closeSessionSchema = z.object({
  closingAmount: z.string().min(1, "Monto final requerido"),
  notes: z.string().optional()
});

type OpenSessionForm = z.infer<typeof openSessionSchema>;
type CloseSessionForm = z.infer<typeof closeSessionSchema>;

interface POSCashSessionProps {
  employee: any;
  station: any;
  currentSession: any;
  onSessionChange: (session: any) => void;
}

export default function POSCashSession({ employee, station, currentSession, onSessionChange }: POSCashSessionProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openForm = useForm<OpenSessionForm>({
    resolver: zodResolver(openSessionSchema),
    defaultValues: {
      openingAmount: "0.00"
    }
  });

  const closeForm = useForm<CloseSessionForm>({
    resolver: zodResolver(closeSessionSchema),
    defaultValues: {
      closingAmount: "",
      notes: ""
    }
  });

  const openSessionMutation = useMutation({
    mutationFn: async (data: OpenSessionForm) => {
      return await apiRequest('/api/pos/cash-sessions', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: employee.id,
          stationId: station.id,
          openingAmount: parseFloat(data.openingAmount),
          status: 'open'
        })
      });
    },
    onSuccess: (session) => {
      toast({
        title: "Sesión de caja abierta",
        description: `Sesión ${session.sessionNumber} iniciada exitosamente`
      });
      onSessionChange(session);
      queryClient.invalidateQueries({ queryKey: ['/api/pos/cash-sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al abrir sesión",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const closeSessionMutation = useMutation({
    mutationFn: async (data: CloseSessionForm) => {
      return await apiRequest(`/api/pos/cash-sessions/${currentSession.id}/close`, {
        method: 'PATCH',
        body: JSON.stringify({
          closingAmount: parseFloat(data.closingAmount),
          notes: data.notes
        })
      });
    },
    onSuccess: (session) => {
      toast({
        title: "Sesión de caja cerrada",
        description: `Sesión ${session.sessionNumber} cerrada exitosamente`
      });
      onSessionChange(null);
      queryClient.invalidateQueries({ queryKey: ['/api/pos/cash-sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onOpenSession = async (values: OpenSessionForm) => {
    setIsOpening(true);
    try {
      await openSessionMutation.mutateAsync(values);
    } finally {
      setIsOpening(false);
    }
  };

  const onCloseSession = async (values: CloseSessionForm) => {
    setIsClosing(true);
    try {
      await closeSessionMutation.mutateAsync(values);
    } finally {
      setIsClosing(false);
    }
  };

  if (currentSession?.status === 'open') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Cerrar Sesión de Caja</CardTitle>
            <CardDescription>
              Sesión actual: {currentSession.sessionNumber}
              <br />
              Estación: {station.name}
              <br />
              Empleado: {employee.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Resumen de la sesión</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monto inicial:</span>
                  <span className="font-medium">RD${parseFloat(currentSession.openingAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total ventas:</span>
                  <span className="font-medium">RD${parseFloat(currentSession.totalSales || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efectivo:</span>
                  <span className="font-medium">RD${parseFloat(currentSession.totalCash || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarjeta:</span>
                  <span className="font-medium">RD${parseFloat(currentSession.totalCard || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Form {...closeForm}>
              <form onSubmit={closeForm.handleSubmit(onCloseSession)} className="space-y-4">
                <FormField
                  control={closeForm.control}
                  name="closingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Monto Final en Caja
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={closeForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observaciones sobre la sesión..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isClosing}
                  variant="destructive"
                >
                  {isClosing ? "Cerrando..." : "Cerrar Sesión"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit">
            <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Abrir Sesión de Caja</CardTitle>
          <CardDescription>
            Estación: {station.name} - {station.location}
            <br />
            Empleado: {employee.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...openForm}>
            <form onSubmit={openForm.handleSubmit(onOpenSession)} className="space-y-4">
              <FormField
                control={openForm.control}
                name="openingAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monto Inicial en Caja
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isOpening}
              >
                {isOpening ? "Abriendo..." : "Abrir Sesión"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}