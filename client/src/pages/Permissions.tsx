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
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  UserPlus,
  Shield,
  Edit,
  Trash2,
  Settings,
  Users,
  Key,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  permissions: string[];
  lastLoginAt: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  userCount: number;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'pos.view', name: 'Ver POS', category: 'Punto de Venta' },
  { id: 'pos.create', name: 'Crear Ventas', category: 'Punto de Venta' },
  { id: 'pos.edit', name: 'Editar Ventas', category: 'Punto de Venta' },
  { id: 'pos.delete', name: 'Eliminar Ventas', category: 'Punto de Venta' },
  
  { id: 'inventory.view', name: 'Ver Inventario', category: 'Inventario' },
  { id: 'inventory.create', name: 'Crear Productos', category: 'Inventario' },
  { id: 'inventory.edit', name: 'Editar Productos', category: 'Inventario' },
  { id: 'inventory.delete', name: 'Eliminar Productos', category: 'Inventario' },
  
  { id: 'customers.view', name: 'Ver Clientes', category: 'Clientes' },
  { id: 'customers.create', name: 'Crear Clientes', category: 'Clientes' },
  { id: 'customers.edit', name: 'Editar Clientes', category: 'Clientes' },
  { id: 'customers.delete', name: 'Eliminar Clientes', category: 'Clientes' },
  
  { id: 'suppliers.view', name: 'Ver Proveedores', category: 'Proveedores' },
  { id: 'suppliers.create', name: 'Crear Proveedores', category: 'Proveedores' },
  { id: 'suppliers.edit', name: 'Editar Proveedores', category: 'Proveedores' },
  { id: 'suppliers.delete', name: 'Eliminar Proveedores', category: 'Proveedores' },
  
  { id: 'billing.view', name: 'Ver Facturación', category: 'Facturación' },
  { id: 'billing.create', name: 'Crear Facturas', category: 'Facturación' },
  { id: 'billing.edit', name: 'Editar Facturas', category: 'Facturación' },
  { id: 'billing.delete', name: 'Eliminar Facturas', category: 'Facturación' },
  
  { id: 'accounting.view', name: 'Ver Contabilidad', category: 'Contabilidad' },
  { id: 'accounting.create', name: 'Crear Asientos', category: 'Contabilidad' },
  { id: 'accounting.edit', name: 'Editar Asientos', category: 'Contabilidad' },
  { id: 'accounting.delete', name: 'Eliminar Asientos', category: 'Contabilidad' },
  
  { id: 'reports.view', name: 'Ver Reportes', category: 'Reportes' },
  { id: 'reports.export', name: 'Exportar Reportes', category: 'Reportes' },
  { id: 'reports.advanced', name: 'Reportes Avanzados', category: 'Reportes' },
  
  { id: 'warehouse.view', name: 'Ver Almacenes', category: 'Almacenes' },
  { id: 'warehouse.create', name: 'Crear Almacenes', category: 'Almacenes' },
  { id: 'warehouse.edit', name: 'Editar Almacenes', category: 'Almacenes' },
  { id: 'warehouse.delete', name: 'Eliminar Almacenes', category: 'Almacenes' },
  
  { id: 'hr.view', name: 'Ver RRHH', category: 'Recursos Humanos' },
  { id: 'hr.create', name: 'Crear Empleados', category: 'Recursos Humanos' },
  { id: 'hr.edit', name: 'Editar Empleados', category: 'Recursos Humanos' },
  { id: 'hr.payroll', name: 'Gestionar Nómina', category: 'Recursos Humanos' },
  
  { id: 'system.view', name: 'Ver Sistema', category: 'Sistema' },
  { id: 'system.edit', name: 'Configurar Sistema', category: 'Sistema' },
  { id: 'system.admin', name: 'Administración Total', category: 'Sistema' },
  
  { id: 'ai.view', name: 'Ver IA', category: 'Inteligencia Artificial' },
  { id: 'ai.use', name: 'Usar Asistente IA', category: 'Inteligencia Artificial' },
  
  { id: 'audit.view', name: 'Ver Auditoría', category: 'Auditoría' },
  { id: 'audit.export', name: 'Exportar Auditoría', category: 'Auditoría' },
];

const PERMISSION_CATEGORIES = Array.from(new Set(AVAILABLE_PERMISSIONS.map(p => p.category)));

export default function Permissions() {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [userFormData, setUserFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "user",
    permissions: [] as string[],
  });

  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const { toast } = useToast();

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest("/api/users", {
        method: "POST",
        body: userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente",
      });
      setUserDialogOpen(false);
      resetUserForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el usuario",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<User> }) => {
      return apiRequest(`/api/users/${data.id}`, {
        method: "PATCH",
        body: data.updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      setUserDialogOpen(false);
      setPermissionsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return apiRequest("/api/roles", {
        method: "POST",
        body: JSON.stringify(roleData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Rol creado",
        description: "El rol ha sido creado correctamente",
      });
      setRoleDialogOpen(false);
      resetRoleForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el rol",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Role> }) => {
      return apiRequest(`/api/roles/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Rol actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      setRoleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive",
      });
    },
  });

  const resetUserForm = () => {
    setUserFormData({
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      role: "user",
      permissions: [],
    });
    setSelectedUser(null);
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: "",
      description: "",
      permissions: [],
    });
    setSelectedRole(null);
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(userFormData);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      updates: userFormData,
    });
  };

  const handleCreateRole = () => {
    createRoleMutation.mutate(roleFormData);
  };

  const handleUpdateRole = () => {
    if (!selectedRole) return;
    updateRoleMutation.mutate({
      id: selectedRole.id,
      updates: roleFormData,
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "",
      role: user.role,
      permissions: user.permissions || [],
    });
    setUserDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
    });
    setRoleDialogOpen(true);
  };

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      ...userFormData,
      permissions: user.permissions || [],
    });
    setPermissionsDialogOpen(true);
  };

  const toggleUserPermission = (permissionId: string) => {
    const newPermissions = userFormData.permissions.includes(permissionId)
      ? userFormData.permissions.filter(p => p !== permissionId)
      : [...userFormData.permissions, permissionId];
    
    setUserFormData({ ...userFormData, permissions: newPermissions });
  };

  const toggleRolePermission = (permissionId: string) => {
    const newPermissions = roleFormData.permissions.includes(permissionId)
      ? roleFormData.permissions.filter(p => p !== permissionId)
      : [...roleFormData.permissions, permissionId];
    
    setRoleFormData({ ...roleFormData, permissions: newPermissions });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      super_admin: { label: "Super Admin", variant: "destructive" as const },
      company_admin: { label: "Administrador", variant: "default" as const },
      manager: { label: "Gerente", variant: "secondary" as const },
      user: { label: "Usuario", variant: "outline" as const },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (usersLoading || rolesLoading) {
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
            <Shield className="h-5 w-5" />
            Gestión de Permisos y Usuarios
          </CardTitle>
          <CardDescription>
            Administra usuarios, roles y permisos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Usuarios del Sistema</h3>
                <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetUserForm}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedUser ? "Modifica los datos del usuario" : "Crea un nuevo usuario en el sistema"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Nombre</Label>
                          <Input
                            id="firstName"
                            value={userFormData.firstName}
                            onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Apellido</Label>
                          <Input
                            id="lastName"
                            value={userFormData.lastName}
                            onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          {selectedUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={userFormData.password}
                            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select
                          value={userFormData.role}
                          onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="company_admin">Administrador de Empresa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={selectedUser ? handleUpdateUser : handleCreateUser}
                        disabled={createUserMutation.isPending || updateUserMutation.isPending}
                      >
                        {selectedUser ? "Actualizar" : "Crear Usuario"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Nunca"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManagePermissions(user)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Roles del Sistema</h3>
                <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetRoleForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Rol
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedRole ? "Editar Rol" : "Nuevo Rol"}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedRole ? "Modifica el rol y sus permisos" : "Crea un nuevo rol y asigna permisos"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="roleName">Nombre del Rol</Label>
                          <Input
                            id="roleName"
                            value={roleFormData.name}
                            onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roleDescription">Descripción</Label>
                          <Textarea
                            id="roleDescription"
                            value={roleFormData.description}
                            onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label>Permisos del Rol</Label>
                        <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto">
                          {PERMISSION_CATEGORIES.map((category) => (
                            <div key={category} className="space-y-2">
                              <h4 className="font-medium text-sm">{category}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_PERMISSIONS
                                  .filter(p => p.category === category)
                                  .map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                      <Switch
                                        id={permission.id}
                                        checked={roleFormData.permissions.includes(permission.id)}
                                        onCheckedChange={() => toggleRolePermission(permission.id)}
                                      />
                                      <Label htmlFor={permission.id} className="text-sm">
                                        {permission.name}
                                      </Label>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={selectedRole ? handleUpdateRole : handleCreateRole}
                        disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                      >
                        {selectedRole ? "Actualizar" : "Crear Rol"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rol</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Usuarios</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles?.map((role: Role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="font-medium">{role.name}</div>
                        </TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions?.slice(0, 3).map((permissionId) => {
                              const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId);
                              return permission ? (
                                <Badge key={permissionId} variant="outline" className="text-xs">
                                  {permission.name}
                                </Badge>
                              ) : null;
                            })}
                            {role.permissions?.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{role.permissions.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{role.userCount || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestionar Permisos de Usuario</DialogTitle>
            <DialogDescription>
              Configura los permisos específicos para {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {PERMISSION_CATEGORIES.map((category) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS
                      .filter(p => p.category === category)
                      .map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Switch
                            id={`user-${permission.id}`}
                            checked={userFormData.permissions.includes(permission.id)}
                            onCheckedChange={() => toggleUserPermission(permission.id)}
                          />
                          <Label htmlFor={`user-${permission.id}`} className="text-sm">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => handleUpdateUser()}
              disabled={updateUserMutation.isPending}
            >
              Guardar Permisos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}