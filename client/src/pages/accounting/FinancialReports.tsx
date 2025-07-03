import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  FileSpreadsheet, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  FileText,
  Building2
} from "lucide-react";
import { format } from "date-fns";

export default function FinancialReports() {
  const [selectedReport, setSelectedReport] = useState("balance-sheet");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Query for financial data
  const { data: balanceSheet, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["/api/accounting/reports/balance-sheet", endDate],
    enabled: selectedReport === "balance-sheet",
  });

  const { data: incomeStatement, isLoading: isLoadingIncome } = useQuery({
    queryKey: ["/api/accounting/reports/income-statement", startDate, endDate],
    enabled: selectedReport === "income-statement",
  });

  const { data: trialBalance, isLoading: isLoadingTrial } = useQuery({
    queryKey: ["/api/accounting/reports/trial-balance", endDate],
    enabled: selectedReport === "trial-balance",
  });

  const { data: generalLedger, isLoading: isLoadingLedger } = useQuery({
    queryKey: ["/api/accounting/reports/general-ledger", startDate, endDate],
    enabled: selectedReport === "general-ledger",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(amount);
  };

  const exportReport = (format: string) => {
    // Implementar exportación
    console.log(`Exportando reporte ${selectedReport} en formato ${format}`);
  };

  const renderBalanceSheet = () => {
    if (isLoadingBalance) return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Generando balance general...</p>
      </div>
    );
    
    if (!balanceSheet) return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No hay datos de balance general disponibles</p>
      </div>
    );
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance General</CardTitle>
          <p className="text-sm text-muted-foreground">Al {format(new Date(endDate), "dd/MM/yyyy")}</p>
        </CardHeader>
        <CardContent className="max-h-[350px] overflow-y-auto pr-2">
          <div className="space-y-6 pb-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Activos */}
              <Card>
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                  <CardTitle className="text-blue-700 dark:text-blue-300">Activos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {balanceSheet.assets?.map((asset: any) => (
                      <div key={asset.code} className="flex justify-between">
                        <span className="text-sm">{asset.name}</span>
                        <span className="font-mono">{formatCurrency(asset.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Activos</span>
                      <span className="font-mono">{formatCurrency(balanceSheet.totals?.totalAssets || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pasivos y Patrimonio */}
              <Card>
                <CardHeader className="bg-red-50 dark:bg-red-900/20">
                  <CardTitle className="text-red-700 dark:text-red-300">Pasivos y Patrimonio</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {balanceSheet.liabilities?.map((liability: any) => (
                      <div key={liability.code} className="flex justify-between">
                        <span className="text-sm">{liability.name}</span>
                        <span className="font-mono">{formatCurrency(liability.amount)}</span>
                      </div>
                    ))}
                    {balanceSheet.equity?.map((equity: any) => (
                      <div key={equity.code} className="flex justify-between">
                        <span className="text-sm">{equity.name}</span>
                        <span className="font-mono">{formatCurrency(equity.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Pasivos + Patrimonio</span>
                      <span className="font-mono">{formatCurrency(balanceSheet.totals?.totalLiabilitiesEquity || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderIncomeStatement = () => {
    if (isLoadingIncome) return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Generando estado de resultados...</p>
      </div>
    );
    
    if (!incomeStatement) return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No hay datos de estado de resultados disponibles</p>
      </div>
    );
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Resultados</CardTitle>
          <p className="text-sm text-muted-foreground">
            Del {format(new Date(startDate), "dd/MM/yyyy")} al {format(new Date(endDate), "dd/MM/yyyy")}
          </p>
        </CardHeader>
        <CardContent className="max-h-[350px] overflow-y-auto pr-2">
          <div className="space-y-6 pb-6">
            {/* Ingresos */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3">Ingresos</h4>
              <div className="space-y-2">
                {incomeStatement.revenues?.map((revenue: any) => (
                  <div key={revenue.code} className="flex justify-between">
                    <span className="text-sm">{revenue.name}</span>
                    <span className="font-mono">{formatCurrency(revenue.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Ingresos</span>
                  <span className="font-mono">{formatCurrency(incomeStatement.totals?.totalRevenues || 0)}</span>
                </div>
              </div>
            </div>

            {/* Gastos */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-red-700 dark:text-red-300 mb-3">Gastos</h4>
              <div className="space-y-2">
                {incomeStatement.expenses?.map((expense: any) => (
                  <div key={expense.code} className="flex justify-between">
                    <span className="text-sm">{expense.name}</span>
                    <span className="font-mono">{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Gastos</span>
                  <span className="font-mono">{formatCurrency(incomeStatement.totals?.totalExpenses || 0)}</span>
                </div>
              </div>
            </div>

            {/* Utilidad Neta */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex justify-between font-bold text-lg">
                <span>Utilidad Neta</span>
                <span className={`font-mono ${(incomeStatement.totals?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(incomeStatement.totals?.netIncome || 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reportes Financieros</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuración de Reportes</CardTitle>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <span className="text-sm text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Balance General
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Estado de Resultados
          </TabsTrigger>
          <TabsTrigger value="trial-balance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Balanza de Comprobación
          </TabsTrigger>
          <TabsTrigger value="general-ledger" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Libro Mayor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance-sheet" className="mt-6">
          {renderBalanceSheet()}
        </TabsContent>

        <TabsContent value="income-statement" className="mt-6">
          {renderIncomeStatement()}
        </TabsContent>

        <TabsContent value="trial-balance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Balanza de Comprobación</CardTitle>
              <p className="text-sm text-muted-foreground">Al {format(new Date(endDate), "dd/MM/yyyy")}</p>
            </CardHeader>
            <CardContent className="max-h-[350px] overflow-y-auto pr-2">
              {isLoadingTrial ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Generando balanza de comprobación...</p>
                </div>
              ) : trialBalance ? (
                <div className="space-y-4 pb-6">
                  <div className="flex items-center justify-between">
                    <Badge variant={(trialBalance as any).totals?.isBalanced ? "default" : "destructive"}>
                      {(trialBalance as any).totals?.isBalanced ? "Balanceada" : "Desbalanceada"}
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
                      {(trialBalance as any).accounts?.map((account: any) => (
                        <TableRow key={account.accountCode}>
                          <TableCell className="font-medium">{account.accountCode}</TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{account.accountType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {account.debitBalance > 0 ? formatCurrency(account.debitBalance) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {account.creditBalance > 0 ? formatCurrency(account.creditBalance) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Separator />
                  
                  <div className="flex justify-end space-x-8 bg-muted p-4 rounded">
                    <div className="text-right">
                      <p className="font-semibold">Total Débitos:</p>
                      <p className="text-lg font-bold">{formatCurrency((trialBalance as any).totals?.totalDebits || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Total Créditos:</p>
                      <p className="text-lg font-bold">{formatCurrency((trialBalance as any).totals?.totalCredits || 0)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay datos de balanza de comprobación disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general-ledger" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Libro Mayor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Del {format(new Date(startDate), "dd/MM/yyyy")} al {format(new Date(endDate), "dd/MM/yyyy")}
              </p>
            </CardHeader>
            <CardContent className="max-h-[450px] overflow-y-auto pr-2">
              {isLoadingLedger ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Generando libro mayor...</p>
                </div>
              ) : generalLedger ? (
                <div className="space-y-6 pb-6">
                  {(generalLedger as any).accounts?.map((account: any) => (
                    <Card key={account.accountCode}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{account.accountCode} - {account.accountName}</h4>
                            <p className="text-sm text-muted-foreground">{account.accountType}</p>
                          </div>
                          <Badge variant="outline">
                            Saldo: {formatCurrency(account.balance)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Referencia</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="text-right">Débito</TableHead>
                              <TableHead className="text-right">Crédito</TableHead>
                              <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {account.entries?.map((entry: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                                <TableCell>{entry.reference}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right">
                                  {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(entry.runningBalance)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay datos del libro mayor disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}