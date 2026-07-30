import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute() {
   const { isAuthenticated, isLoading } = useAuth();

   if (isLoading) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
         </div>
      );
   }

   if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
   }

   return <Outlet />;
}
