import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Settings,
  Upload,
  Eye,
  Ban,
  Check,
} from "lucide-react";

interface Company {
  id: number;
  name: string;
  businessName: string;
  rnc: string;
  email: string;
  phone: string;
  logoUrl?: string;
  subscriptionPlan: string;
  paymentConfirmed: boolean;
  paymentStatus: string;
  isActive: boolean;
  createdAt: string;
  activeModules?: string[];
}

const AVAILABLE_MODULES = [
  { id: 'pos', name: 'Punto de Venta', description: 'Sistema de ventas' },
  { id: 'inventory', name: 'Inventario', description: 'Gestión de productos' },
  { id: 'customers', name: 'Clientes', description: 'Gestión de clientes' },
  { id: 'suppliers', name: 'Proveedores', description: 'Gestión de proveedores' },
  { id: 'billing', name: 'Facturación', description: 'Facturación fiscal' },
  { id: 'accounting', name: 'Contabilidad', description: 'Módulo contable' },
  { id: 'reports', name: 'Reportes', description: 'Reportes y análisis' },
  { id: 'warehouse', name: 'Almacenes', description: 'Gestión de bodegas' },
  { id: 'hr', name: 'Recursos Humanos', description: 'Gestión de personal' },
  { id: 'ai', name: 'Asistente IA', description: 'Análisis inteligente' },
  { id: 'system', name: 'Sistema', description: 'Configuración del sistema' },
  { id: 'audit', name: 'Auditoría', description: 'Registro de actividades' },
];

export default function CompanyManagement() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    rnc: "",
    email: "",
    phone: "",
    logoUrl: "",
    paymentStatus: "pending",
    paymentConfirmed: false,
    isActive: true,
    activeModules: [] as string[],
  });

  const { toast } = useToast();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["/api/admin/companies"],
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Company> }) => {
      return apiRequest(`/api/admin/companies/${data.id}`, {
        method: "PATCH",
        body: data.updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({
        title: "Empresa actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      setEditDialogOpen(false);
      setModulesDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la empresa",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      businessName: company.businessName || "",
      rnc: company.rnc || "",
      email: company.email || "",
      phone: company.phone || "",
      logoUrl: company.logoUrl || "",
      paymentStatus: company.paymentStatus,
      paymentConfirmed: company.paymentConfirmed,
      isActive: company.isActive,
      activeModules: company.activeModules || [],
    });
    setEditDialogOpen(true);
  };

  const handleModulesEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      ...formData,
      activeModules: company.activeModules || [],
    });
    setModulesDialogOpen(true);
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    setViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedCompany) return;
    
    updateCompanyMutation.mutate({
      id: selectedCompany.id,
      updates: formData,
    });
  };

  const handleSaveModules = () => {
    if (!selectedCompany) return;
    
    updateCompanyMutation.mutate({
      id: selectedCompany.id,
      updates: { activeModules: formData.activeModules },
    });
  };

  const toggleActive = (companyId: number, isActive: boolean) => {
    updateCompanyMutation.mutate({
      id: companyId,
      updates: { isActive },
    });
  };

  const confirmPayment = (companyId: number, confirmed: boolean) => {
    updateCompanyMutation.mutate({
      id: companyId,
      updates: { 
        paymentConfirmed: confirmed,
        paymentStatus: confirmed ? "confirmed" : "pending"
      },
    });
  };

  const toggleModuleActive = (moduleId: string) => {
    const newModules = formData.activeModules.includes(moduleId)
      ? formData.activeModules.filter(m => m !== moduleId)
      : [...formData.activeModules, moduleId];
    
    setFormData({ ...formData, activeModules: newModules });
  };

  const getStatusBadge = (company: Company) => {
    if (!company.isActive) {
      return <Badge variant="destructive">Inactiva</Badge>;
    }
    if (!company.paymentConfirmed) {
      return <Badge variant="secondary">Pago Pendiente</Badge>;
    }
    return <Badge variant="default">Activa</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestión de Empresas
          </CardTitle>
          <CardDescription>
            Administra las empresas registradas en el sistema, confirma pagos y configura módulos activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>RNC</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies?.map((company: Company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.businessName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.rnc || "—"}</TableCell>
                    <TableCell>{company.email || "—"}</TableCell>
                    <TableCell>{getStatusBadge(company)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {company.paymentConfirmed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {company.paymentConfirmed ? "Confirmado" : "Pendiente"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(company.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(company)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModulesEdit(company)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={company.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleActive(company.id, !company.isActive)}
                        >
                          {company.isActive ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={company.paymentConfirmed ? "destructive" : "default"}
                          size="sm"
                          onClick={() => confirmPayment(company.id, !company.paymentConfirmed)}
                          title={company.paymentConfirmed ? "Marcar como pendiente" : "Confirmar pago"}
                        >
                          {company.paymentConfirmed ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Modifica la información de la empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Empresa</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Razón Social</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rnc">RNC</Label>
              <Input
                id="rnc"
                value={formData.rnc}
                onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL del Logo</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Estado de Pago</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
              >
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
            <div className="flex items-center space-x-2">
              <Switch
                id="paymentConfirmed"
                checked={formData.paymentConfirmed}
                onCheckedChange={(checked) => setFormData({ ...formData, paymentConfirmed: checked })}
              />
              <Label htmlFor="paymentConfirmed">Pago Confirmado</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Empresa Activa</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateCompanyMutation.isPending}>
              {updateCompanyMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modules Configuration Dialog */}
      <Dialog open={modulesDialogOpen} onOpenChange={setModulesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Módulos</DialogTitle>
            <DialogDescription>
              Activa o desactiva módulos para {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {AVAILABLE_MODULES.map((module) => (
              <div key={module.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Switch
                  id={module.id}
                  checked={formData.activeModules.includes(module.id)}
                  onCheckedChange={() => toggleModuleActive(module.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={module.id} className="font-medium">
                    {module.name}
                  </Label>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModulesDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveModules} disabled={updateCompanyMutation.isPending}>
              {updateCompanyMutation.isPending ? "Guardando..." : "Guardar Módulos"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Company Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Empresa</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedCompany.logoUrl ? (
                  <img
                    src={selectedCompany.logoUrl}
                    alt={selectedCompany.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedCompany.name}</h3>
                  <p className="text-gray-600">{selectedCompany.businessName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">RNC</Label>
                  <p>{selectedCompany.rnc || "—"}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedCompany.email || "—"}</p>
                </div>
                <div>
                  <Label className="font-medium">Teléfono</Label>
                  <p>{selectedCompany.phone || "—"}</p>
                </div>
                <div>
                  <Label className="font-medium">Estado</Label>
                  <p>{getStatusBadge(selectedCompany)}</p>
                </div>
                <div>
                  <Label className="font-medium">Plan</Label>
                  <p>{selectedCompany.subscriptionPlan}</p>
                </div>
                <div>
                  <Label className="font-medium">Fecha de Creación</Label>
                  <p>{new Date(selectedCompany.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label className="font-medium">Módulos Activos</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCompany.activeModules?.map((moduleId) => {
                    const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
                    return module ? (
                      <Badge key={moduleId} variant="secondary">
                        {module.name}
                      </Badge>
                    ) : null;
                  })}
                  {(!selectedCompany.activeModules || selectedCompany.activeModules.length === 0) && (
                    <p className="text-gray-500">No hay módulos configurados</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}