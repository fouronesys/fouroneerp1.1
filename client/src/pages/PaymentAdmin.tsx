import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, CheckCircle, XCircle, Clock, Eye, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PaymentSubmission {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  rnc?: string;
  paymentMethod: string;
  bankAccount: string;
  amount: string;
  reference: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

const bankAccountNames = {
  'popular_savings': 'Banco Popular - Ahorros (844480111)',
  'popular_checking': 'Banco Popular - Corriente (838073138)',
  'banreservas_checking': 'Banreservas - Corriente (4231803209)',
  'bhd_checking': 'BHD León - Corriente (34860440011)',
  'apap_savings': 'APAP - Ahorros (1034116428)'
};

export default function PaymentAdmin() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<PaymentSubmission[]>({
    queryKey: ['/api/payments/submissions'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      console.log('[DEBUG] Sending payment update request:', { id, status, notes });
      
      const response = await fetch(`/api/payments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });
      
      console.log('[DEBUG] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Error response:', errorText);
        throw new Error(`Failed to update payment status: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[DEBUG] Payment update successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[DEBUG] Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/payments/submissions'] });
      toast({
        title: "Estado Actualizado",
        description: "El estado del pago ha sido actualizado exitosamente.",
      });
      setSelectedPayment(null);
      setNewStatus('');
      setAdminNotes('');
    },
    onError: (error) => {
      console.error('[DEBUG] Mutation error:', error);
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado del pago: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendiente</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Confirmado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedPayment || !newStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedPayment.id,
      status: newStatus,
      notes: adminNotes
    });
  };

  const totalPending = payments.filter((p: PaymentSubmission) => p.status === 'pending').length;
  const totalConfirmed = payments.filter((p: PaymentSubmission) => p.status === 'confirmed').length;
  const totalRevenue = payments
    .filter((p: PaymentSubmission) => p.status === 'confirmed')
    .reduce((sum: number, p: PaymentSubmission) => sum + parseFloat(p.amount), 0);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-3xl font-bold">Administración de Pagos</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Esperando verificación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConfirmed}</div>
            <p className="text-xs text-muted-foreground">
              Licencias activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue.toString())}</div>
            <p className="text-xs text-muted-foreground">
              De pagos confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Solicitudes de Pago
          </CardTitle>
          <CardDescription>
            Gestiona y verifica los pagos recibidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: PaymentSubmission) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{payment.name}</div>
                        <div className="text-sm text-muted-foreground">{payment.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{payment.company}</div>
                        {payment.rnc && (
                          <div className="text-sm text-muted-foreground">RNC: {payment.rnc}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {bankAccountNames[payment.bankAccount as keyof typeof bankAccountNames] || payment.bankAccount}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.reference}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(payment.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setNewStatus(payment.status);
                              setAdminNotes(payment.adminNotes || '');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles del Pago</DialogTitle>
                            <DialogDescription>
                              Información completa y gestión del estado
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedPayment && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Cliente</label>
                                  <p className="text-sm">{selectedPayment.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p className="text-sm">{selectedPayment.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Teléfono</label>
                                  <p className="text-sm">{selectedPayment.phone}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Empresa</label>
                                  <p className="text-sm">{selectedPayment.company}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Monto</label>
                                  <p className="text-sm font-bold">{formatCurrency(selectedPayment.amount)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Referencia</label>
                                  <p className="text-sm font-mono">{selectedPayment.reference}</p>
                                </div>
                              </div>

                              {selectedPayment.notes && (
                                <div>
                                  <label className="text-sm font-medium">Notas del Cliente</label>
                                  <p className="text-sm p-2 bg-muted rounded">{selectedPayment.notes}</p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Actualizar Estado</label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="confirmed">Confirmado</SelectItem>
                                    <SelectItem value="rejected">Rechazado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <label className="text-base font-medium">Confirmar Pago</label>
                                  <p className="text-sm text-muted-foreground">
                                    Marca este pago como confirmado automáticamente
                                  </p>
                                </div>
                                <Switch
                                  checked={newStatus === 'confirmed'}
                                  onCheckedChange={(checked: boolean) => setNewStatus(checked ? 'confirmed' : 'pending')}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Notas Administrativas</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Añadir notas internas sobre este pago..."
                                  className="resize-none"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  onClick={handleUpdateStatus}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  {updateStatusMutation.isPending ? 'Actualizando...' : 'Actualizar Estado'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}