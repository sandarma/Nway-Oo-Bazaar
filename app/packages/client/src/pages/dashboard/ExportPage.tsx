import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import EventSelector from '@/components/dashboard/EventSelector';

interface Event {
   id: number;
   name: string;
   eventDate: string;
   pickupLocations: string | null;
}

export default function ExportPage() {
   const [searchParams] = useSearchParams();
   const [event, setEvent] = useState<Event | null>(null);
   const [loading, setLoading] = useState(true);
   const [pickupLocation, setPickupLocation] = useState(
      searchParams.get('pickupLocation') || 'ALL'
   );

   const eventId = searchParams.get('eventId');

   useEffect(() => {
      if (!eventId) return;

      let isMounted = true;

      void (async () => {
         try {
            const response = await api.get(`/events/${eventId}`);
            if (isMounted) {
               setEvent(response.data.event);
            }
         } catch (error) {
            console.error('Failed to fetch event:', error);
         } finally {
            if (isMounted) {
               setLoading(false);
            }
         }
      })();

      return () => {
         isMounted = false;
      };
   }, [eventId]);

   const sanitizeFilename = (name: string) =>
      name
         .toLowerCase()
         .replace(/[^a-z0-9\s-]/g, '')
         .replace(/\s+/g, '-')
         .replace(/-+/g, '-')
         .replace(/^-|-$/g, '');

   const eventNameSlug = event
      ? sanitizeFilename(event.name)
      : `event-${eventId}`;

   const downloadCsv = async (url: string, fallbackName: string) => {
      const response = await api.get(url, {
         responseType: 'blob',
      });
      // Extract filename from Content-Disposition header
      const disposition = response.headers['content-disposition'];
      let fileName = fallbackName;
      if (disposition) {
         const match = disposition.match(/filename="?([^";\s]+)"?/);
         if (match) fileName = match[1];
      }
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
   };

   const handleExportUserList = async () => {
      if (!eventId) return;
      try {
         const query = new URLSearchParams();
         if (pickupLocation !== 'ALL') {
            query.set('pickupLocation', pickupLocation);
         }
         const queryString = query.toString();
         await downloadCsv(
            `/export/${eventId}/food-order-by-user-list${
               queryString ? `?${queryString}` : ''
            }`,
            `food-order-by-user-list-${eventNameSlug}.csv`
         );
      } catch (error) {
         console.error('Failed to export user list:', error);
      }
   };

   const handleExportPrintOut = async () => {
      if (!eventId) return;
      try {
         await downloadCsv(
            `/export/${eventId}/print-out-list`,
            `print-out-list-${eventNameSlug}.csv`
         );
      } catch (error) {
         console.error('Failed to export print out list:', error);
      }
   };

   const handleExportSellerList = async () => {
      if (!eventId) return;
      try {
         await downloadCsv(
            `/export/${eventId}/food-order-by-seller-list`,
            `food-order-by-seller-list-${eventNameSlug}.csv`
         );
      } catch (error) {
         console.error('Failed to export seller list:', error);
      }
   };

   const pickupOptions = event?.pickupLocations
      ? [
           'ALL',
           ...event.pickupLocations.split(',').map((option) => option.trim()),
        ]
      : ['ALL'];

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">
               Export Reports
            </h1>
            <EventSelector />
         </div>

         {event && (
            <div className="p-4 bg-card border border-border rounded-lg">
               <h2 className="font-semibold text-foreground">{event.name}</h2>
               <p className="text-sm text-muted-foreground">
                  {new Date(event.eventDate).toLocaleDateString()}
               </p>
            </div>
         )}

         {loading && eventId && (
            <div className="text-center py-12">
               <p className="text-muted-foreground">Loading event details...</p>
            </div>
         )}

         {!eventId && (
            <div className="text-center py-12">
               <p className="text-muted-foreground">
                  Select an event above to export data
               </p>
            </div>
         )}

         {eventId && (
            <div className="space-y-4">
               <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-sm font-medium text-foreground">
                     Pickup location filter
                  </label>
                  <select
                     value={pickupLocation}
                     onChange={(e) => setPickupLocation(e.target.value)}
                     className="px-4 py-2 border border-border rounded-md bg-background text-foreground sm:min-w-64"
                  >
                     {pickupOptions.map((option) => (
                        <option key={option} value={option}>
                           {option === 'ALL' ? 'All pickup locations' : option}
                        </option>
                     ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                     Report 1 uses this filter so you can group orders by pickup
                     location.
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <button
                     onClick={handleExportUserList}
                     className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-left"
                  >
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-full">
                           <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                           <h3 className="font-semibold text-foreground">
                              Food Order - by User List
                           </h3>
                           <p className="text-sm text-muted-foreground">
                              Download the user list report with payment and
                              pickup columns.
                           </p>
                        </div>
                        <FileDown className="w-5 h-5 text-muted-foreground" />
                     </div>
                  </button>

                  <button
                     onClick={handleExportPrintOut}
                     className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-left"
                  >
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-full">
                           <FileText className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="flex-1">
                           <h3 className="font-semibold text-foreground">
                              Print Out List
                           </h3>
                           <p className="text-sm text-muted-foreground">
                              Download the parcel attachment layout for each
                              order.
                           </p>
                        </div>
                        <FileDown className="w-5 h-5 text-muted-foreground" />
                     </div>
                  </button>

                  <button
                     onClick={handleExportSellerList}
                     className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-left"
                  >
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-full">
                           <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                           <h3 className="font-semibold text-foreground">
                              Food Order - by Seller List
                           </h3>
                           <p className="text-sm text-muted-foreground">
                              Download the seller summary grouped by chef and
                              menu.
                           </p>
                        </div>
                        <FileDown className="w-5 h-5 text-muted-foreground" />
                     </div>
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
