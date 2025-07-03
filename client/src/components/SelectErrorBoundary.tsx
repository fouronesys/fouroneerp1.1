import React from 'react';

interface SelectErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

interface SelectErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class SelectErrorBoundary extends React.Component<SelectErrorBoundaryProps, SelectErrorBoundaryState> {
  constructor(props: SelectErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): SelectErrorBoundaryState {
    // Check if this is the specific Select.Item empty string error
    if (error.message.includes('Select.Item') && error.message.includes('empty string')) {
      return {
        hasError: true,
        errorInfo: 'Select component empty string error caught and handled'
      };
    }
    // For other errors, let them bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only handle Select.Item empty string errors
    if (error.message.includes('Select.Item') && error.message.includes('empty string')) {
      console.warn('SelectErrorBoundary: Caught Select.Item empty string error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    } else {
      // Re-throw other errors
      throw error;
    }
  }

  render() {
    if (this.state.hasError) {
      // Return the fallback UI or an empty fragment
      return this.props.fallback || <></>;
    }

    return this.props.children;
  }
}

export default SelectErrorBoundary;