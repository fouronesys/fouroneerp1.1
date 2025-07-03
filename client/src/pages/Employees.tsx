import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Users, Calendar, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { FeatureGuard } from "@/components/FeatureGuard";
import CedulaInput from "@/components/CedulaInput";
import type { Employee } from "@shared/schema";

export default function Employees() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cedulaValue, setCedulaValue] = useState("");
  const [validatedCitizen, setValidatedCitizen] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "employee",
    sendEmail: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form state when dialog opens/closes or when editing different employee
  useEffect(() => {
    if (isDialogOpen) {
      setCedulaValue(editingEmployee?.cedula || "");
      setValidatedCitizen(null);
    } else {
      setCedulaValue("");
      setValidatedCitizen(null);
    }
  }, [isDialogOpen, editingEmployee]);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: companyUsers = [] } = useQuery({
    queryKey: ["/api/company-users"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/employees", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      toast({
        title: "Empleado creado",
        description: "El empleado ha sido creado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/employees/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      toast({
        title: "Empleado actualizado",
        description: "Los datos del empleado han sido actualizados.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/employees/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Empleado eliminado",
        description: "El empleado ha sido eliminado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/users", {
      method: "POST",
      body: data,
    }),
    onSuccess: (newUser: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-users"] });
      setIsUserDialogOpen(false);
      toast({
        title: "Usuario creado",
        description: `Usuario ${newUser.email} creado exitosamente.`,
      });
      // Reset form
      setUserFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "employee",
        sendEmail: true
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = (employees as Employee[]).filter((employee: Employee) =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hireDateValue = formData.get("hireDate") as string;
    const data = {
      employeeId: formData.get("employeeId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      position: formData.get("position"),
      department: formData.get("department"),
      hireDate: hireDateValue,
      salary: parseFloat(formData.get("salary") as string),
      salaryType: formData.get("salaryType"),
      status: formData.get("status"),
      cedula: formData.get("cedula"),
      tss: formData.get("tss"),
      bankAccount: formData.get("bankAccount"),
      bankName: formData.get("bankName"),
      userId: formData.get("userId") || null,
    };

    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar este empleado?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      terminated: "destructive",
    } as const;
    
    const labels = {
      active: "Activo",
      inactive: "Inactivo",
      terminated: "Terminado",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-4 space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Gestión de Empleados
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra la información y datos de los empleados
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80"
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEmployee(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? "Editar Empleado" : "Agregar Empleado"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">ID Empleado</Label>
                    <Input
                      id="employeeId"
                      name="employeeId"
                      defaultValue={editingEmployee?.employeeId || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select name="status" defaultValue={editingEmployee?.status || "active"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="terminated">Terminado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={editingEmployee?.firstName || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={editingEmployee?.lastName || ""}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingEmployee?.email || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={editingEmployee?.phone || ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    name="address"
                    defaultValue={editingEmployee?.address || ""}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      name="position"
                      defaultValue={editingEmployee?.position || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      name="department"
                      defaultValue={editingEmployee?.department || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Fecha de Contratación</Label>
                    <Input
                      id="hireDate"
                      name="hireDate"
                      type="date"
                      defaultValue={editingEmployee?.hireDate ? new Date(editingEmployee.hireDate).toISOString().split('T')[0] : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryType">Tipo de Salario</Label>
                    <Select name="salaryType" defaultValue={editingEmployee?.salaryType || "monthly"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="hourly">Por Hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salario</Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    step="0.01"
                    defaultValue={editingEmployee?.salary || ""}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <CedulaInput
                      value={cedulaValue}
                      onChange={setCedulaValue}
                      label="Cédula de Identidad"
                      placeholder="000-0000000-0"
                      autoValidate={true}
                      onValidationChange={(isValid, citizen) => {
                        setValidatedCitizen(citizen);
                        // Auto-completado deshabilitado hasta que la API funcione correctamente
                      }}
                    />
                    <input type="hidden" name="cedula" value={cedulaValue} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tss">TSS</Label>
                    <Input
                      id="tss"
                      name="tss"
                      defaultValue={editingEmployee?.tss || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Cuenta Bancaria</Label>
                    <Input
                      id="bankAccount"
                      name="bankAccount"
                      defaultValue={editingEmployee?.bankAccount || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Banco</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      defaultValue={editingEmployee?.bankName || ""}
                    />
                  </div>
                </div>

                {/* User Assignment Section */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-lg font-semibold">Asignación de Usuario</h3>
                  <p className="text-sm text-muted-foreground">
                    Asigna un usuario del sistema para que este empleado pueda acceder a la aplicación
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="userId">Usuario Asignado</Label>
                    <Select name="userId" defaultValue={editingEmployee?.userId || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {(companyUsers as any[]).map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email}) - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    ¿No encuentras el usuario? 
                    <Button 
                      type="button" 
                      variant="link" 
                      className="p-0 h-auto font-normal underline ml-1"
                      onClick={() => {
                        // Get current form values from the parent form
                        const emailInput = document.getElementById('email') as HTMLInputElement;
                        const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
                        const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
                        
                        setUserFormData({
                          email: emailInput?.value || "",
                          firstName: firstNameInput?.value || "",
                          lastName: lastNameInput?.value || "",
                          role: "employee",
                          sendEmail: true
                        });
                        setIsUserDialogOpen(true);
                      }}
                    >
                      Crear nuevo usuario
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                  >
                    {editingEmployee ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredEmployees.map((employee: Employee) => (
              <Card key={employee.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {employee.firstName} {employee.lastName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {employee.employeeId} • {employee.position}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(employee.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        DOP ${employee.salary?.toLocaleString()} ({employee.salaryType})
                      </span>
                    </div>
                    {employee.department && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{employee.department}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Desde {new Date(employee.hireDate).toLocaleDateString()}
                      </span>
                    </div>
                    {employee.email && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm">{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Teléfono:</span>
                        <span className="text-sm">{employee.phone}</span>
                      </div>
                    )}
                    {employee.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{employee.address}</span>
                      </div>
                    )}
                  </div>
                  {(employee.cedula || employee.tss) && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employee.cedula && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Cédula:</span>
                          <span className="text-sm">{employee.cedula}</span>
                        </div>
                      )}
                      {employee.tss && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">TSS:</span>
                          <span className="text-sm">{employee.tss}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {filteredEmployees.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay empleados</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "No se encontraron empleados que coincidan con tu búsqueda." : "Comienza agregando tu primer empleado."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Empleado
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* User Creation Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createUserMutation.mutate(userFormData);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userFirstName">Nombre</Label>
              <Input
                id="userFirstName"
                value={userFormData.firstName}
                onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userLastName">Apellido</Label>
              <Input
                id="userLastName"
                value={userFormData.lastName}
                onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userRole">Rol</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={userFormData.sendEmail}
                onChange={(e) => setUserFormData({ ...userFormData, sendEmail: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="sendEmail" className="text-sm">
                Enviar email con credenciales al usuario
              </Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}