import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Check, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RNCCompany {
  rnc: string;
  name: string;
  status: string;
  category: string;
}

interface RNCCompanySuggestionsProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onCompanySelect?: (company: RNCCompany) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function RNCCompanySuggestions({
  label,
  placeholder = "Nombre de la empresa",
  value,
  onChange,
  onCompanySelect,
  className = "",
  required = false,
  disabled = false
}: RNCCompanySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RNCCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchCompanies = async () => {
      if (value.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiRequest(`/api/rnc/search?query=${encodeURIComponent(value)}&limit=10`);
        const data = await response.json();
        
        if (data.companies && Array.isArray(data.companies)) {
          setSuggestions(data.companies);
          setShowSuggestions(data.companies.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error searching RNC companies:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (company: RNCCompany) => {
    onChange(company.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onCompanySelect?.(company);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor={`rnc-company-${label}`} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative mt-1">
        <Input
          ref={inputRef}
          id={`rnc-company-${label}`}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
              Empresas encontradas en DGII:
            </div>
            {suggestions.map((company, index) => (
              <Button
                key={`${company.rnc}-${index}`}
                variant="ghost"
                className={`w-full justify-start text-left p-3 h-auto ${
                  index === selectedIndex 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleSuggestionClick(company)}
              >
                <div className="flex items-start w-full">
                  <Building2 className="h-4 w-4 mt-0.5 mr-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {company.name}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                        RNC: {company.rnc}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          company.status === 'ACTIVO' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {company.status}
                        </span>
                        {company.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {company.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= 3 && (
        <Card className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-4 text-center">
            <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No se encontraron empresas con ese nombre
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Intenta con palabras clave diferentes
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}