import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Receipt, CreditCard, Building2 } from "lucide-react";

interface PaymentFormData {
  amount: number;
  paymentMethod: string;
  accountId: number;
  description: string;
  reference: string;
}

interface ExpenseFormData {
  amount: number;
  category: string;
  accountId: number;
  description: string;
  reference: string;
  supplierId?: number;
}

export default function FinancialManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: 0,
    paymentMethod: "",
    accountId: 0,
    description: "",
    reference: ""
  });

  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    amount: 0,
    category: "",
    accountId: 0,
    description: "",
    reference: ""
  });

  // Fetch accounts for dropdowns
  const { data: accounts } = useQuery({
    queryKey: ["/api/accounting/accounts"],
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      return await apiRequest("/api/accounting/payments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado con asiento contable automático",
      });
      setPaymentForm({
        amount: 0,
        paymentMethod: "",
        accountId: 0,
        description: "",
        reference: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/journal-entries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive",
      });
    },
  });

  // Expense mutation
  const expenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      return await apiRequest("/api/accounting/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Gasto registrado",
        description: "El gasto ha sido registrado con asiento contable automático",
      });
      setExpenseForm({
        amount: 0,
        category: "",
        accountId: 0,
        description: "",
        reference: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/journal-entries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentForm.amount <= 0 || !paymentForm.paymentMethod || !paymentForm.accountId) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    paymentMutation.mutate(paymentForm);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0 || !expenseForm.category || !expenseForm.accountId) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    expenseMutation.mutate(expenseForm);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Gestión Financiera
        </h1>
        <p className="text-muted-foreground">
          Registre pagos y gastos con integración automática al sistema contable
        </p>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Gastos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Registrar Pago
              </CardTitle>
              <CardDescription>
                Los pagos se registrarán automáticamente en el sistema contable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount">Monto *</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentForm.amount || ""}
                      onChange={(e) => setPaymentForm(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Método de Pago *</Label>
                    <Select 
                      value={paymentForm.paymentMethod}
                      onValueChange={(value) => setPaymentForm(prev => ({ 
                        ...prev, 
                        paymentMethod: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-account">Cuenta Destino *</Label>
                    <Select 
                      value={paymentForm.accountId.toString()}
                      onValueChange={(value) => setPaymentForm(prev => ({ 
                        ...prev, 
                        accountId: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(accounts) && accounts.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-reference">Referencia</Label>
                    <Input
                      id="payment-reference"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm(prev => ({ 
                        ...prev, 
                        reference: e.target.value 
                      }))}
                      placeholder="Número de recibo, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-description">Descripción *</Label>
                  <Textarea
                    id="payment-description"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    placeholder="Descripción del pago"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={paymentMutation.isPending}
                >
                  {paymentMutation.isPending ? "Registrando..." : "Registrar Pago"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Registrar Gasto
              </CardTitle>
              <CardDescription>
                Los gastos se registrarán automáticamente en el sistema contable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Monto *</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseForm.amount || ""}
                      onChange={(e) => setExpenseForm(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-category">Categoría *</Label>
                    <Select 
                      value={expenseForm.category}
                      onValueChange={(value) => setExpenseForm(prev => ({ 
                        ...prev, 
                        category: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utilities">Servicios Públicos</SelectItem>
                        <SelectItem value="office_supplies">Suministros de Oficina</SelectItem>
                        <SelectItem value="professional_services">Servicios Profesionales</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                        <SelectItem value="transportation">Transporte</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-account">Cuenta de Gasto *</Label>
                    <Select 
                      value={expenseForm.accountId.toString()}
                      onValueChange={(value) => setExpenseForm(prev => ({ 
                        ...prev, 
                        accountId: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(accounts) && accounts
                          .filter((account: any) => account.category === 'GASTO')
                          .map((account: any) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-supplier">Proveedor (Opcional)</Label>
                    <Select 
                      value={expenseForm.supplierId?.toString() || ""}
                      onValueChange={(value) => setExpenseForm(prev => ({ 
                        ...prev, 
                        supplierId: value ? parseInt(value) : undefined 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.businessName || supplier.contactName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-reference">Referencia</Label>
                    <Input
                      id="expense-reference"
                      value={expenseForm.reference}
                      onChange={(e) => setExpenseForm(prev => ({ 
                        ...prev, 
                        reference: e.target.value 
                      }))}
                      placeholder="Número de factura, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-description">Descripción *</Label>
                  <Textarea
                    id="expense-description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    placeholder="Descripción del gasto"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={expenseMutation.isPending}
                >
                  {expenseMutation.isPending ? "Registrando..." : "Registrar Gasto"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}