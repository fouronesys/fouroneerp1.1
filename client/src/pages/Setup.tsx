import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const setupSchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es requerido"),
  rnc: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface SetupProps {
  onComplete: () => void;
}

export default function Setup({ onComplete }: SetupProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "",
      rnc: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: SetupFormData) => {
      return await apiRequest("PUT", "/api/companies/current", data);
    },
    onSuccess: () => {
      toast({
        title: "¡Empresa configurada!",
        description: "Tu empresa ha sido configurada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/current"] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo configurar la empresa.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupFormData) => {
    createCompanyMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Configura tu Empresa</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Completa la información de tu empresa para comenzar a usar Four One System
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mi Empresa S.R.L." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rnc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RNC (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="123-45678-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(809) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contacto@miempresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle Principal #123, Santo Domingo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-200">
                      ¿Por qué necesitamos esta información?
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Esta información se usará en las facturas, reportes y documentos generados por el sistema.
                      Puedes editarla más tarde en la configuración.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={createCompanyMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createCompanyMutation.isPending ? "Configurando..." : "Configurar Empresa"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}