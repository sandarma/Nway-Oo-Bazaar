import { ArrowRight } from 'lucide-react';

export default function ContactPage() {
   return (
      <div className="max-w-6xl mx-auto px-4 py-12">
         <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
         <p className="text-muted-foreground">
            Get in touch with the organizers.
         </p>
         <p className="text-muted-foreground mt-2">
            <a
               href="https://www.facebook.com/nwayoobazaar/"
               target="_blank"
               className="text-blue-500 hover:underline"
            >
               Nway Oo Bazaar Facebook Page
            </a>
         </p>
      </div>
   );
}
