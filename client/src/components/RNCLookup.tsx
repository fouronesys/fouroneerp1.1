import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, CheckCircle, AlertTriangle, Building, Loader2, 
  ArrowRight, User, MapPin, Phone, Mail
} from "lucide-react";
import { debounce } from "lodash-es";

interface RNCLookupProps {
  value?: string;
  onRNCChange?: (rnc: string) => void;
  onCompanyDataChange?: (data: any) => void;
  placeholder?: string;
  disabled?: boolean;
  showSuggestions?: boolean;
  className?: string;
}

interface RNCData {
  rnc: string;
  razonSocial: string;
  nombreComercial?: string;
  estado: string;
  categoria: string;
  regimen: string;
}

export const RNCLookup = ({
  value = "",
  onRNCChange,
  onCompanyDataChange,
  placeholder = "Ingrese RNC...",
  disabled = false,
  showSuggestions = true,
  className = ""
}: RNCLookupProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [searchTerm, setSearchTerm] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { toast } = useToast();

  // RNC validation mutation
  const validateRNCMutation = useMutation({
    mutationFn: (rnc: string) => apiRequest('/api/dgii/validate-rnc', {
      method: 'POST',
      body: { rnc }
    }),
    onSuccess: (data: any) => {
      // Only update validation result if this is a valid result OR if we don't have a valid result yet
      const shouldUpdate = data.isValid || !validationResult?.isValid;
      
      if (shouldUpdate) {
        setValidationResult(data);
      }
      
      setIsValidating(false);
      
      if (data.isValid) {
        // Auto-populate company data
        if (onCompanyDataChange) {
          onCompanyDataChange({
            rnc: data.rnc || inputValue,
            razonSocial: data.razonSocial || data.companyName || data.businessName,
            nombreComercial: data.nombreComercial,
            estado: data.estado,
            tipo: data.tipo,
            categoria: data.categoria
          });
        }
        
        toast({
          title: "RNC Válido",
          description: `${data.razonSocial || data.companyName}`,
        });
      }
    },
    onError: (error: any) => {
      setIsValidating(false);
      setValidationResult({ isValid: false, message: "Error en la validación" });
      toast({
        title: "Error validando RNC",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Company search query for suggestions
  const { data: searchResponse, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['/api/dgii/search-companies', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 3) return { success: false, data: [] };
      const response = await apiRequest(`/api/dgii/search-companies?q=${encodeURIComponent(searchTerm)}`);
      return response;
    },
    enabled: showSuggestions && searchTerm.length >= 3,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Extract suggestions from response
  const suggestions = (searchResponse as any)?.success ? (searchResponse as any).data || [] : [];

  // Debounced RNC validation
  const debouncedValidateRNC = useCallback(
    debounce((rnc: string) => {
      const cleanRNC = rnc.replace(/\D/g, "");
      if (cleanRNC.length >= 9 && cleanRNC.length <= 11) {
        setIsValidating(true);
        validateRNCMutation.mutate(cleanRNC);
      } else {
        setValidationResult(null);
      }
    }, 800),
    [validateRNCMutation]
  );

  // Search suggestions disabled
  const debouncedSearch = useCallback(() => {
    // No-op - search suggestions disabled
  }, []);

  // Handle input change
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    if (onRNCChange) {
      onRNCChange(newValue);
    }

    // Clear previous validation
    setValidationResult(null);
    
    // Trigger validation if it looks like an RNC
    const cleanValue = newValue.replace(/\D/g, "");
    if (cleanValue.length >= 9) {
      debouncedValidateRNC(newValue);
    }

    // Search suggestions disabled - no dropdown
    setShowDropdown(false);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: RNCData) => {
    setInputValue(suggestion.rnc);
    setShowDropdown(false);
    
    if (onRNCChange) {
      onRNCChange(suggestion.rnc);
    }
    
    if (onCompanyDataChange) {
      onCompanyDataChange({
        businessName: suggestion.razonSocial,
        nombreComercial: suggestion.nombreComercial,
        estado: suggestion.estado,
        categoria: suggestion.categoria,
        regimen: suggestion.regimen
      });
    }

    // Set validation result
    setValidationResult({
      isValid: suggestion.estado === "ACTIVO",
      razonSocial: suggestion.razonSocial,
      nombreComercial: suggestion.nombreComercial,
      estado: suggestion.estado
    });
  };

  // Format RNC display
  const formatRNC = (rnc: string) => {
    const clean = rnc.replace(/\D/g, "");
    if (clean.length === 9) {
      // Format RNC as XXX-XXXXX-X (correct Dominican RNC format)
      return `${clean.slice(0, 3)}-${clean.slice(3, 8)}-${clean.slice(8)}`;
    }
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10)}`;
    }
    return clean;
  };

  // Get validation icon and color
  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (validationResult?.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (validationResult && !validationResult.isValid) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    return null;
  };

  // Update input when external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <Popover open={showDropdown && showSuggestions} onOpenChange={setShowDropdown}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon()}
            </div>
          </div>
        </PopoverTrigger>
        
        {showSuggestions && (
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar empresas..." />
              <CommandList>
                <CommandEmpty>
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Buscando...
                    </div>
                  ) : (
                    "No se encontraron empresas"
                  )}
                </CommandEmpty>
                
                <CommandGroup>
                  <ScrollArea className="max-h-64">
                    {suggestions.map((suggestion: RNCData) => (
                      <CommandItem
                        key={suggestion.rnc}
                        onSelect={() => handleSuggestionSelect(suggestion)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <Building className="h-4 w-4 mt-1 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">
                                {suggestion.razonSocial}
                              </p>
                              <Badge 
                                variant={suggestion.estado === "ACTIVO" ? "default" : "secondary"}
                                className="ml-2 text-xs"
                              >
                                {suggestion.estado}
                              </Badge>
                            </div>
                            
                            {suggestion.nombreComercial && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {suggestion.nombreComercial}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {formatRNC(suggestion.rnc)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {suggestion.categoria}
                              </span>
                            </div>
                          </div>
                          
                          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>

      {/* Validation Result Display */}
      {validationResult && (
        <div className="mt-2 p-3 rounded-lg border">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {validationResult.isValid ? (
                <>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    RNC Válido
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {validationResult.razonSocial || validationResult.companyName}
                  </p>
                  {validationResult.nombreComercial && (
                    <p className="text-xs text-gray-500 mt-1">
                      Nombre comercial: {validationResult.nombreComercial}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {validationResult.estado || "ACTIVO"}
                    </Badge>
                    {validationResult.tipo && (
                      <Badge variant="secondary" className="text-xs">
                        {validationResult.tipo}
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-red-800 dark:text-red-300">
                    RNC No Válido
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {validationResult.message || "El RNC no existe en el registro de DGII"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Intenta con RNCs válidos como: 106001201, 133320681, o 401007551
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RNCLookup;