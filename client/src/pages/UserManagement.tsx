import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  UserPlus, 
  Settings, 
  Shield, 
  Users,
  Edit,
  Trash2,
  Search,
  Eye,
  UserCog,
  Clock,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const createUserSchema = z.object({
  email: z.string().email("Email válido requerido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  password: z.string().min(8, "Contraseña debe tener al menos 8 caracteres"),
  role: z.string().min(1, "Rol requerido"),
  permissions: z.array(z.string()).default([])
});

const createUserRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "At least one permission is required")
});

const updateUserPermissionsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  permissions: z.array(z.string())
});

type CreateUserForm = z.infer<typeof createUserSchema>;

type CreateUserRoleForm = z.infer<typeof createUserRoleSchema>;
type UpdateUserPermissionsForm = z.infer<typeof updateUserPermissionsSchema>;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  createdAt: string;
  role?: string;
  permissions?: string[];
  lastActivity?: string;
}

interface UserRole {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
}

interface ActivityLog {
  id: number;
  action: string;
  module: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const availablePermissions = [
  { id: "sales.create", name: "Create Sales", module: "Sales" },
  { id: "sales.read", name: "View Sales", module: "Sales" },
  { id: "sales.update", name: "Edit Sales", module: "Sales" },
  { id: "sales.delete", name: "Delete Sales", module: "Sales" },
  { id: "inventory.create", name: "Create Products", module: "Inventory" },
  { id: "inventory.read", name: "View Inventory", module: "Inventory" },
  { id: "inventory.update", name: "Edit Inventory", module: "Inventory" },
  { id: "inventory.delete", name: "Delete Products", module: "Inventory" },
  { id: "customers.create", name: "Create Customers", module: "Customers" },
  { id: "customers.read", name: "View Customers", module: "Customers" },
  { id: "customers.update", name: "Edit Customers", module: "Customers" },
  { id: "customers.delete", name: "Delete Customers", module: "Customers" },
  { id: "reports.read", name: "View Reports", module: "Reports" },
  { id: "reports.export", name: "Export Reports", module: "Reports" },
  { id: "admin.users", name: "Manage Users", module: "Administration" },
  { id: "admin.company", name: "Company Settings", module: "Administration" },
  { id: "chat.create", name: "Create Channels", module: "Chat" },
  { id: "chat.moderate", name: "Moderate Chat", module: "Chat" },
];

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"users" | "roles" | "activity">("users");
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const createUserForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      role: "",
      permissions: []
    }
  });

  const createRoleForm = useForm<CreateUserRoleForm>({
    resolver: zodResolver(createUserRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: []
    }
  });

  const updatePermissionsForm = useForm<UpdateUserPermissionsForm>({
    resolver: zodResolver(updateUserPermissionsSchema),
    defaultValues: {
      userId: "",
      permissions: []
    }
  });

  // Fetch company users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users/company"],
    retry: false
  });

  // Fetch user roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/user-roles"],
    retry: false
  });

  // Fetch activity logs
  const { data: activityLogs = [], isLoading: activityLoading } = useQuery({
    queryKey: ["/api/activity-logs"],
    retry: false
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      return await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/company"] });
      setIsCreateUserOpen(false);
      createUserForm.reset();
      toast({
        title: "Usuario creado",
        description: "El nuevo usuario ha sido creado exitosamente."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive"
      });
    }
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateUserRoleForm) => {
      return await apiRequest("/api/user-roles", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-roles"] });
      setIsCreateRoleOpen(false);
      createRoleForm.reset();
      toast({
        title: "Role created",
        description: "New user role has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive"
      });
    }
  });

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: UpdateUserPermissionsForm) => {
      return await apiRequest(`/api/users/${data.userId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions: data.permissions })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/company"] });
      setIsEditPermissionsOpen(false);
      setSelectedUser(null);
      updatePermissionsForm.reset();
      toast({
        title: "Permissions updated",
        description: "User permissions have been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive"
      });
    }
  });

  const handleCreateUser = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const handleCreateRole = (data: CreateUserRoleForm) => {
    createRoleMutation.mutate(data);
  };

  const handleUpdatePermissions = (data: UpdateUserPermissionsForm) => {
    updatePermissionsMutation.mutate(data);
  };

  const openEditPermissions = (user: User) => {
    setSelectedUser(user);
    updatePermissionsForm.setValue("userId", user.id);
    updatePermissionsForm.setValue("permissions", user.permissions || []);
    setIsEditPermissionsOpen(true);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getPermissionsByModule = () => {
    const modules: { [key: string]: typeof availablePermissions } = {};
    availablePermissions.forEach(permission => {
      if (!modules[permission.module]) {
        modules[permission.module] = [];
      }
      modules[permission.module].push(permission);
    });
    return modules;
  };

  if (usersLoading && selectedTab === "users") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          {selectedTab === "users" && (
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Añadir Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <Form {...createUserForm}>
                  <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <FormField
                      control={createUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="usuario@empresa.com" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <Input placeholder="Apellido" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="manager">Gerente</SelectItem>
                                <SelectItem value="employee">Empleado</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
          {selectedTab === "roles" && (
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0 pb-4">
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                  <Form {...createRoleForm}>
                    <form onSubmit={createRoleForm.handleSubmit(handleCreateRole)} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={createRoleForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter role name" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createRoleForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Role description (optional)" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={createRoleForm.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Permissions</FormLabel>
                            <div className="max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50 dark:bg-gray-900 space-y-3">
                              {Object.entries(getPermissionsByModule()).map(([module, perms]) => (
                                <div key={module} className="space-y-2">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 sticky top-0 bg-gray-50 dark:bg-gray-900 py-1 border-b">
                                    {module}
                                  </h4>
                                  <div className="grid grid-cols-1 gap-1.5 pl-2">
                                    {perms.map((permission) => (
                                      <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={permission.id}
                                          checked={field.value.includes(permission.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              field.onChange([...field.value, permission.id]);
                                            } else {
                                              field.onChange(field.value.filter(p => p !== permission.id));
                                            }
                                          }}
                                        />
                                        <label htmlFor={permission.id} className="text-xs cursor-pointer flex-1">
                                          {permission.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateRoleOpen(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRoleMutation.isPending}
                    size="sm"
                    onClick={createRoleForm.handleSubmit(handleCreateRole)}
                  >
                    {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={selectedTab === "users" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedTab("users")}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
        <Button
          variant={selectedTab === "roles" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedTab("roles")}
        >
          <Shield className="h-4 w-4 mr-2" />
          Roles
        </Button>
        <Button
          variant={selectedTab === "activity" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedTab("activity")}
        >
          <Activity className="h-4 w-4 mr-2" />
          Activity
        </Button>
      </div>

      {/* Users Tab */}
      {selectedTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(users) && users.map((user: User) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  {user.role && (
                    <Badge variant="secondary" className="mb-2">
                      {user.role}
                    </Badge>
                  )}
                  
                  <div className="text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </div>
                    {user.lastActivity && (
                      <div className="flex items-center gap-1 mt-1">
                        <Activity className="h-3 w-3" />
                        Last active {format(new Date(user.lastActivity), "MMM d, h:mm a")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditPermissions(user)}
                    >
                      <UserCog className="h-3 w-3 mr-1" />
                      Permissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {Array.isArray(users) && users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {selectedTab === "roles" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(roles) && roles.map((role: UserRole) => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {role.name}
                  </CardTitle>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permissions ({role.permissions.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {availablePermissions.find(p => p.id === permission)?.name || permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {Array.isArray(roles) && roles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No roles created yet</p>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {selectedTab === "activity" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(activityLogs) && activityLogs.map((log: ActivityLog) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                        {" "}{log.action} in {log.module}
                        {log.resourceType && (
                          <span className="text-muted-foreground">
                            {" "}({log.resourceType})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {Array.isArray(activityLogs) && activityLogs.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No activity logs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermissionsOpen} onOpenChange={setIsEditPermissionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions - {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          <Form {...updatePermissionsForm}>
            <form onSubmit={updatePermissionsForm.handleSubmit(handleUpdatePermissions)} className="space-y-4">
              <FormField
                control={updatePermissionsForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <div className="space-y-4">
                      {Object.entries(getPermissionsByModule()).map(([module, perms]) => (
                        <div key={module} className="space-y-2">
                          <h4 className="font-medium">{module}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {perms.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-${permission.id}`}
                                  checked={field.value.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, permission.id]);
                                    } else {
                                      field.onChange(field.value.filter(p => p !== permission.id));
                                    }
                                  }}
                                />
                                <label htmlFor={`edit-${permission.id}`} className="text-sm">
                                  {permission.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditPermissionsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePermissionsMutation.isPending}
                >
                  {updatePermissionsMutation.isPending ? "Updating..." : "Update Permissions"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}