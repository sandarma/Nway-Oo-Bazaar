import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
   { to: '/', label: 'Home' },
   { to: '/about', label: 'About Us' },
   { to: '/events', label: 'Events' },
   { to: '/order-tracking', label: 'Track Order' },
   { to: '/contact', label: 'Contact' },
];

export default function NavLayout() {
   const [scrolled, setScrolled] = useState(false);
   const [mobileOpen, setMobileOpen] = useState(false);
   const [menuVisible, setMenuVisible] = useState(false);

   const { user, isAuthenticated, logout, hasRole } = useAuth();

   useEffect(() => {
      const onScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
   }, []);

   // Keep header opaque during menu close animation
   useEffect(() => {
      if (mobileOpen) {
         setMenuVisible(true);
      } else {
         const timer = setTimeout(() => setMenuVisible(false), 300);
         return () => clearTimeout(timer);
      }
   }, [mobileOpen]);

   // Lock body scroll when mobile menu is open
   useEffect(() => {
      document.body.style.overflow = mobileOpen ? 'hidden' : '';
      return () => {
         document.body.style.overflow = '';
      };
   }, [mobileOpen]);

   return (
      <div className="min-h-screen flex flex-col">
         <header
            className={`sticky top-0 z-50 transition-[height,box-shadow] duration-300 ${
               scrolled || menuVisible
                  ? 'glass-solid shadow-sm'
                  : 'glass-strong'
            }`}
         >
            <nav
               className={`max-w-6xl mx-auto px-4 flex items-center justify-between transition-all duration-300 ${
                  scrolled ? 'h-16' : 'h-20'
               }`}
            >
               {/* Logo */}
               <Link to="/" className="flex items-center gap-2.5 group">
                  <img
                     src="/nway_oo_bazaar_logo.jpg"
                     alt="Nway Oo Bazaar"
                     className={`rounded-full border-2 border-border transition-all duration-300 group-hover:border-primary ${
                        scrolled ? 'h-10 w-10' : 'h-14 w-14'
                     }`}
                  />
                  <div className="flex flex-col leading-tight">
                     <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                        Nway Oo Bazaar
                     </span>
                     <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        Community Fundraising
                     </span>
                  </div>
               </Link>

               {/* Desktop Nav */}
               <div className="hidden md:flex items-center gap-1">
                  {navLinks.map((link) => (
                     <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) =>
                           `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActive
                                 ? 'text-foreground glass'
                                 : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                           }`
                        }
                     >
                        {link.label}
                     </NavLink>
                  ))}
                  {isAuthenticated && hasRole('ADMIN') && (
                     <NavLink
                        to="/admin/invitations"
                        className={({ isActive }) =>
                           `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActive
                                 ? 'text-foreground glass'
                                 : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                           }`
                        }
                     >
                        Admin
                     </NavLink>
                  )}
                  {isAuthenticated &&
                     (hasRole('ADMIN') || hasRole('ORGANIZER')) && (
                        <li>
                           <NavLink
                              to="/dashboard"
                              className={({ isActive }) =>
                                 `text-sm transition-colors ${
                                    isActive
                                       ? 'text-foreground font-medium'
                                       : 'text-muted-foreground hover:text-foreground'
                                 }`
                              }
                           >
                              Dashboard
                           </NavLink>
                        </li>
                     )}
                  {isAuthenticated ? (
                     <div className="flex items-center gap-3 ml-2 pl-2 border-l border-border">
                        <span className="text-sm text-muted-foreground">
                           {user?.name}
                        </span>
                        <button
                           onClick={logout}
                           className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                           Sign out
                        </button>
                     </div>
                  ) : (
                     <NavLink
                        to="/login"
                        className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30"
                     >
                        Sign in
                     </NavLink>
                  )}
                  <div className="ml-2 pl-2 border-l border-border">
                     <ThemeToggle />
                  </div>
               </div>

               {/* Mobile: Theme Toggle + Hamburger */}
               <div className="flex md:hidden items-center gap-2">
                  <ThemeToggle />
                  <button
                     onClick={() => setMobileOpen(!mobileOpen)}
                     className="flex h-9 w-9 items-center justify-center rounded-full glass-subtle text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300"
                     aria-label="Toggle menu"
                  >
                     {mobileOpen ? (
                        <X className="h-5 w-5" />
                     ) : (
                        <Menu className="h-5 w-5" />
                     )}
                  </button>
               </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
               className={`md:hidden fixed inset-0 top-[var(--mobile-nav-top,64px)] z-40 glass-solid transition-all duration-300 ${
                  mobileOpen
                     ? 'opacity-100 pointer-events-auto'
                     : 'opacity-0 pointer-events-none'
               }`}
               style={
                  {
                     '--mobile-nav-top': scrolled ? '64px' : '80px',
                  } as React.CSSProperties
               }
            >
               <div className="flex flex-col items-center gap-2 pt-8 pb-12">
                  {navLinks.map((link, i) => (
                     <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                           `w-48 text-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 glass ${
                              mobileOpen
                                 ? 'translate-y-0 opacity-100'
                                 : '-translate-y-4 opacity-0'
                           } ${
                              isActive
                                 ? 'text-foreground shadow-sm'
                                 : 'text-muted-foreground hover:text-foreground'
                           }`
                        }
                        style={{ transitionDelay: `${i * 60}ms` }}
                     >
                        {link.label}
                     </NavLink>
                  ))}
                  {isAuthenticated && hasRole('ADMIN') && (
                     <NavLink
                        to="/admin/invitations"
                        onClick={() => setMobileOpen(false)}
                        className="w-48 text-center px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground glass"
                     >
                        Admin
                     </NavLink>
                  )}
                  {isAuthenticated ? (
                     <div className="flex items-center gap-3 mt-4">
                        <span className="text-sm text-muted-foreground">
                           {user?.name}
                        </span>
                        <button
                           onClick={() => {
                              logout();
                              setMobileOpen(false);
                           }}
                           className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                           Sign out
                        </button>
                     </div>
                  ) : (
                     <NavLink
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="w-48 text-center px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground glass"
                     >
                        Sign in
                     </NavLink>
                  )}
               </div>
            </div>
         </header>

         <main className="flex-1">
            <Outlet />
         </main>

         <footer className="glass py-6">
            <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
               &copy; {new Date().getFullYear()} Nway Oo Bazaar. All rights
               reserved.
            </div>
         </footer>
      </div>
   );
}
