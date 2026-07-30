import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
   Menu,
   X,
   LayoutDashboard,
   Calendar,
   ShoppingCart,
   Utensils,
   BarChart3,
   Download,
   ArrowLeft,
} from 'lucide-react';

const navItems = [
   { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
   { to: '/dashboard/events', label: 'Events', icon: Calendar },
   { to: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
   { to: '/dashboard/menu', label: 'Menu', icon: Utensils },
   { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
   { to: '/dashboard/export', label: 'Export', icon: Download },
];

export default function DashboardLayout() {
   const { user, logout } = useAuth();
   const [sidebarOpen, setSidebarOpen] = useState(false);

   return (
      <div className="min-h-screen bg-background">
         {/* Mobile header */}
         <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            <button
               onClick={() => setSidebarOpen(true)}
               className="p-2 hover:bg-muted rounded-md"
            >
               <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <div className="w-9" /> {/* Spacer for centering */}
         </header>

         {/* Mobile sidebar overlay */}
         {sidebarOpen && (
            <div
               className="lg:hidden fixed inset-0 z-50 bg-black/50"
               onClick={() => setSidebarOpen(false)}
            >
               <aside
                  className="w-64 h-full bg-card border-r border-border"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                     <h2 className="text-lg font-bold text-foreground">Menu</h2>
                     <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 hover:bg-muted rounded-md"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  <nav className="p-4">
                     <SidebarContent user={user} logout={logout} />
                  </nav>
               </aside>
            </div>
         )}

         {/* Desktop layout */}
         <div className="lg:flex lg:min-h-screen">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r border-border">
               <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">
                     Organizer Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     {user?.name}
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                     {user?.role}
                  </span>
               </div>

               <nav className="flex-1 p-4">
                  <SidebarContent user={user} logout={logout} />
               </nav>

               <div className="p-4 border-t border-border">
                  <NavLink
                     to="/"
                     className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
                  >
                     <ArrowLeft className="w-4 h-4" />
                     Back to Site
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
            <main className="flex-1 lg:ml-64 p-4 lg:p-8">
               <Outlet />
            </main>
         </div>
      </div>
   );
}

function SidebarContent({
   user: _user,
   logout: _logout,
}: {
   user: any;
   logout: () => void;
}) {
   return (
      <ul className="space-y-1">
         {navItems.map((item) => (
            <li key={item.to}>
               <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                     `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                           ? 'bg-primary/10 text-primary'
                           : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                     }`
                  }
               >
                  <item.icon className="w-5 h-5" />
                  {item.label}
               </NavLink>
            </li>
         ))}
      </ul>
   );
}
