import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({
   allowedRoles,
}: {
   allowedRoles?: Array<'ADMIN' | 'ORGANIZER'>;
}) {
   const { isAuthenticated, isLoading, user } = useAuth();

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

   if (
      allowedRoles &&
      allowedRoles.length > 0 &&
      user &&
      !allowedRoles.includes(user.role)
   ) {
      return <Navigate to="/" replace />;
   }

   return <Outlet />;
}
