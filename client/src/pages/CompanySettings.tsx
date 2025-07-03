import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Image, Upload, Phone, AlertCircle, CheckCircle, Save } from "lucide-react";
import { Header } from "@/components/Header";
import { RNCCompanySuggestions } from "@/components/RNCCompanySuggestions";
import { apiRequest } from "@/lib/queryClient";
import { useResponsiveLayout, getResponsiveClass, getFormLayoutClass } from "@/hooks/useResponsiveLayout";

const companySettingsSchema = z.object({
  name: z.string().min(1, "Nombre comercial es requerido"),
  businessName: z.string().optional(),
  rnc: z.string().optional(),
  industry: z.string().optional(),
  businessType: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  logo: z.string().optional(),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

interface RNCValidationResult {
  valid: boolean;
  message: string;
  data?: {
    rnc: string;
    name?: string;
    razonSocial?: string;
    categoria?: string;
    estado?: string;
  };
}

export default function CompanySettings() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [rncValidationResult, setRncValidationResult] = useState<RNCValidationResult | null>(null);
  const [isVerifyingRNC, setIsVerifyingRNC] = useState(false);
  const [rncSuggestions, setRncSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const queryClient = useQueryClient();
  const layout = useResponsiveLayout();

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: "",
      businessName: "",
      rnc: "",
      industry: "",
      businessType: "general",
      address: "",
      phone: "",
      email: "",
      website: "",
      logo: "",
    },
  });

  const { data: company } = useQuery({
    queryKey: ["/api/companies/current"],
  });

  useEffect(() => {
    if (company) {
      const companyData = company as any;
      form.reset({
        name: companyData.name || "",
        businessName: companyData.business_name || "",
        rnc: companyData.rnc || "",
        industry: companyData.industry || "",
        businessType: companyData.business_type || "general",
        address: companyData.address || "",
        phone: companyData.phone || "",
        email: companyData.email || "",
        website: companyData.website || "",
        logo: companyData.logo || "",
      });

      if (companyData.logo) {
        setLogoPreview(companyData.logo);
      }
    }
  }, [company, form]);

  const mutation = useMutation({
    mutationFn: async (data: CompanySettingsFormData) => {
      // Include logo in the request since we need to update it
      return await apiRequest("/api/companies/current", { 
        method: "PUT",
        body: data 
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La configuración de la empresa se ha actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/current"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error("Error saving company settings:", error);
    },
  });

  const optimizeLogoForMultipleUses = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      img.onload = () => {
        // Dynamic sizing based on original resolution:
        // - Small logos (<=300px): keep original size
        // - Medium logos (301-800px): optimize to 512px max
        // - Large logos (>800px): optimize to 800px max for highest quality
        const originalSize = Math.max(img.width, img.height);
        let maxSize: number;
        
        if (originalSize <= 300) {
          maxSize = originalSize; // Keep small logos at original size
        } else if (originalSize <= 800) {
          maxSize = 512; // Medium optimization
        } else {
          maxSize = 800; // High quality for large logos
        }
        
        let { width, height } = img;
        
        // Maintain aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // For PNG logos, preserve transparency; for others, use white background
        const isPNG = file.type === 'image/png';
        if (!isPNG) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
        }
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output format based on input and use case
        let outputDataUrl: string;
        if (isPNG || file.type === 'image/gif') {
          // Keep PNG for logos with transparency
          outputDataUrl = canvas.toDataURL('image/png');
        } else {
          // High quality JPEG for photos
          outputDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        }
        
        resolve(outputDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 25MB.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Create image to check dimensions with proper error handling
        const img = document.createElement('img');
        const url = URL.createObjectURL(file);
        
        // Set CORS for image loading
        img.crossOrigin = 'anonymous';
        
        img.onload = async () => {
          URL.revokeObjectURL(url);

          try {
            const optimizedImage = await optimizeLogoForMultipleUses(file);
            setLogoPreview(optimizedImage);
            form.setValue("logo", optimizedImage);
            
            const formatName = file.type === 'image/png' ? 'PNG' : 'JPEG';
            const originalSize = Math.max(img.width, img.height);
            let adaptationMsg = "";
            
            if (originalSize <= 300) {
              adaptationMsg = "mantenido en tamaño original";
            } else if (originalSize <= 800) {
              adaptationMsg = "optimizado para calidad media";
            } else {
              adaptationMsg = "optimizado para alta calidad";
            }
            
            toast({
              title: "Logo procesado",
              description: `Logo ${img.width}x${img.height} ${adaptationMsg} (${formatName}).`,
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo procesar la imagen. Inténtalo con otra imagen.",
              variant: "destructive",
            });
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          toast({
            title: "Error",
            description: "No se pudo cargar la imagen. Formato no válido.",
            variant: "destructive",
          });
        };
        
        img.src = url;
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo procesar el archivo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRNCVerification = async (rnc: string) => {
    if (!rnc || rnc.length < 9) return;
    
    setIsVerifyingRNC(true);
    setRncValidationResult(null);
    
    try {
      const response = await apiRequest(`/api/dgii/rnc-lookup?rnc=${encodeURIComponent(rnc)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setRncValidationResult({
          valid: true,
          message: "RNC válido y encontrado en DGII",
          data: result.data
        });
        
        // Auto-llenar campos si están vacíos
        if (result.data.razonSocial && !form.getValues("name")) {
          form.setValue("name", result.data.razonSocial);
        }
        if (result.data.nombreComercial && !form.getValues("businessName")) {
          form.setValue("businessName", result.data.nombreComercial);
        }
        
        toast({
          title: "RNC Verificado",
          description: `Empresa: ${result.data.razonSocial}`,
        });
      } else {
        setRncValidationResult({
          valid: false,
          message: result.message || "RNC no encontrado en DGII"
        });
      }
    } catch (error) {
      console.error("RNC validation error:", error);
      setRncValidationResult({
        valid: false,
        message: "Error al verificar el RNC. Inténtalo de nuevo.",
      });
    } finally {
      setIsVerifyingRNC(false);
    }
  }

  const searchRNCCompanies = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setRncSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await apiRequest(`/api/dgii/search-companies?query=${encodeURIComponent(searchTerm)}`);
      const result = await response.json();
      
      if (result.success && result.data && Array.isArray(result.data)) {
        const suggestions = result.data.slice(0, 5).map((company: any) => ({
          rnc: company.rnc,
          name: company.razonSocial || company.name || 'Empresa sin nombre',
          razonSocial: company.razonSocial,
          nombreComercial: company.nombreComercial,
          categoria: company.categoria || company.category,
          estado: company.estado || company.status
        }));
        
        setRncSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setRncSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
      setRncSuggestions([]);
      setShowSuggestions(false);
    }
  }

  const selectRNCFromSuggestion = (suggestion: any) => {
    form.setValue("name", suggestion.razonSocial);
    form.setValue("businessName", suggestion.nombreComercial || suggestion.razonSocial);
    form.setValue("rnc", suggestion.rnc);
    
    setRncValidationResult({
      valid: true,
      message: "RNC válido seleccionado desde DGII",
      data: suggestion
    });
    
    setShowSuggestions(false);
    setRncSuggestions([]);
    
    toast({
      title: "Empresa seleccionada",
      description: `${suggestion.razonSocial} - RNC: ${suggestion.rnc}`,
    });
  };

  const handleReset = () => {
    form.reset();
    setLogoPreview(null);
    setRncValidationResult(null);
  };

  const onSubmit = async (data: CompanySettingsFormData) => {
    console.log("Form submitted with data:", data);
    mutation.mutate(data);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header title="Configuración de Empresa" subtitle="Personaliza la información fiscal y visual de tu empresa" />
      
      <div className="flex-1 overflow-y-auto">
        <div className={`max-w-4xl mx-auto ${layout.containerPadding} pb-32 ${layout.spacing.lg}`}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={`${layout.spacing.lg} pb-16`}>
            {/* Logo de la Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Image className="mr-2 h-5 w-5" />
                  Logo de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-contain border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white p-2"
                      />
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <Label htmlFor="logo" className="cursor-pointer">
                      <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-blue-600 hover:text-blue-500">
                        <Upload className="h-4 w-4" />
                        <span>Subir nuevo logo</span>
                      </div>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG (recomendado), JPG, GIF hasta 25MB. Cualquier resolución. Adaptación automática para cada uso.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="mr-2 h-5 w-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`grid ${layout.spacing.md} ${
                  getResponsiveClass(layout, {
                    mobile: 'grid-cols-1',
                    tablet: 'grid-cols-2',
                    desktop: 'grid-cols-2'
                  })
                }`}>
                  <div className={`${layout.spacing.xs} relative`}>
                    <Label htmlFor="name">Nombre Comercial*</Label>
                    <Input
                      id="name"
                      placeholder="Buscar empresa por nombre..."
                      value={form.watch("name") || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setValue("name", value);
                        searchRNCCompanies(value);
                      }}
                      onFocus={() => {
                        const currentValue = form.watch("name");
                        if (currentValue && currentValue.length >= 3) {
                          searchRNCCompanies(currentValue);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      className="text-sm"
                    />
                    
                    {/* Sugerencias de empresas */}
                    {showSuggestions && rncSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {rncSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            onClick={() => selectRNCFromSuggestion(suggestion)}
                          >
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {suggestion.razonSocial}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              RNC: {suggestion.rnc}
                            </div>
                            {suggestion.nombreComercial && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                {suggestion.nombreComercial}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className={layout.spacing.xs}>
                    <Label htmlFor="businessName">Razón Social</Label>
                    <Input
                      id="businessName"
                      placeholder="Ej: Mi Empresa SRL"
                      {...form.register("businessName")}
                    />
                  </div>
                </div>

                <div className={`grid ${layout.spacing.md} ${
                  getResponsiveClass(layout, {
                    mobile: 'grid-cols-1',
                    tablet: 'grid-cols-1',
                    desktop: 'grid-cols-2'
                  })
                }`}>
                  <div className={layout.spacing.xs}>
                    <Label htmlFor="rnc">RNC (Registro Nacional del Contribuyente)</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="rnc"
                        placeholder="Ej: 131-12345-6"
                        {...form.register("rnc")}
                        onBlur={(e) => {
                          const rncValue = e.target.value;
                          if (rncValue && rncValue.length >= 9) {
                            handleRNCVerification(rncValue);
                          }
                        }}
                        className={`${rncValidationResult?.valid === true ? "border-green-500" : 
                                  rncValidationResult?.valid === false ? "border-red-500" : ""} flex-1`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isVerifyingRNC || !form.watch("rnc")}
                        onClick={() => handleRNCVerification(form.watch("rnc") || "")}
                        className="w-full sm:w-auto"
                      >
                        {isVerifyingRNC ? "Verificando..." : "Verificar"}
                      </Button>
                    </div>
                    {rncValidationResult && (
                      <div className={`text-sm p-3 rounded-lg ${
                        rncValidationResult.valid 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {rncValidationResult.valid ? (
                          <div className="space-y-1">
                            <p className="font-medium flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              RNC Verificado en DGII
                            </p>
                            <p>Empresa: {rncValidationResult.data?.razonSocial}</p>
                            {rncValidationResult.data?.categoria && (
                              <p>Categoría: {rncValidationResult.data.categoria}</p>
                            )}
                            {rncValidationResult.data?.estado && (
                              <p>Estado: {rncValidationResult.data.estado}</p>
                            )}
                          </div>
                        ) : (
                          <p className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {rncValidationResult.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industria/Sector</Label>
                    <Input
                      id="industry"
                      placeholder="Ej: Retail, Manufactura, Servicios"
                      {...form.register("industry")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Phone className="mr-2 h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Tipo de Negocio</Label>
                    <Select
                      value={form.watch("businessType") ?? undefined}
                      onValueChange={(value) => form.setValue("businessType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="restaurant">Restaurante</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="services">Servicios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@empresa.com"
                      {...form.register("email")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección Fiscal</Label>
                  <Textarea
                    id="address"
                    placeholder="Dirección completa de la empresa"
                    rows={3}
                    {...form.register("address")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="(809) 123-4567"
                      {...form.register("phone")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      placeholder="https://www.empresa.com"
                      {...form.register("website")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-1 sm:flex-none sm:min-w-[200px]"
              >
                <Save className="mr-2 h-4 w-4" />
                {mutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                className="flex-1 sm:flex-none"
              >
                Restablecer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}