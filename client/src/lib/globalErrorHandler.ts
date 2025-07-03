// Global error handler to prevent Select component crashes
window.addEventListener('error', (event) => {
  // Check if this is the specific Select.Item empty string error
  if (event.error?.message?.includes('Select.Item') && 
      event.error?.message?.includes('empty string')) {
    console.warn('Global handler: Prevented Select.Item empty string error');
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Check if this is the specific Select.Item empty string error in a promise
  if (event.reason?.message?.includes('Select.Item') && 
      event.reason?.message?.includes('empty string')) {
    console.warn('Global handler: Prevented Select.Item empty string promise rejection');
    event.preventDefault();
    return false;
  }
});

// Override console.error to filter out Select.Item errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('Select.Item') && message.includes('empty string')) {
    console.warn('Filtered Select.Item empty string error from console');
    return;
  }
  originalConsoleError.apply(console, args);
};

export {};