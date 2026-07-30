import { motion } from 'framer-motion';
import {
   Heart,
   Users,
   Utensils,
   TrendingUp,
   Globe,
   Shield,
} from 'lucide-react';

const stats = [
   { icon: Users, value: '2,500+', label: 'Community Members' },
   { icon: Utensils, value: '150+', label: 'Events Hosted' },
   { icon: Heart, value: '$80K+', label: 'Funds Raised' },
   { icon: TrendingUp, value: '5,000+', label: 'Orders Fulfilled' },
];

const values = [
   {
      icon: Heart,
      title: 'Community First',
      description:
         'Every event we host strengthens the bonds between neighbours, families, and friends. Food brings people together.',
   },
   {
      icon: Shield,
      title: 'Trust & Transparency',
      description:
         'Clear pricing, verified payments, and real-time order tracking so you always know where your support goes.',
   },
   {
      icon: Globe,
      title: 'Cultural Celebration',
      description:
         'We celebrate the rich diversity of our community through food — from traditional Myanmar dishes to fusion favourites.',
   },
   {
      icon: Utensils,
      title: 'Quality & Care',
      description:
         'Every dish is prepared with love by talented home cooks and local chefs who pour their heart into each meal.',
   },
];

const fadeUp = {
   hidden: { opacity: 0, y: 30 },
   visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.1 },
   }),
};

export default function AboutPage() {
   return (
      <div>
         {/* CTA */}
         <section className="relative overflow-hidden">
            <div className="absolute inset-0">
               <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"
                  alt=""
                  className="h-full w-full object-cover"
               />
               <div className="absolute inset-0 bg-black/60" />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto px-4 py-20 text-center">
               <motion.h2
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={0}
                  className="text-3xl md:text-4xl font-bold text-white mb-4"
               >
                  Ready to Be Part of Something Delicious?
               </motion.h2>
               <motion.p
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={1}
                  className="text-lg text-white/75 mb-8"
               >
                  Join our community and discover upcoming events, order amazing
                  food, and support local fundraising efforts.
               </motion.p>
               <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={2}
                  className="flex items-center justify-center gap-4"
               >
                  <a
                     href="/events"
                     className="glass-subtle text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                     Browse Events
                  </a>
                  <a
                     href="/contact"
                     className="glass-subtle text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:scale-105 transition-all duration-300"
                  >
                     Get in Touch
                  </a>
               </motion.div>
            </div>
         </section>

         {/* Our Story */}
         <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-80px' }}
                  variants={fadeUp}
                  custom={0}
               >
                  <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                     Our Story
                  </span>
                  <h2 className="text-3xl font-bold mt-2 mb-4">
                     Born from a Love of Food & Community
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                     Nway Oo Bazaar started with a simple idea: what if we could
                     make it easier for communities to come together over food?
                     What if ordering for a fundraiser was as easy as a few taps
                     on your phone?
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                     We saw talented home cooks and local chefs pouring their
                     hearts into preparing dishes for community events, while
                     Organisers struggled with paper orders, manual payments,
                     and confusing logistics. There had to be a better way.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                     Today, our platform connects communities, simplifies
                     fundraising, and celebrates the incredible food traditions
                     that make our neighbourhoods vibrant.
                  </p>
               </motion.div>

               <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-80px' }}
                  variants={fadeUp}
                  custom={1}
                  className="relative"
               >
                  <div className="rounded-2xl overflow-hidden glass-card">
                     <img
                        src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80"
                        alt="Delicious community food"
                        className="w-full h-72 object-cover"
                     />
                  </div>
                  {/* Floating accent card */}
                  <div className="absolute -bottom-5 -left-5 glass-card rounded-xl px-5 py-3 shadow-lg">
                     <p className="text-2xl font-bold text-primary">
                        Est. 2021
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Auckland, New Zealand
                     </p>
                  </div>
               </motion.div>
            </div>
         </section>

         {/* Stats Banner */}
         <section className="glass-strong py-12">
            <div className="max-w-6xl mx-auto px-4">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stats.map((stat, i) => (
                     <motion.div
                        key={stat.label}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={i}
                        className="text-center"
                     >
                        <stat.icon className="h-7 w-7 text-primary mx-auto mb-2" />
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                           {stat.label}
                        </p>
                     </motion.div>
                  ))}
               </div>
            </div>
         </section>

         {/* Mission & Vision */}
         <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
               <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                  What Drives Us
               </span>
               <h2 className="text-3xl font-bold mt-2">Mission & Vision</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={0}
                  className="glass-card rounded-2xl p-8 relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
                  <h3 className="text-xl font-bold mb-3 relative z-10">
                     🎯 Our Mission
                  </h3>
                  <p className="text-muted-foreground leading-relaxed relative z-10">
                     To empower community fundraising through technology —
                     making food ordering seamless, payments transparent, and
                     event management effortless for organisers and attendees
                     alike.
                  </p>
               </motion.div>

               <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={1}
                  className="glass-card rounded-2xl p-8 relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-bl-full" />
                  <h3 className="text-xl font-bold mb-3 relative z-10">
                     🔭 Our Vision
                  </h3>
                  <p className="text-muted-foreground leading-relaxed relative z-10">
                     A world where every community can easily organise
                     food-based fundraising, celebrating cultural diversity
                     while raising funds for causes that matter — all through a
                     platform that feels as warm as the meals we share.
                  </p>
               </motion.div>
            </div>
         </section>

         {/* Values */}
         <section className="bg-muted/40">
            <div className="max-w-6xl mx-auto px-4 py-16">
               <div className="text-center mb-12">
                  <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                     Our Values
                  </span>
                  <h2 className="text-3xl font-bold mt-2">What We Stand For</h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {values.map((value, i) => (
                     <motion.div
                        key={value.title}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={i}
                        className="glass-card rounded-2xl p-6 text-center hover:scale-[1.03] transition-transform duration-300"
                     >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                           <value.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">{value.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                           {value.description}
                        </p>
                     </motion.div>
                  ))}
               </div>
            </div>
         </section>

         {/* How It Started — Image Grid */}
         <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
               <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                  A Glimpse Into Our World
               </span>
               <h2 className="text-3xl font-bold mt-2">
                  Life at Nway Oo Bazaar
               </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {[
                  {
                     src: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80',
                     alt: 'Cooking together',
                     span: 'md:col-span-2 md:row-span-2',
                     height: 'h-48 md:h-full',
                  },
                  {
                     src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
                     alt: 'Plated dish',
                     span: '',
                     height: 'h-48',
                  },
                  {
                     src: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80',
                     alt: 'Fresh ingredients',
                     span: '',
                     height: 'h-48',
                  },
                  {
                     src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
                     alt: 'Food spread',
                     span: '',
                     height: 'h-48',
                  },
                  {
                     src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
                     alt: 'Grilled food',
                     span: '',
                     height: 'h-48',
                  },
               ].map((img, i) => (
                  <motion.div
                     key={i}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true }}
                     variants={fadeUp}
                     custom={i}
                     className={`rounded-xl overflow-hidden glass-card ${img.span}`}
                  >
                     <img
                        src={img.src}
                        alt={img.alt}
                        className={`w-full ${img.height} object-cover hover:scale-105 transition-transform duration-500`}
                     />
                  </motion.div>
               ))}
            </div>
         </section>
      </div>
   );
}
