import { useToast } from '@/hooks/use-toast';

const variantStyles: Record<string, string> = {
   success: 'bg-green-600 text-white',
   error: 'bg-red-600 text-white',
   info: 'bg-blue-600 text-white',
};

const variantIcons: Record<string, string> = {
   success: '✓',
   error: '✕',
   info: 'ℹ',
};

export default function Toaster() {
   const { toasts, dismiss } = useToast();

   if (toasts.length === 0) return null;

   return (
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
         {toasts.map((t) => (
            <div
               key={t.id}
               className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right ${variantStyles[t.variant] || variantStyles.info}`}
               style={{
                  animation: 'slideIn 0.3s ease-out',
               }}
            >
               <span className="text-lg font-bold shrink-0">
                  {variantIcons[t.variant] || variantIcons.info}
               </span>
               <p className="text-sm flex-1">{t.message}</p>
               <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 opacity-70 hover:opacity-100 text-lg leading-none"
               >
                  ✕
               </button>
            </div>
         ))}

         <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      </div>
   );
}
