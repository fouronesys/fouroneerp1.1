import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Building2, DollarSign, Calendar,
  BarChart3, PieChart as PieChartIcon, Activity, AlertTriangle
} from 'lucide-react';

interface CompanyAnalytics {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  paidCompanies: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  growthRate: number;
  churnRate: number;
  avgCompanyAge: number;
  topIndustries: Array<{ name: string; count: number; percentage: number }>;
  subscriptionTrends: Array<{ month: string; trial: number; paid: number; churned: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; companies: number }>;
  companySizeDistribution: Array<{ size: string; count: number }>;
  geographicDistribution: Array<{ region: string; companies: number }>;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeUsers: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function CompanyAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: analytics, isLoading } = useQuery<CompanyAnalytics>({
    queryKey: ["/api/admin/analytics", timeRange],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const MetricCard = ({ title, value, change, icon: Icon, trend }: {
    title: string;
    value: string | number;
    change: number;
    icon: any;
    trend: 'up' | 'down';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs">
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-muted-foreground ml-1">vs mes anterior</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Empresariales</h1>
          <p className="text-gray-600 dark:text-gray-300">Análisis detallado del rendimiento del sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Empresas"
          value={analytics?.totalCompanies || 0}
          change={12}
          icon={Building2}
          trend="up"
        />
        <MetricCard
          title="Ingresos Mensuales"
          value={`RD$ ${analytics?.monthlyRevenue?.toLocaleString() || 0}`}
          change={8.2}
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Empresas Activas"
          value={analytics?.activeCompanies || 0}
          change={5.1}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Tasa de Crecimiento"
          value={`${analytics?.growthRate || 0}%`}
          change={-2.1}
          icon={TrendingUp}
          trend="down"
        />
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="industry">Industrias</TabsTrigger>
          <TabsTrigger value="health">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Suscripción</CardTitle>
                <CardDescription>Evolución de suscripciones en el tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.subscriptionTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="paid" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                    <Area type="monotone" dataKey="trial" stackId="1" stroke="#10B981" fill="#10B981" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Company Size Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tamaño</CardTitle>
                <CardDescription>Empresas clasificadas por número de empleados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.companySizeDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analytics?.companySizeDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Ingresos</CardTitle>
              <CardDescription>Análisis detallado de ingresos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ARR (Ingresos Anuales Recurrentes)</span>
                <span className="text-lg font-bold">RD$ {((analytics?.monthlyRevenue || 0) * 12).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">MRR (Ingresos Mensuales Recurrentes)</span>
                <span className="text-lg font-bold">RD$ {(analytics?.monthlyRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ARPU (Ingreso Promedio por Usuario)</span>
                <span className="text-lg font-bold">
                  RD$ {analytics?.activeCompanies ? Math.round((analytics.monthlyRevenue || 0) / analytics.activeCompanies).toLocaleString() : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tasa de Abandono</span>
                <span className="text-lg font-bold text-red-600">{analytics?.churnRate || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Industrias</CardTitle>
              <CardDescription>Distribución de empresas por sector industrial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analytics?.topIndustries || []).map((industry, index) => (
                  <div key={industry.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-medium">{industry.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{industry.count} empresas</span>
                      <Badge variant="secondary">{industry.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo de Actividad</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.systemHealth.uptime || 99.9}%
                </div>
                <p className="text-xs text-muted-foreground">últimos 30 días</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.systemHealth.responseTime || 150}ms
                </div>
                <p className="text-xs text-muted-foreground">promedio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Error</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.systemHealth.errorRate || 0.1}%
                </div>
                <p className="text-xs text-muted-foreground">últimas 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.systemHealth.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">en este momento</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}