import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/theme/ThemeContext';
import { ToastProvider } from './hooks/use-toast';
import Toaster from './components/ui/Toaster';
import NavLayout from './components/layout/NavLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MenuOrderingPage from './pages/MenuOrderingPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentUploadPage from './pages/PaymentUploadPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLayout from './pages/admin/AdminLayout';
import InvitationsPage from './pages/admin/InvitationsPage';
import UsersPage from './pages/admin/UsersPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import DashboardEventsPage from './pages/dashboard/EventsPage';
import DashboardOrdersPage from './pages/dashboard/OrdersPage';
import DashboardMenuPage from './pages/dashboard/MenuPage';
import DashboardAnalyticsPage from './pages/dashboard/AnalyticsPage';
import DashboardExportPage from './pages/dashboard/ExportPage';

export default function App() {
   return (
      <ThemeProvider>
         <ToastProvider>
            <BrowserRouter>
               <AuthProvider>
                  <Routes>
                     {/* Public routes with navigation */}
                     <Route element={<NavLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route
                           path="/events/:eventId"
                           element={<EventDetailPage />}
                        />
                        <Route
                           path="/events/:eventId/order"
                           element={<MenuOrderingPage />}
                        />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route
                           path="/payment-upload"
                           element={<PaymentUploadPage />}
                        />
                        <Route
                           path="/order-confirmation"
                           element={<OrderConfirmationPage />}
                        />
                        <Route
                           path="/order-tracking"
                           element={<OrderTrackingPage />}
                        />
                        <Route
                           path="/order-tracking/:orderNumber"
                           element={<OrderTrackingPage />}
                        />
                        <Route path="/contact" element={<ContactPage />} />
                     </Route>

                     {/* Auth pages (no layout shell) */}
                     <Route path="/login" element={<LoginPage />} />
                     <Route path="/register" element={<RegisterPage />} />

                     {/* Protected admin routes */}
                     <Route
                        element={<ProtectedRoute allowedRoles={['ADMIN']} />}
                     >
                        <Route path="/admin" element={<AdminLayout />}>
                           <Route
                              path="invitations"
                              element={<InvitationsPage />}
                           />
                           <Route path="users" element={<UsersPage />} />
                        </Route>
                     </Route>

                     {/* Protected dashboard routes */}
                     <Route
                        element={
                           <ProtectedRoute
                              allowedRoles={['ADMIN', 'ORGANIZER']}
                           />
                        }
                     >
                        <Route path="/dashboard" element={<DashboardLayout />}>
                           <Route index element={<DashboardPage />} />
                           <Route
                              path="events"
                              element={<DashboardEventsPage />}
                           />
                           <Route
                              path="orders"
                              element={<DashboardOrdersPage />}
                           />
                           <Route path="menu" element={<DashboardMenuPage />} />
                           <Route
                              path="analytics"
                              element={<DashboardAnalyticsPage />}
                           />
                           <Route
                              path="export"
                              element={<DashboardExportPage />}
                           />
                        </Route>
                     </Route>
                  </Routes>
               </AuthProvider>
            </BrowserRouter>
            <Toaster />
         </ToastProvider>
      </ThemeProvider>
   );
}
