import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react';
import EventSelector from '@/components/dashboard/EventSelector';

interface Analytics {
   revenueByDate: Record<string, number>;
   itemsSold: Record<string, number>;
   statusDistribution: Record<string, number>;
   topSellingItems: { name: string; qty: number }[];
}

export default function AnalyticsPage() {
   const [searchParams] = useSearchParams();
   const [analytics, setAnalytics] = useState<Analytics | null>(null);
   const [loading, setLoading] = useState(true);

   const eventId = searchParams.get('eventId');

   useEffect(() => {
      if (eventId) {
         fetchAnalytics();
      }
   }, [eventId]);

   const fetchAnalytics = async () => {
      if (!eventId) return;

      setLoading(true);
      try {
         const response = await api.get(`/dashboard/${eventId}/analytics`);
         setAnalytics(response.data);
      } catch (error) {
         console.error('Failed to fetch analytics:', error);
      } finally {
         setLoading(false);
      }
   };

   const totalRevenue = analytics
      ? Object.values(analytics.revenueByDate).reduce((a, b) => a + b, 0)
      : 0;
   const totalItemsSold = analytics
      ? Object.values(analytics.itemsSold).reduce((a, b) => a + b, 0)
      : 0;
   const totalOrders = analytics
      ? Object.values(analytics.statusDistribution).reduce((a, b) => a + b, 0)
      : 0;

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <EventSelector />
         </div>

         {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {[...Array(4)].map((_, i) => (
                  <div
                     key={i}
                     className="h-64 bg-muted rounded-lg animate-pulse"
                  />
               ))}
            </div>
         )}

         {!loading && !analytics && (
            <div className="text-center py-12">
               <p className="text-muted-foreground">
                  {eventId
                     ? 'No data available for this event'
                     : 'Select an event above'}
               </p>
            </div>
         )}

         {!loading && analytics && (
            <>
               {/* Summary Stats */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                     title="Total Revenue"
                     value={`$${totalRevenue.toFixed(2)}`}
                     icon={<DollarSign className="w-6 h-6" />}
                     color="text-green-600"
                     bgColor="bg-green-50"
                  />
                  <StatCard
                     title="Total Orders"
                     value={totalOrders}
                     icon={<ShoppingCart className="w-6 h-6" />}
                     color="text-blue-600"
                     bgColor="bg-blue-50"
                  />
                  <StatCard
                     title="Items Sold"
                     value={totalItemsSold}
                     icon={<Package className="w-6 h-6" />}
                     color="text-purple-600"
                     bgColor="bg-purple-50"
                  />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue by Date */}
                  <div className="p-6 bg-card border border-border rounded-lg">
                     <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Revenue by Date
                     </h2>
                     {Object.keys(analytics.revenueByDate).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                           No revenue data
                        </p>
                     ) : (
                        <div className="space-y-2">
                           {Object.entries(analytics.revenueByDate)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .slice(-10)
                              .map(([date, revenue]) => (
                                 <div
                                    key={date}
                                    className="flex items-center justify-between"
                                 >
                                    <span className="text-sm text-muted-foreground">
                                       {new Date(date).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                       <div className="w-32 bg-muted rounded-full h-2">
                                          <div
                                             className="bg-green-500 h-2 rounded-full"
                                             style={{
                                                width: `${Math.min(
                                                   100,
                                                   (revenue / totalRevenue) *
                                                      100
                                                )}%`,
                                             }}
                                          />
                                       </div>
                                       <span className="text-sm font-medium text-foreground w-20 text-right">
                                          ${revenue.toFixed(2)}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                        </div>
                     )}
                  </div>

                  {/* Order Status Distribution */}
                  <div className="p-6 bg-card border border-border rounded-lg">
                     <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Order Status
                     </h2>
                     {Object.keys(analytics.statusDistribution).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                           No order data
                        </p>
                     ) : (
                        <div className="space-y-3">
                           {Object.entries(analytics.statusDistribution).map(
                              ([status, count]) => {
                                 const colors = {
                                    PENDING: 'bg-yellow-500',
                                    CONFIRMED: 'bg-blue-500',
                                    COMPLETED: 'bg-green-500',
                                    CANCELLED: 'bg-red-500',
                                 };
                                 return (
                                    <div
                                       key={status}
                                       className="flex items-center justify-between"
                                    >
                                       <div className="flex items-center gap-2">
                                          <div
                                             className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-500'}`}
                                          />
                                          <span className="text-sm text-foreground">
                                             {status}
                                          </span>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <div className="w-32 bg-muted rounded-full h-2">
                                             <div
                                                className={`h-2 rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-500'}`}
                                                style={{
                                                   width: `${(count / totalOrders) * 100}%`,
                                                }}
                                             />
                                          </div>
                                          <span className="text-sm font-medium text-foreground w-12 text-right">
                                             {count}
                                          </span>
                                       </div>
                                    </div>
                                 );
                              }
                           )}
                        </div>
                     )}
                  </div>

                  {/* Top Selling Items */}
                  <div className="p-6 bg-card border border-border rounded-lg">
                     <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Top Selling Items
                     </h2>
                     {analytics.topSellingItems.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                           No items sold
                        </p>
                     ) : (
                        <div className="space-y-2">
                           {analytics.topSellingItems.map((item, index) => (
                              <div
                                 key={item.name}
                                 className="flex items-center justify-between"
                              >
                                 <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground w-6">
                                       #{index + 1}
                                    </span>
                                    <span className="text-sm text-foreground">
                                       {item.name}
                                    </span>
                                 </div>
                                 <span className="text-sm font-medium text-foreground">
                                    {item.qty} sold
                                 </span>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  {/* Items Sold Breakdown */}
                  <div className="p-6 bg-card border border-border rounded-lg">
                     <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Items Sold
                     </h2>
                     {Object.keys(analytics.itemsSold).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                           No items sold
                        </p>
                     ) : (
                        <div className="space-y-2">
                           {Object.entries(analytics.itemsSold)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 10)
                              .map(([name, qty]) => (
                                 <div
                                    key={name}
                                    className="flex items-center justify-between"
                                 >
                                    <span className="text-sm text-foreground">
                                       {name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                       <div className="w-24 bg-muted rounded-full h-2">
                                          <div
                                             className="bg-primary h-2 rounded-full"
                                             style={{
                                                width: `${Math.min(
                                                   100,
                                                   (qty / totalItemsSold) * 100
                                                )}%`,
                                             }}
                                          />
                                       </div>
                                       <span className="text-sm font-medium text-foreground w-12 text-right">
                                          {qty}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                        </div>
                     )}
                  </div>
               </div>
            </>
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
