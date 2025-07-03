import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Shield, Store, User } from "lucide-react";

const loginSchema = z.object({
  employeeCode: z.string().min(1, "Código de empleado requerido"),
  pin: z.string().min(4, "PIN debe tener al menos 4 dígitos"),
  stationId: z.string().min(1, "Seleccione una estación")
});

type LoginForm = z.infer<typeof loginSchema>;

interface POSLoginProps {
  onLogin: (employee: any, station: any) => void;
  companyId: number;
}

export default function POSLogin({ onLogin, companyId }: POSLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeCode: "",
      pin: "",
      stationId: ""
    }
  });

  // Fetch available stations
  const { data: stations } = useQuery({
    queryKey: ['/api/pos/stations'],
    enabled: !!companyId
  });

  const onSubmit = async (values: LoginForm) => {
    setIsLoading(true);
    try {
      // Authenticate employee
      const authResponse = await fetch('/api/pos/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: values.employeeCode,
          pin: values.pin,
          companyId
        })
      });

      if (!authResponse.ok) {
        throw new Error('Credenciales inválidas');
      }

      const { employee } = await authResponse.json();
      
      // Get selected station
      const selectedStation = stations?.find((s: any) => s.id === parseInt(values.stationId));
      
      if (!selectedStation) {
        throw new Error('Estación no encontrada');
      }

      onLogin(employee, selectedStation);
      
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Acceso POS</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema de punto de venta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employeeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Código de Empleado
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese su código"
                        {...field}
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      PIN
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Ingrese su PIN"
                        {...field}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Estación
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una estación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stations?.map((station: any) => (
                          <SelectItem key={station.id} value={station.id.toString()}>
                            {station.name} - {station.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Autenticando..." : "Ingresar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}