import { Link } from 'react-router-dom';
import {
   Calendar,
   MapPin,
   Clock,
   Info,
   User,
   ArrowRight,
   Utensils,
} from 'lucide-react';

export type EventCardData = {
   id: number;
   name: string;
   eventType: string;
   eventInfo: string | null;
   iconUrl: string | null;
   hostedBy: string | null;
   pickupLocations: string | null;
   eventDate: string;
   location: string;
   preOrderClose: string | null;
};

function getStatus(preOrderClose: string | null): {
   label: string;
   dot: string;
   text: string;
   border: string;
} {
   if (!preOrderClose)
      return {
         label: 'Open',
         dot: 'bg-emerald-400',
         text: 'text-emerald-700 dark:text-emerald-300',
         border: 'border-emerald-400/30',
      };
   const now = new Date();
   const closeDate = new Date(preOrderClose);
   const diffMs = closeDate.getTime() - now.getTime();
   const diffHours = diffMs / (1000 * 60 * 60);

   if (diffHours < 0) {
      return {
         label: 'Closed',
         dot: 'bg-red-400',
         text: 'text-red-700 dark:text-red-300',
         border: 'border-red-400/30',
      };
   } else if (diffHours <= 24) {
      return {
         label: 'Closing Soon',
         dot: 'bg-amber-400',
         text: 'text-amber-700 dark:text-amber-300',
         border: 'border-amber-400/30',
      };
   }
   return {
      label: 'Open',
      dot: 'bg-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-400/30',
   };
}

export default function EventCard({ event }: { event: EventCardData }) {
   const date = new Date(event.eventDate);
   const isPast = date < new Date();
   const dayNum = date.getDate();
   const month = date
      .toLocaleDateString('en-NZ', { month: 'short' })
      .toUpperCase();
   const fullDate = date.toLocaleDateString('en-NZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
   });
   const status = getStatus(event.preOrderClose);

   const preOrderCloseFormatted = event.preOrderClose
      ? new Date(event.preOrderClose).toLocaleDateString('en-NZ', {
           weekday: 'long',
           day: 'numeric',
           month: 'long',
           year: 'numeric',
        })
      : null;

   return (
      <div className="group rounded-2xl overflow-hidden bg-card border border-border/40 hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 hover:scale-[1.015] flex flex-col">
         {/* ── Banner ── */}
         <div className="relative h-56 overflow-hidden">
            {event.iconUrl ? (
               /* ── With image ── */
               <>
                  <img
                     src={event.iconUrl}
                     alt={event.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[800ms] ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
               </>
            ) : (
               /* ── No image — decorative gradient banner ── */
               <>
                  {/* Base gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-amber-500 to-orange-400 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460]" />

                  {/* Decorative circles — light mode only */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/15 dark:bg-white/5" />
                  <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10 dark:bg-white/5" />
                  <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white/10 dark:bg-white/5 -translate-y-1/2" />
                  <div className="absolute top-8 right-1/3 w-16 h-16 rounded-full bg-white/10 dark:bg-white/5" />

                  {/* Subtle dot texture */}
                  <div
                     className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
                     style={{
                        backgroundImage:
                           'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '20px 20px',
                     }}
                  />
               </>
            )}

            {/* ── Date badge ── */}
            <div className="absolute top-4 left-4 backdrop-blur-xl bg-white/95 dark:bg-white/10 rounded-2xl shadow-xl border border-black/5 dark:border-white/20 px-3.5 py-3 text-center min-w-[60px]">
               <div className="text-[28px] font-black text-gray-900 dark:text-white leading-none tracking-tight">
                  {dayNum}
               </div>
               <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1.5">
                  {month}
               </div>
            </div>

            {/* ── Status badge ── */}
            <div className="absolute top-4 right-4">
               <span
                  className={`inline-flex items-center gap-1.5 backdrop-blur-md bg-white/95 dark:bg-black/50 ${status.text} ${status.border} border text-[11px] font-semibold px-3 py-1.5 rounded-full tracking-wide`}
               >
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
               </span>
            </div>

            {/* ── Title area at bottom ── */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
               <div className="mx-5 mb-3 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
               <div className="px-5 pb-5">
                  <h3 className="text-[22px] font-bold text-white leading-tight tracking-tight line-clamp-2 drop-shadow-lg">
                     {event.name}
                  </h3>
               </div>
            </div>
         </div>

         {/* ── Card body ── */}
         <div className="p-5 pt-4 flex flex-col flex-1">
            {/* Event date */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
               <Calendar className="w-4 h-4 shrink-0 text-primary" />
               <span className="font-medium">{fullDate}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 mt-2.5 text-sm text-muted-foreground">
               <MapPin className="w-4 h-4 shrink-0 text-primary" />
               <span>{event.location}</span>
            </div>

            {/* Pre-order closing date */}
            {preOrderCloseFormatted && (
               <div className="flex items-center gap-3 mt-2.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0 text-primary" />
                  <span>Pre-order closes: {preOrderCloseFormatted}</span>
               </div>
            )}

            {/* Info */}
            {event.eventInfo && (
               <div className="flex items-start gap-3 mt-3 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <p className="line-clamp-2 leading-relaxed">
                     {event.eventInfo}
                  </p>
               </div>
            )}

            {/* Hosted by */}
            {event.hostedBy && (
               <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                  <User className="w-4 h-4 shrink-0 text-primary" />
                  <span>
                     Hosted by{' '}
                     <span className="font-semibold text-foreground">
                        {event.hostedBy}
                     </span>
                  </span>
               </div>
            )}

            {event.eventType === 'FOOD_FAIR' && event.pickupLocations && (
               <div className="flex items-start gap-3 mt-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <span>
                     Pickup locations:{' '}
                     <span className="font-semibold text-foreground">
                        {event.pickupLocations
                           .split(',')
                           .map((loc) => loc.trim())
                           .join(', ')}
                     </span>
                  </span>
               </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* ── Buttons ── */}
            {!isPast && (
               <div className="flex gap-3 mt-5">
                  {event.eventType === 'FOOD_FAIR' ? (
                     <>
                        <Link
                           to={`/events/${event.id}/order`}
                           className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300"
                        >
                           <Utensils className="w-4 h-4" />
                           View Menu
                        </Link>
                        <Link
                           to={`/events/${event.id}`}
                           className="flex-1 flex items-center justify-center gap-2 border border-primary/30 text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                        >
                           Learn More
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                     </>
                  ) : (
                     <>
                        <Link
                           to={`/events/${event.id}/order`}
                           className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300"
                        >
                           View Item
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                           to={`/events/${event.id}`}
                           className="flex-1 flex items-center justify-center gap-2 border border-primary/30 text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                        >
                           Learn More
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                     </>
                  )}
               </div>
            )}
         </div>
      </div>
   );
}
