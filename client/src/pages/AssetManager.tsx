import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  Image, 
  Smartphone, 
  Monitor, 
  Settings, 
  Trash2, 
  Eye, 
  RefreshCw,
  FileImage,
  Palette,
  Zap,
  Globe
} from "lucide-react";

interface Asset {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: string;
}

interface AssetManifest {
  generated: string;
  assets: {
    [filename: string]: {
      hash: string;
      size: number;
      mtime: string;
      type: string;
    };
  };
}

export default function AssetManager() {
  console.log("AssetManager component rendered");
  
  // Add visual debugging to ensure component is rendering
  const debugStyle = {
    border: '3px solid red',
    backgroundColor: '#ffebee',
    padding: '20px',
    margin: '10px'
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states for different generation types
  const [iconConfig, setIconConfig] = useState({
    name: 'icon',
    sizes: '16,32,48,64,96,128,192,256,512',
    formats: 'png,webp',
    baseColor: '#0072FF',
    variants: ''
  });

  const [responsiveConfig, setResponsiveConfig] = useState({
    breakpoints: '320,480,768,1024,1200,1920',
    quality: '80',
    progressive: 'true',
    stripMetadata: 'true',
    formats: 'webp,png'
  });

  const [optimizeConfig, setOptimizeConfig] = useState({
    quality: '80',
    progressive: 'true',
    stripMetadata: 'true',
    formats: 'webp'
  });

  // Fetch available assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery<{ assets: Asset[] }>({
    queryKey: ['/api/assets/list'],
    retry: false
  });

  // Fetch asset manifest
  const { data: manifest } = useQuery<AssetManifest>({
    queryKey: ['/api/assets/manifest'],
    retry: false
  });

  // Generate icon set mutation
  const generateIconsMutation = useMutation({
    mutationFn: (formData: FormData) => 
      apiRequest('/api/assets/generate-icons', { method: 'POST', body: formData }),
    onSuccess: (data: any) => {
      toast({
        title: "Íconos generados exitosamente",
        description: `Se generaron ${data?.count || 'varios'} archivos de íconos`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron generar los íconos",
        variant: "destructive"
      });
    }
  });

  // Generate responsive images mutation
  const generateResponsiveMutation = useMutation({
    mutationFn: (formData: FormData) => 
      apiRequest('/api/assets/generate-responsive', { method: 'POST', body: formData }),
    onSuccess: (data: any) => {
      toast({
        title: "Imágenes responsivas generadas",
        description: `Se generaron variantes para ${data?.breakpoints?.length || 'varios'} breakpoints`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron generar las imágenes responsivas",
        variant: "destructive"
      });
    }
  });

  // Generate favicons mutation
  const generateFaviconsMutation = useMutation({
    mutationFn: (formData: FormData) => 
      apiRequest('/api/assets/generate-favicons', { method: 'POST', body: formData }),
    onSuccess: (data: any) => {
      toast({
        title: "Favicons generados exitosamente",
        description: `Se generaron ${data?.count || 'varios'} archivos favicon`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron generar los favicons",
        variant: "destructive"
      });
    }
  });

  // Optimize image mutation
  const optimizeImageMutation = useMutation({
    mutationFn: (formData: FormData) => 
      apiRequest('/api/assets/optimize', { method: 'POST', body: formData }),
    onSuccess: (data: any) => {
      toast({
        title: "Imagen optimizada",
        description: `Imagen optimizada en formatos: ${data?.formats?.join(', ') || 'varios formatos'}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo optimizar la imagen",
        variant: "destructive"
      });
    }
  });

  // Cleanup assets mutation
  const cleanupAssetsMutation = useMutation({
    mutationFn: (maxAge: number) => 
      apiRequest(`/api/assets/cleanup?maxAge=${maxAge}`, { method: 'DELETE' }),
    onSuccess: (data: any) => {
      toast({
        title: "Limpieza completada",
        description: `Se eliminaron ${data?.count || 'varios'} archivos antiguos`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar la limpieza",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-set icon name based on filename
      const baseName = file.name.split('.')[0];
      setIconConfig(prev => ({ ...prev, name: baseName }));
    }
  };

  const createFormData = (config: any, endpoint: string) => {
    if (!selectedFile) return null;
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    Object.entries(config).forEach(([key, value]) => {
      if (value) formData.append(key, value as string);
    });

    return formData;
  };

  const handleGenerateIcons = () => {
    const formData = createFormData(iconConfig, 'icons');
    if (formData) {
      generateIconsMutation.mutate(formData);
    }
  };

  const handleGenerateResponsive = () => {
    const formData = createFormData(responsiveConfig, 'responsive');
    if (formData) {
      generateResponsiveMutation.mutate(formData);
    }
  };

  const handleGenerateFavicons = () => {
    const formData = createFormData({}, 'favicons');
    if (formData) {
      generateFaviconsMutation.mutate(formData);
    }
  };

  const handleOptimizeImage = () => {
    const formData = createFormData(optimizeConfig, 'optimize');
    if (formData) {
      optimizeImageMutation.mutate(formData);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestor de Assets e Íconos</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Herramientas avanzadas para generar íconos, optimizar imágenes y crear assets responsivos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cleanupAssetsMutation.mutate(7 * 24 * 60 * 60 * 1000)}
              disabled={cleanupAssetsMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Assets
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Subir Imagen
            </TabsTrigger>
            <TabsTrigger value="icons">
              <Palette className="h-4 w-4 mr-2" />
              Generar Íconos
            </TabsTrigger>
            <TabsTrigger value="responsive">
              <Monitor className="h-4 w-4 mr-2" />
              Imágenes Responsivas
            </TabsTrigger>
            <TabsTrigger value="optimize">
              <Settings className="h-4 w-4 mr-2" />
              Optimizar
            </TabsTrigger>
            <TabsTrigger value="assets">
              <FileImage className="h-4 w-4 mr-2" />
              Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Subir Imagen Base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium">
                      Selecciona una imagen para procesar
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Formatos soportados: PNG, JPG, JPEG, SVG, WEBP
                    </p>
                  </label>
                </div>

                {selectedFile && previewUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Image className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="max-w-md mx-auto">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto rounded-lg border shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subiendo imagen...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="icons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Generar Set de Íconos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon-name">Nombre del Ícono</Label>
                    <Input
                      id="icon-name"
                      value={iconConfig.name}
                      onChange={(e) => setIconConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="favicon"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon-color">Color Base</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="icon-color"
                        type="color"
                        value={iconConfig.baseColor}
                        onChange={(e) => setIconConfig(prev => ({ ...prev, baseColor: e.target.value }))}
                        className="w-16"
                      />
                      <Input
                        value={iconConfig.baseColor}
                        onChange={(e) => setIconConfig(prev => ({ ...prev, baseColor: e.target.value }))}
                        placeholder="#0072FF"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon-sizes">Tamaños (separados por comas)</Label>
                  <Input
                    id="icon-sizes"
                    value={iconConfig.sizes}
                    onChange={(e) => setIconConfig(prev => ({ ...prev, sizes: e.target.value }))}
                    placeholder="16,32,48,64,96,128,192,256,512"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon-formats">Formatos</Label>
                  <Select
                    value={iconConfig.formats}
                    onValueChange={(value) => setIconConfig(prev => ({ ...prev, formats: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG únicamente</SelectItem>
                      <SelectItem value="webp">WEBP únicamente</SelectItem>
                      <SelectItem value="png,webp">PNG + WEBP</SelectItem>
                      <SelectItem value="png,webp,svg">PNG + WEBP + SVG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateIcons}
                  disabled={!selectedFile || generateIconsMutation.isPending}
                  className="w-full"
                >
                  {generateIconsMutation.isPending && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generar Set de Íconos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responsive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Generar Imágenes Responsivas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breakpoints">Breakpoints (px)</Label>
                    <Input
                      id="breakpoints"
                      value={responsiveConfig.breakpoints}
                      onChange={(e) => setResponsiveConfig(prev => ({ ...prev, breakpoints: e.target.value }))}
                      placeholder="320,480,768,1024,1200,1920"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quality">Calidad (%)</Label>
                    <Input
                      id="quality"
                      type="number"
                      min="1"
                      max="100"
                      value={responsiveConfig.quality}
                      onChange={(e) => setResponsiveConfig(prev => ({ ...prev, quality: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsive-formats">Formatos de Salida</Label>
                  <Select
                    value={responsiveConfig.formats}
                    onValueChange={(value) => setResponsiveConfig(prev => ({ ...prev, formats: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WEBP únicamente</SelectItem>
                      <SelectItem value="png">PNG únicamente</SelectItem>
                      <SelectItem value="jpg">JPG únicamente</SelectItem>
                      <SelectItem value="webp,png">WEBP + PNG</SelectItem>
                      <SelectItem value="webp,jpg">WEBP + JPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={responsiveConfig.progressive === 'true'}
                      onChange={(e) => setResponsiveConfig(prev => ({ 
                        ...prev, 
                        progressive: e.target.checked ? 'true' : 'false' 
                      }))}
                    />
                    <span className="text-sm">JPEG Progresivo</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={responsiveConfig.stripMetadata === 'true'}
                      onChange={(e) => setResponsiveConfig(prev => ({ 
                        ...prev, 
                        stripMetadata: e.target.checked ? 'true' : 'false' 
                      }))}
                    />
                    <span className="text-sm">Eliminar Metadatos</span>
                  </label>
                </div>

                <Button 
                  onClick={handleGenerateResponsive}
                  disabled={!selectedFile || generateResponsiveMutation.isPending}
                  className="w-full"
                >
                  {generateResponsiveMutation.isPending && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generar Imágenes Responsivas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Generar Favicons PWA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Genera automáticamente todos los favicons necesarios para PWA incluyendo apple-touch-icon, 
                  favicon.ico y todos los tamaños requeridos para diferentes dispositivos.
                </p>
                
                <Button 
                  onClick={handleGenerateFavicons}
                  disabled={!selectedFile || generateFaviconsMutation.isPending}
                  className="w-full"
                >
                  {generateFaviconsMutation.isPending && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generar Favicons PWA
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Optimizar Imagen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="optimize-quality">Calidad (%)</Label>
                    <Input
                      id="optimize-quality"
                      type="number"
                      min="1"
                      max="100"
                      value={optimizeConfig.quality}
                      onChange={(e) => setOptimizeConfig(prev => ({ ...prev, quality: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="optimize-formats">Formatos de Salida</Label>
                    <Select
                      value={optimizeConfig.formats}
                      onValueChange={(value) => setOptimizeConfig(prev => ({ ...prev, formats: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webp">WEBP únicamente</SelectItem>
                        <SelectItem value="png">PNG únicamente</SelectItem>
                        <SelectItem value="jpg">JPG únicamente</SelectItem>
                        <SelectItem value="webp,png">WEBP + PNG</SelectItem>
                        <SelectItem value="webp,jpg">WEBP + JPG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={optimizeConfig.progressive === 'true'}
                      onChange={(e) => setOptimizeConfig(prev => ({ 
                        ...prev, 
                        progressive: e.target.checked ? 'true' : 'false' 
                      }))}
                    />
                    <span className="text-sm">JPEG Progresivo</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={optimizeConfig.stripMetadata === 'true'}
                      onChange={(e) => setOptimizeConfig(prev => ({ 
                        ...prev, 
                        stripMetadata: e.target.checked ? 'true' : 'false' 
                      }))}
                    />
                    <span className="text-sm">Eliminar Metadatos</span>
                  </label>
                </div>

                <Button 
                  onClick={handleOptimizeImage}
                  disabled={!selectedFile || optimizeImageMutation.isPending}
                  className="w-full"
                >
                  {optimizeImageMutation.isPending && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Optimizar Imagen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <FileImage className="h-5 w-5 mr-2" />
                        Assets Disponibles
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/assets'] })}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assetsLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : (assetsData as any)?.assets?.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {(assetsData as any).assets.map((asset: Asset) => (
                          <div
                            key={asset.name}
                            className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="flex items-center space-x-3">
                              <FileImage className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-sm">{asset.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(asset.size)} • {asset.type.toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(asset.path, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = asset.path;
                                  link.download = asset.name;
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay assets disponibles</p>
                        <p className="text-sm">Comienza subiendo y procesando imágenes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Estadísticas de Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {manifest && (
                      <>
                        <div>
                          <p className="text-sm font-medium">Total de Assets</p>
                          <p className="text-2xl font-bold">
                            {Object.keys(manifest.assets).length}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Tamaño Total</p>
                          <p className="text-lg font-semibold">
                            {formatFileSize(
                              Object.values(manifest.assets).reduce(
                                (sum, asset) => sum + asset.size, 
                                0
                              )
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Última Actualización</p>
                          <p className="text-sm text-gray-500">
                            {new Date(manifest.generated).toLocaleString()}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Tipos de Archivo</p>
                          {Object.values(manifest.assets)
                            .reduce((acc, asset) => {
                              acc[asset.type] = (acc[asset.type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                            && Object.entries(
                              Object.values(manifest.assets).reduce((acc, asset) => {
                                acc[asset.type] = (acc[asset.type] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([type, count]) => (
                              <div key={type} className="flex justify-between text-sm">
                                <span className="capitalize">{type}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {count}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Add a simple test component to verify routing
export function AssetManagerTest() {
  return (
    <div style={{
      border: '3px solid red',
      backgroundColor: '#ffebee',
      padding: '20px',
      margin: '10px',
      textAlign: 'center'
    }}>
      <h1>Asset Manager Test - Component is Working!</h1>
      <p>If you can see this, the routing is working correctly.</p>
    </div>
  );
}