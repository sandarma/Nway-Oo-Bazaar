import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EventCard, { type EventCardData } from '../components/events/EventCard';

/* Hero carousel slides — food images for community fundraising */
const heroSlides = [
   {
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
      title: 'Delicious Food,\nDelivered to You',
      subtitle:
         'Support community events by ordering your favourite dishes online.',
   },
   {
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80',
      title: 'Freshly Prepared,\nMade with Love',
      subtitle:
         'Browse menus from local cooks and pre-order for upcoming events.',
   },
   {
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=80',
      title: 'Order Ahead,\nSkip the Queue',
      subtitle: 'Fast, easy ordering — upload payment and confirm in minutes.',
   },
];

export default function HomePage() {
   const [events, setEvents] = useState<EventCardData[]>([]);
   const [loading, setLoading] = useState(true);

   /* Hero carousel state */
   const [currentSlide, setCurrentSlide] = useState(0);

   const nextSlide = useCallback(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
   }, []);

   const prevSlide = useCallback(() => {
      setCurrentSlide(
         (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
      );
   }, []);

   // Auto-rotate every 5 seconds
   useEffect(() => {
      const timer = setInterval(nextSlide, 5000);
      return () => clearInterval(timer);
   }, [nextSlide]);

   useEffect(() => {
      axios
         .get('/api/events/active')
         .then((res) => setEvents(res.data.activeEvents ?? []))
         .catch(() => setEvents([]))
         .finally(() => setLoading(false));
   }, []);

   const slide = heroSlides[currentSlide];

   return (
      <div>
         {/* Hero — Animated Carousel */}
         <section className="relative h-[520px] md:h-[600px] overflow-hidden bg-black">
            {/* Background images */}
            <AnimatePresence mode="wait">
               <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  className="absolute inset-0"
               >
                  <img
                     src={slide.image}
                     alt=""
                     className="h-full w-full object-cover"
                  />
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
               </motion.div>
            </AnimatePresence>

            {/* Text overlay */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex flex-col justify-center">
               <AnimatePresence mode="wait">
                  <motion.div
                     key={currentSlide}
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     transition={{ duration: 0.5, delay: 0.15 }}
                  >
                     <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight whitespace-pre-line drop-shadow-lg">
                        {slide.title}
                     </h1>
                     <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl drop-shadow-md">
                        {slide.subtitle}
                     </p>
                     <div className="flex items-center gap-4">
                        <Link
                           to="/events"
                           className="glass-subtle text-white px-7 py-3.5 rounded-full text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                        >
                           Browse Events
                        </Link>
                        <a
                           href="#how-it-works"
                           className="glass-subtle text-white px-7 py-3.5 rounded-full text-sm font-semibold hover:scale-105 transition-all duration-300"
                        >
                           Learn More
                        </a>
                     </div>
                  </motion.div>
               </AnimatePresence>

               {/* Navigation arrows */}
               <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 transition-colors border border-white/20"
                  aria-label="Previous slide"
               >
                  <ChevronLeft className="h-5 w-5" />
               </button>
               <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 transition-colors border border-white/20"
                  aria-label="Next slide"
               >
                  <ChevronRight className="h-5 w-5" />
               </button>

               {/* Dot indicators */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
                  {heroSlides.map((_, i) => (
                     <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                           i === currentSlide
                              ? 'w-8 bg-white'
                              : 'w-2 bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                     />
                  ))}
               </div>
            </div>
         </section>

         {/* Active Events */}
         <section className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>

            {loading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                     <div
                        key={i}
                        className="rounded-2xl border border-border overflow-hidden animate-pulse"
                     >
                        <div className="h-44 bg-muted" />
                        <div className="p-5 space-y-3">
                           <div className="h-6 bg-muted rounded w-3/4" />
                           <div className="h-4 bg-muted rounded w-1/2" />
                           <div className="h-4 bg-muted rounded w-2/3" />
                           <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                     </div>
                  ))}
               </div>
            ) : events.length === 0 ? (
               <div className="text-center py-12 glass-card rounded-2xl">
                  <p className="text-muted-foreground">
                     No upcoming events at the moment. Check back soon!
                  </p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                     <EventCard key={event.id} event={event} />
                  ))}
               </div>
            )}
         </section>

         {/* How It Works */}
         <section id="how-it-works" className="bg-muted/50">
            <div className="max-w-6xl mx-auto px-4 py-16">
               <h2 className="text-2xl font-bold mb-8 text-center">
                  How It Works
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center glass-card rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03]">
                     <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                        1
                     </div>
                     <h3 className="font-semibold mb-1">Browse Events</h3>
                     <p className="text-sm text-muted-foreground">
                        Find upcoming fundraising events and view available menu
                        items.
                     </p>
                  </div>
                  <div className="text-center glass-card rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03]">
                     <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                        2
                     </div>
                     <h3 className="font-semibold mb-1">Select & Order</h3>
                     <p className="text-sm text-muted-foreground">
                        Choose your favourite dishes and place your order in
                        minutes.
                     </p>
                  </div>
                  <div className="text-center glass-card rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03]">
                     <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                        3
                     </div>
                     <h3 className="font-semibold mb-1">Upload & Confirm</h3>
                     <p className="text-sm text-muted-foreground">
                        Upload your payment screenshot and receive order
                        confirmation.
                     </p>
                  </div>
               </div>
            </div>
         </section>
      </div>
   );
}
