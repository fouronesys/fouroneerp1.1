import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  TrendingUp, 
  FileText, 
  BookOpen, 
  PlusCircle,
  Download,
  Calendar,
  DollarSign,
  Building2,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Account {
  id: number;
  code: string;
  name: string;
  accountType: string;
  currentBalance: string;
  allowTransactions: boolean;
  level: number;
  isParent: boolean;
}

interface JournalEntry {
  id: number;
  entryNumber: string;
  reference: string;
  description: string;
  entryDate: string;
  totalDebit: string;
  totalCredit: string;
  status: string;
  sourceModule: string;
}

interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
  balance: number;
}

interface TrialBalance {
  accounts: TrialBalanceAccount[];
  totals: {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  };
  asOfDate: string;
}

export default function Accounting() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [reportStartDate, setReportStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [reportEndDate, setReportEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [trialBalanceDate, setTrialBalanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chart of accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/accounting/accounts"],
  });

  // Fetch journal entries
  const { data: journalEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/accounting/journal-entries"],
  });

  // Initialize accounting system
  const initializeAccountingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/accounting/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to initialize accounting system");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sistema Contable Inicializado",
        description: "El plan de cuentas y configuración inicial han sido creados exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize accounting system",
        variant: "destructive",
      });
    },
  });

  // Generate trial balance
  const { data: trialBalance, refetch: refetchTrialBalance, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ["/api/accounting/trial-balance", trialBalanceDate],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/trial-balance?asOfDate=${trialBalanceDate}`);
      if (!response.ok) throw new Error("Failed to fetch trial balance");
      return response.json();
    },
    enabled: false,
  });

  // Generate income statement
  const { data: incomeStatement, refetch: refetchIncomeStatement, isLoading: incomeStatementLoading } = useQuery({
    queryKey: ["/api/accounting/income-statement", reportStartDate, reportEndDate],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/income-statement?startDate=${reportStartDate}&endDate=${reportEndDate}`);
      if (!response.ok) throw new Error("Failed to fetch income statement");
      return response.json();
    },
    enabled: false,
  });

  // Generate balance sheet
  const { data: balanceSheet, refetch: refetchBalanceSheet, isLoading: balanceSheetLoading } = useQuery({
    queryKey: ["/api/accounting/balance-sheet", trialBalanceDate],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/balance-sheet?asOfDate=${trialBalanceDate}`);
      if (!response.ok) throw new Error("Failed to fetch balance sheet");
      return response.json();
    },
    enabled: false,
  });

  // General ledger for selected account
  const { data: generalLedger, isLoading: ledgerLoading } = useQuery({
    queryKey: ["/api/accounting/general-ledger", selectedAccountId, reportStartDate, reportEndDate],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      const response = await fetch(`/api/accounting/general-ledger/${selectedAccountId}?startDate=${reportStartDate}&endDate=${reportEndDate}`);
      if (!response.ok) throw new Error("Failed to fetch general ledger");
      return response.json();
    },
    enabled: !!selectedAccountId,
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-4 space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Módulo de Contabilidad</h1>
            <p className="text-muted-foreground">
              Sistema completo de contabilidad con plan de cuentas, asientos contables y reportes financieros
            </p>
          </div>
          <Button
            onClick={() => initializeAccountingMutation.mutate()}
            disabled={initializeAccountingMutation.isPending}
            variant="outline"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Inicializar Sistema Contable
          </Button>
        </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-1">
          <TabsTrigger value="accounts" className="text-xs sm:text-sm px-1 py-2">
            <span className="hidden sm:inline">Plan de Cuentas</span>
            <span className="sm:hidden">Cuentas</span>
          </TabsTrigger>
          <TabsTrigger value="entries" className="text-xs sm:text-sm px-1 py-2">
            <span className="hidden sm:inline">Asientos Contables</span>
            <span className="sm:hidden">Asientos</span>
          </TabsTrigger>
          <TabsTrigger value="trial-balance" className="text-xs sm:text-sm px-1 py-2">
            <span className="hidden sm:inline">Balanza de Comprobación</span>
            <span className="sm:hidden">Balanza</span>
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="text-xs sm:text-sm px-1 py-2">
            <span className="hidden sm:inline">Estado de Resultados</span>
            <span className="sm:hidden">Resultados</span>
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="text-xs sm:text-sm px-1 py-2">
            <span className="hidden sm:inline">Balance General</span>
            <span className="sm:hidden">Balance</span>
          </TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs sm:text-sm px-1 py-2">
            <span className="hidden sm:inline">Libro Mayor</span>
            <span className="sm:hidden">Mayor</span>
          </TabsTrigger>
        </TabsList>

        {/* Plan de Cuentas */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Plan de Cuentas
              </CardTitle>
              <CardDescription>
                Estructura jerárquica de todas las cuentas contables de la empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No hay cuentas configuradas. Inicialice el sistema contable para crear el plan de cuentas básico.
                  </p>
                  <Button onClick={() => initializeAccountingMutation.mutate()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Inicializar Plan de Cuentas
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">Código</TableHead>
                        <TableHead className="min-w-[200px]">Nombre</TableHead>
                        <TableHead className="hidden sm:table-cell min-w-[100px]">Tipo</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[120px] text-right">Saldo</TableHead>
                        <TableHead className="hidden lg:table-cell min-w-[100px]">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account: Account) => (
                        <TableRow 
                          key={account.id}
                          className={`${account.isParent ? 'font-semibold bg-muted/50' : ''}`}
                        >
                          <TableCell className="font-mono text-xs sm:text-sm">
                            <span className={account.level > 1 ? 'ml-2 sm:ml-4' : ''}>
                              {account.code}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="flex flex-col">
                              <span>{account.name}</span>
                              <div className="flex gap-2 mt-1 sm:hidden">
                                <Badge variant="outline" className="text-xs">{account.accountType}</Badge>
                                {account.allowTransactions && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(account.currentBalance)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">{account.accountType}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-right">
                            {account.allowTransactions && formatCurrency(account.currentBalance)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={account.allowTransactions ? "default" : "secondary"} className="text-xs">
                              {account.allowTransactions ? "Operativa" : "Agrupación"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asientos Contables */}
        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Asientos Contables
              </CardTitle>
              <CardDescription>
                Registro de todas las transacciones contables del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Número</TableHead>
                        <TableHead className="hidden sm:table-cell min-w-[100px]">Fecha</TableHead>
                        <TableHead className="min-w-[150px]">Descripción</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[100px] text-right">Débito</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[100px] text-right">Crédito</TableHead>
                        <TableHead className="hidden lg:table-cell min-w-[100px]">Estado</TableHead>
                        <TableHead className="hidden lg:table-cell min-w-[100px]">Origen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntries.map((entry: JournalEntry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{entry.entryNumber}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{formatDate(entry.entryDate)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex flex-col">
                            <span>{entry.description}</span>
                            <div className="flex gap-2 mt-1 sm:hidden text-xs text-muted-foreground">
                              <span>{formatDate(entry.entryDate)}</span>
                              <span>D: {formatCurrency(entry.totalDebit)}</span>
                              <span>C: {formatCurrency(entry.totalCredit)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right text-xs sm:text-sm">{formatCurrency(entry.totalDebit)}</TableCell>
                        <TableCell className="hidden md:table-cell text-right text-xs sm:text-sm">{formatCurrency(entry.totalCredit)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'} className="text-xs">
                            {entry.status === 'posted' ? 'Contabilizado' : 'Borrador'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">{entry.sourceModule || 'Manual'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balanza de Comprobación */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Balanza de Comprobación
              </CardTitle>
              <CardDescription>
                Resumen de saldos de todas las cuentas contables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="trial-balance-date">Fecha de Corte</Label>
                  <Input
                    id="trial-balance-date"
                    type="date"
                    value={trialBalanceDate}
                    onChange={(e) => setTrialBalanceDate(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => refetchTrialBalance()}
                  disabled={trialBalanceLoading}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generar Balanza
                </Button>
              </div>

              {trialBalance && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Balanza de Comprobación al {formatDate(trialBalance.asOfDate)}
                    </h3>
                    <Badge variant={trialBalance.totals.isBalanced ? "default" : "destructive"}>
                      {trialBalance.totals.isBalanced ? "Balanceada" : "Desbalanceada"}
                    </Badge>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Débito</TableHead>
                        <TableHead className="text-right">Crédito</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.accounts.map((account) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">{account.accountCode}</TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{account.accountType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {account.debitBalance > 0 && formatCurrency(account.debitBalance)}
                          </TableCell>
                          <TableCell className="text-right">
                            {account.creditBalance > 0 && formatCurrency(account.creditBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Separator />
                  
                  <div className="flex justify-end space-x-8">
                    <div className="text-right">
                      <p className="font-semibold">Total Débitos:</p>
                      <p className="text-lg">{formatCurrency(trialBalance.totals.totalDebits)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Total Créditos:</p>
                      <p className="text-lg">{formatCurrency(trialBalance.totals.totalCredits)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estado de Resultados */}
        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estado de Resultados
              </CardTitle>
              <CardDescription>
                Ingresos, gastos y utilidad neta del período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="income-start-date">Fecha Inicial</Label>
                  <Input
                    id="income-start-date"
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="income-end-date">Fecha Final</Label>
                  <Input
                    id="income-end-date"
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => refetchIncomeStatement()}
                disabled={incomeStatementLoading}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Generar Estado de Resultados
              </Button>

              {incomeStatement && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Estado de Resultados del {formatDate(incomeStatement.period.startDate)} al {formatDate(incomeStatement.period.endDate)}
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">INGRESOS</h4>
                      <Table>
                        <TableBody>
                          {incomeStatement.revenues.map((revenue: any) => (
                            <TableRow key={revenue.accountId}>
                              <TableCell>{revenue.accountName}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(revenue.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell className="font-semibold">Total Ingresos</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(incomeStatement.totals.totalRevenues)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">GASTOS</h4>
                      <Table>
                        <TableBody>
                          {incomeStatement.expenses.map((expense: any) => (
                            <TableRow key={expense.accountId}>
                              <TableCell>{expense.accountName}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(Math.abs(expense.amount))}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell className="font-semibold">Total Gastos</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(Math.abs(incomeStatement.totals.totalExpenses))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <p className="text-xl font-bold">
                      Utilidad Neta: {' '}
                      <span className={incomeStatement.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(incomeStatement.totals.netIncome)}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance General */}
        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Balance General
              </CardTitle>
              <CardDescription>
                Estado de la situación financiera de la empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="balance-sheet-date">Fecha de Corte</Label>
                  <Input
                    id="balance-sheet-date"
                    type="date"
                    value={trialBalanceDate}
                    onChange={(e) => setTrialBalanceDate(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => refetchBalanceSheet()}
                  disabled={balanceSheetLoading}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Generar Balance General
                </Button>
              </div>

              {balanceSheet && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Balance General al {formatDate(balanceSheet.asOfDate)}
                    </h3>
                    <Badge variant={balanceSheet.totals.isBalanced ? "default" : "destructive"}>
                      {balanceSheet.totals.isBalanced ? "Balanceado" : "Desbalanceado"}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">ACTIVOS</h4>
                      <Table>
                        <TableBody>
                          {balanceSheet.assets.map((asset: any) => (
                            <TableRow key={asset.accountId}>
                              <TableCell>{asset.accountName}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(asset.balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell className="font-semibold">Total Activos</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(balanceSheet.totals.totalAssets)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">PASIVOS</h4>
                        <Table>
                          <TableBody>
                            {balanceSheet.liabilities.map((liability: any) => (
                              <TableRow key={liability.accountId}>
                                <TableCell>{liability.accountName}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(liability.balance)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="border-t-2">
                              <TableCell className="font-semibold">Total Pasivos</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(balanceSheet.totals.totalLiabilities)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">PATRIMONIO</h4>
                        <Table>
                          <TableBody>
                            {balanceSheet.equity.map((equity: any) => (
                              <TableRow key={equity.accountId}>
                                <TableCell>{equity.accountName}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(equity.balance)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="border-t-2">
                              <TableCell className="font-semibold">Total Patrimonio</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(balanceSheet.totals.totalEquity)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      Total Pasivos + Patrimonio: {formatCurrency(balanceSheet.totals.totalLiabilities + balanceSheet.totals.totalEquity)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Libro Mayor */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Libro Mayor
              </CardTitle>
              <CardDescription>
                Movimientos detallados por cuenta contable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="account-select">Cuenta</Label>
                  <Select value={selectedAccountId?.toString() || undefined} onValueChange={(value) => setSelectedAccountId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((account: Account) => account.allowTransactions)
                        .map((account: Account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="ledger-start-date">Fecha Inicial</Label>
                  <Input
                    id="ledger-start-date"
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="ledger-end-date">Fecha Final</Label>
                  <Input
                    id="ledger-end-date"
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedAccountId && generalLedger && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Movimientos de la cuenta {accounts.find((a: Account) => a.id === selectedAccountId)?.name}
                  </h3>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Asiento</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Débito</TableHead>
                        <TableHead className="text-right">Crédito</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generalLedger.map((transaction: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(transaction.entryDate)}</TableCell>
                          <TableCell className="font-medium">{transaction.entryNumber}</TableCell>
                          <TableCell>{transaction.reference}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="text-right">
                            {parseFloat(transaction.debitAmount) > 0 && formatCurrency(transaction.debitAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(transaction.creditAmount) > 0 && formatCurrency(transaction.creditAmount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.runningBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!selectedAccountId && (
                <div className="text-center py-8 text-muted-foreground">
                  Selecciona una cuenta para ver sus movimientos en el libro mayor
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}