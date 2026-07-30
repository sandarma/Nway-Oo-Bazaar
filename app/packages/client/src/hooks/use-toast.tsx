import {
   createContext,
   useContext,
   useState,
   useCallback,
   type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
   id: string;
   message: string;
   variant: ToastVariant;
}

interface ToastContextValue {
   toasts: Toast[];
   toast: (message: string, variant?: ToastVariant) => void;
   dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
   const [toasts, setToasts] = useState<Toast[]>([]);

   const dismiss = useCallback((id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
   }, []);

   const addToast = useCallback(
      (message: string, variant: ToastVariant = 'info') => {
         const id = `toast-${++toastCounter}-${Date.now()}`;
         setToasts((prev) => [...prev, { id, message, variant }]);

         // Auto-dismiss after 4 seconds
         setTimeout(() => dismiss(id), 4000);
      },
      [dismiss]
   );

   return (
      <ToastContext.Provider value={{ toasts, toast: addToast, dismiss }}>
         {children}
      </ToastContext.Provider>
   );
}

export function useToast() {
   const ctx = useContext(ToastContext);
   if (!ctx) {
      throw new Error('useToast must be used within a ToastProvider');
   }
   return ctx;
}
