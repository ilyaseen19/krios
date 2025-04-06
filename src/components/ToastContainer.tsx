import React, { useState, useCallback } from 'react';
import Toast, { ToastType } from './Toast';
import './Toast.css';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Expose methods to window for global access
  React.useEffect(() => {
    // Always create a new toast object to ensure methods are available
    window.toast = {
      success: (message: string, duration?: number) => addToast(message, 'success', duration),
      error: (message: string, duration?: number) => addToast(message, 'error', duration),
      warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
      info: (message: string, duration?: number) => addToast(message, 'info', duration),
    };

    return () => {
      // Clean up global object when component unmounts
      window.toast = undefined;
    };
  }, [addToast]);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Add type definition for window object
declare global {
  interface Window {
    toast?: {
      success: (message: string, duration?: number) => string;
      error: (message: string, duration?: number) => string;
      warning: (message: string, duration?: number) => string;
      info: (message: string, duration?: number) => string;
    };
  }
}

export default ToastContainer;