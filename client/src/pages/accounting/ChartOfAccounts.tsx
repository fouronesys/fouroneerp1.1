import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Calculator, TrendingUp, TrendingDown, Wallet, Eye } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const accountSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  parentId: z.number().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function ChartOfAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/accounting/accounts"],
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "asset",
      parentId: null,
      description: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AccountFormData) =>
      apiRequest("/api/accounting/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/accounts"] });
      toast({
        title: "Cuenta creada",
        description: "La cuenta ha sido creada exitosamente.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la cuenta",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountFormData }) =>
      apiRequest(`/api/accounting/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/accounts"] });
      toast({
        title: "Cuenta actualizada",
        description: "La cuenta ha sido actualizada exitosamente.",
      });
      setEditingAccount(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la cuenta",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/accounting/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/accounts"] });
      toast({
        title: "Cuenta eliminada",
        description: "La cuenta ha sido eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la cuenta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountFormData) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    form.reset({
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId,
      description: account.description || "",
      isActive: account.isActive,
    });
  };

  const handleViewDetails = (account: any) => {
    setSelectedAccount(account);
    setIsDetailsDialogOpen(true);
  };

  const filteredAccounts = Array.isArray(accounts) ? accounts.filter((account: any) =>
    (account.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      asset: "Activo",
      liability: "Pasivo",
      equity: "Patrimonio",
      revenue: "Ingreso",
      expense: "Gasto",
    };
    return labels[type] || type;
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "asset": return <Wallet className="h-4 w-4" />;
      case "liability": return <TrendingDown className="h-4 w-4" />;
      case "equity": return <Calculator className="h-4 w-4" />;
      case "revenue": return <TrendingUp className="h-4 w-4" />;
      case "expense": return <TrendingDown className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "asset": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "liability": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "equity": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "revenue": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "expense": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "";
    }
  };

  // Organizar cuentas en jerarquía
  const organizeAccountsHierarchy = (accounts: any[]) => {
    const accountMap = new Map();
    const rootAccounts: any[] = [];

    // Crear mapa de cuentas
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Organizar jerarquía
    accounts.forEach(account => {
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(accountMap.get(account.id));
        }
      } else {
        rootAccounts.push(accountMap.get(account.id));
      }
    });

    return rootAccounts;
  };

  const renderAccountRow = (account: any, level: number = 0) => {
    return (
      <>
        <TableRow key={account.id}>
          <TableCell style={{ paddingLeft: `${level * 2 + 0.5}rem` }}>
            <div className="flex items-center gap-2">
              {getAccountTypeIcon(account.type)}
              <span className="font-medium">{account.code}</span>
            </div>
          </TableCell>
          <TableCell>{account.name}</TableCell>
          <TableCell>
            <Badge className={getAccountTypeColor(account.type)}>
              {getAccountTypeLabel(account.type)}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant={account.is_active ? "default" : "secondary"}>
              {account.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </TableCell>
          <TableCell className="text-right font-mono">
            {account.current_balance 
              ? `RD$${parseFloat(account.current_balance).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "RD$0.00"
            }
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetails(account)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver detalles
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(account)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("¿Está seguro de eliminar esta cuenta?")) {
                    deleteMutation.mutate(account.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {account.children?.map((child: any) => (
          <React.Fragment key={child.id}>
            {renderAccountRow(child, level + 1)}
          </React.Fragment>
        ))}
      </>
    );
  };

  const hierarchicalAccounts = organizeAccountsHierarchy(filteredAccounts);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Plan de Cuentas</h1>
        <Dialog open={isAddDialogOpen || !!editingAccount} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingAccount(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: 1101" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Cuenta</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Caja General" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cuenta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asset">Activo</SelectItem>
                            <SelectItem value="liability">Pasivo</SelectItem>
                            <SelectItem value="equity">Patrimonio</SelectItem>
                            <SelectItem value="revenue">Ingreso</SelectItem>
                            <SelectItem value="expense">Gasto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuenta Padre (Opcional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cuenta padre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sin cuenta padre</SelectItem>
                            {Array.isArray(accounts) && accounts
                              .filter((acc: any) => acc.id !== editingAccount?.id)
                              .map((account: any) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descripción de la cuenta" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingAccount(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAccount ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cuentas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[450px] overflow-y-auto pr-2">
          <div className="pb-6">
            {isLoading ? (
              <div className="text-center py-4">Cargando plan de cuentas...</div>
            ) : hierarchicalAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No se encontraron cuentas contables</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hierarchicalAccounts.map(account => (
                    <React.Fragment key={account.id}>
                      {renderAccountRow(account)}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles de cuenta */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Cuenta</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Badge className={getAccountTypeColor(selectedAccount.type)}>
                    {getAccountTypeLabel(selectedAccount.type)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Badge variant={selectedAccount.is_active ? "default" : "secondary"}>
                    {selectedAccount.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo Actual</label>
                  <p className="text-sm font-mono">
                    {selectedAccount.current_balance 
                      ? `RD$${parseFloat(selectedAccount.current_balance).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "RD$0.00"
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoría</label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.category || "N/A"}</p>
                </div>
              </div>
              {selectedAccount.description && (
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <p className="text-sm text-muted-foreground">{selectedAccount.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}