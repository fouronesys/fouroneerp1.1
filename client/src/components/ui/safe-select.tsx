import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface SafeSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface SafeSelectItemProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SafeSelect({ 
  value, 
  onValueChange, 
  placeholder, 
  disabled, 
  children, 
  className 
}: SafeSelectProps) {
  // Ensure value is never an empty string
  const safeValue = value && value.trim() !== "" ? value : undefined;
  
  return (
    <Select 
      value={safeValue} 
      onValueChange={onValueChange} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}

export function SafeSelectItem({ value, disabled, children, className }: SafeSelectItemProps) {
  // Prevent empty string values
  if (!value || value.trim() === "") {
    console.warn("SafeSelectItem: Empty or invalid value provided, skipping render");
    return null;
  }
  
  return (
    <SelectItem value={value} disabled={disabled} className={className}>
      {children}
    </SelectItem>
  );
}