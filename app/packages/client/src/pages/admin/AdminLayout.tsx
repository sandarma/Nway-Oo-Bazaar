import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
   { to: '/admin/invitations', label: 'Invitations', icon: '📧' },
   { to: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout() {
   const { user, logout, hasRole } = useAuth();

   return (
      <div className="min-h-screen flex bg-background">
         {/* Sidebar */}
         <aside className="w-64 bg-card border-r border-border flex flex-col">
            <div className="p-6 border-b border-border">
               <h2 className="text-lg font-bold text-foreground">
                  Admin Dashboard
               </h2>
               <p className="text-sm text-muted-foreground mt-1">
                  {user?.name}
               </p>
               <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                  {user?.role}
               </span>
            </div>

            <nav className="flex-1 p-4">
               {hasRole('ADMIN') && (
                  <ul className="space-y-1">
                     {navItems.map((item) => (
                        <li key={item.to}>
                           <NavLink
                              to={item.to}
                              className={({ isActive }) =>
                                 `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    isActive
                                       ? 'bg-primary/10 text-primary'
                                       : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                 }`
                              }
                           >
                              <span>{item.icon}</span>
                              {item.label}
                           </NavLink>
                        </li>
                     ))}
                  </ul>
               )}
            </nav>

            <div className="p-4 border-t border-border">
               <NavLink
                  to="/"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
               >
                  ← Back to Site
               </NavLink>
               <button
                  onClick={logout}
                  className="w-full text-left text-sm text-muted-foreground hover:text-destructive px-3 py-2 rounded-md hover:bg-muted"
               >
                  Sign out
               </button>
            </div>
         </aside>

         {/* Main content */}
         <main className="flex-1 p-8 overflow-auto">
            <Outlet />
         </main>
      </div>
   );
}
