import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calculator, Users, FileText, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PayrollCalculation {
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  grossSalary: number;
  deductions: {
    sfs: number;
    afp: number;
    isr: number;
    total: number;
  };
  netSalary: number;
  calculatedAt: Date;
}

interface PayrollFormData {
  employeeId: string;
  month: string;
  year: string;
}

export default function Payroll() {
  const { toast } = useToast();
  const [selectedCalculation, setSelectedCalculation] = useState<PayrollCalculation | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm<PayrollFormData>();
  const watchedEmployee = watch("employeeId");
  const watchedMonth = watch("month");
  const watchedYear = watch("year");

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Fetch payroll records
  const { data: payrollRecords = [], refetch } = useQuery({
    queryKey: ["/api/payroll"],
  });

  // Calculate payroll mutation
  const calculatePayrollMutation = useMutation({
    mutationFn: async (data: PayrollFormData) => {
      return apiRequest("/api/payroll/calculate", {
        method: "POST",
        body: {
          employeeId: parseInt(data.employeeId),
          month: parseInt(data.month),
          year: parseInt(data.year),
        },
      });
    },
    onSuccess: (data) => {
      setSelectedCalculation(data);
      toast({
        title: "Cálculo completado",
        description: "Deducciones calculadas automáticamente según leyes dominicanas",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo calcular la nómina",
        variant: "destructive",
      });
    },
  });

  // Process payroll mutation
  const processPayrollMutation = useMutation({
    mutationFn: async (calculation: PayrollCalculation) => {
      return apiRequest("/api/payroll", {
        method: "POST",
        body: calculation,
      });
    },
    onSuccess: () => {
      toast({
        title: "Nómina procesada",
        description: "El registro de nómina ha sido guardado exitosamente",
      });
      setSelectedCalculation(null);
      setShowCalculator(false);
      reset();
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo procesar la nómina",
        variant: "destructive",
      });
    },
  });

  const onCalculate = (data: PayrollFormData) => {
    calculatePayrollMutation.mutate(data);
  };

  const onProcessPayroll = () => {
    if (selectedCalculation) {
      processPayrollMutation.mutate(selectedCalculation);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nómina</h1>
          <p className="text-muted-foreground">
            Cálculo automático de deducciones según leyes dominicanas
          </p>
        </div>
        <Button 
          onClick={() => setShowCalculator(!showCalculator)}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          {showCalculator ? "Ocultar Calculadora" : "Nueva Nómina"}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Nómina</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nómina Actual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonth}/{currentYear}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Calculator */}
      {showCalculator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculadora de Nómina
            </CardTitle>
            <CardDescription>
              Calcula automáticamente SFS (2.87%), AFP (2.87%) e ISR según escalas vigentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onCalculate)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Empleado</Label>
                <Select 
                  value={watchedEmployee} 
                  onValueChange={(value) => setValue("employeeId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Mes</Label>
                <Select 
                  value={watchedMonth} 
                  onValueChange={(value) => setValue("month", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1, 1).toLocaleDateString('es-DO', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Select 
                  value={watchedYear} 
                  onValueChange={(value) => setValue("year", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={!watchedEmployee || !watchedMonth || !watchedYear || calculatePayrollMutation.isPending}
                  className="w-full"
                >
                  {calculatePayrollMutation.isPending ? "Calculando..." : "Calcular"}
                </Button>
              </div>
            </form>

            {/* Calculation Results */}
            {selectedCalculation && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Resultado del Cálculo</h3>
                  <Badge variant="outline">
                    {selectedCalculation.month}/{selectedCalculation.year}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Empleado:</span>
                      <span>{selectedCalculation.employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Salario Bruto:</span>
                      <span className="font-mono">{formatCurrency(selectedCalculation.grossSalary)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span>SFS (2.87%):</span>
                      <span className="font-mono text-red-600">-{formatCurrency(selectedCalculation.deductions.sfs)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AFP (2.87%):</span>
                      <span className="font-mono text-red-600">-{formatCurrency(selectedCalculation.deductions.afp)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ISR:</span>
                      <span className="font-mono text-red-600">-{formatCurrency(selectedCalculation.deductions.isr)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Total Deducciones:</span>
                      <span className="font-mono text-red-600">-{formatCurrency(selectedCalculation.deductions.total)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Salario Neto:</span>
                      <span className="font-mono text-green-600">{formatCurrency(selectedCalculation.netSalary)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={onProcessPayroll}
                    disabled={processPayrollMutation.isPending}
                    className="flex-1"
                  >
                    {processPayrollMutation.isPending ? "Procesando..." : "Procesar Nómina"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedCalculation(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll Records */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Nómina</CardTitle>
          <CardDescription>
            Historial de nóminas procesadas con deducciones automáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros de nómina. Calcula tu primera nómina usando la calculadora.
            </div>
          ) : (
            <div className="space-y-2">
              {payrollRecords.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {record.employee?.firstName} {record.employee?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Procesado: {new Date(record.createdAt).toLocaleDateString('es-DO')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {formatCurrency(Number(record.netPay))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Bruto: {formatCurrency(Number(record.grossPay))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}