import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import {
   ShoppingCart,
   DollarSign,
   CheckCircle,
   Clock,
   Utensils,
   Download,
} from 'lucide-react';

interface Event {
   id: number;
   name: string;
   eventDate: string;
   location: string;
}

interface Stats {
   totalOrders: number;
   totalRevenue: number;
   pendingOrders: number;
   confirmedOrders: number;
   completedOrders: number;
   cancelledOrders: number;
}

export default function DashboardPage() {
   const [events, setEvents] = useState<Event[]>([]);
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
   const [stats, setStats] = useState<Stats | null>(null);
   const [loading, setLoading] = useState(true);
   const [statsLoading, setStatsLoading] = useState(false);

   useEffect(() => {
      fetchEvents();
   }, []);

   useEffect(() => {
      if (selectedEvent) {
         fetchStats(selectedEvent.id);
      }
   }, [selectedEvent]);

   const fetchEvents = async () => {
      try {
         const response = await api.get('/events');
         setEvents(response.data.events);
         if (response.data.events.length > 0) {
            setSelectedEvent(response.data.events[0]);
         }
      } catch (error) {
         console.error('Failed to fetch events:', error);
      } finally {
         setLoading(false);
      }
   };

   const fetchStats = async (eventId: number) => {
      setStatsLoading(true);
      try {
         const response = await api.get(`/dashboard/${eventId}/overview`);
         setStats(response.data.stats);
      } catch (error) {
         console.error('Failed to fetch stats:', error);
      } finally {
         setStatsLoading(false);
      }
   };

   if (loading) {
      return (
         <div className="space-y-6">
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[...Array(4)].map((_, i) => (
                  <div
                     key={i}
                     className="h-32 bg-muted rounded-lg animate-pulse"
                  />
               ))}
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <h1 className="text-2xl font-bold text-foreground">
            Dashboard Overview
         </h1>

         {/* Event Selector */}
         <div className="flex flex-col sm:flex-row gap-4">
            <select
               value={selectedEvent?.id || ''}
               onChange={(e) => {
                  const event = events.find(
                     (ev) => ev.id === Number(e.target.value)
                  );
                  setSelectedEvent(event || null);
               }}
               className="flex-1 px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
               {events.map((event) => (
                  <option key={event.id} value={event.id}>
                     {event.name} -{' '}
                     {new Date(event.eventDate).toLocaleDateString()}
                  </option>
               ))}
            </select>
         </div>

         {/* Stats Grid */}
         {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[...Array(4)].map((_, i) => (
                  <div
                     key={i}
                     className="h-32 bg-muted rounded-lg animate-pulse"
                  />
               ))}
            </div>
         ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={<ShoppingCart className="w-6 h-6" />}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
               />
               <StatCard
                  title="Total Revenue"
                  value={`$${stats.totalRevenue.toFixed(2)}`}
                  icon={<DollarSign className="w-6 h-6" />}
                  color="text-green-600"
                  bgColor="bg-green-50"
               />
               <StatCard
                  title="Pending Orders"
                  value={stats.pendingOrders}
                  icon={<Clock className="w-6 h-6" />}
                  color="text-yellow-600"
                  bgColor="bg-yellow-50"
               />
               <StatCard
                  title="Completed Orders"
                  value={stats.completedOrders}
                  icon={<CheckCircle className="w-6 h-6" />}
                  color="text-emerald-600"
                  bgColor="bg-emerald-50"
               />
            </div>
         ) : null}

         {/* Quick Actions */}
         {selectedEvent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <Link
                  to={`/dashboard/orders?eventId=${selectedEvent.id}`}
                  className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
               >
                  <ShoppingCart className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground">
                     Manage Orders
                  </h3>
                  <p className="text-sm text-muted-foreground">
                     View and update order status
                  </p>
               </Link>
               <Link
                  to={`/dashboard/menu?eventId=${selectedEvent.id}`}
                  className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
               >
                  <Utensils className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground">Manage Menu</h3>
                  <p className="text-sm text-muted-foreground">
                     Add or edit menu items
                  </p>
               </Link>
               <Link
                  to={`/dashboard/analytics?eventId=${selectedEvent.id}`}
                  className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
               >
                  <BarChart3 className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground">
                     View Analytics
                  </h3>
                  <p className="text-sm text-muted-foreground">
                     Revenue and sales data
                  </p>
               </Link>
               <Link
                  to={`/dashboard/export?eventId=${selectedEvent.id}`}
                  className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
               >
                  <Download className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground">Export Data</h3>
                  <p className="text-sm text-muted-foreground">
                     Download CSV files
                  </p>
               </Link>
            </div>
         )}
      </div>
   );
}

function StatCard({
   title,
   value,
   icon,
   color,
   bgColor,
}: {
   title: string;
   value: string | number;
   icon: React.ReactNode;
   color: string;
   bgColor: string;
}) {
   return (
      <div className="p-4 bg-card border border-border rounded-lg">
         <div className="flex items-center justify-between">
            <div>
               <p className="text-sm text-muted-foreground">{title}</p>
               <p className="text-2xl font-bold text-foreground mt-1">
                  {value}
               </p>
            </div>
            <div className={`p-3 rounded-full ${bgColor} ${color}`}>{icon}</div>
         </div>
      </div>
   );
}

function BarChart3(props: any) {
   return (
      <svg
         xmlns="http://www.w3.org/2000/svg"
         width="24"
         height="24"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
         {...props}
      >
         <line x1="18" x2="18" y1="20" y2="10" />
         <line x1="12" x2="12" y1="20" y2="4" />
         <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
   );
}
