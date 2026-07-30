import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

type Order = {
   id: number;
   orderNumber: string;
   status: string;
   total: number;
   customer: {
      name: string;
   };
   event: {
      id: number;
      name: string;
   };
};

export default function PaymentUploadPage() {
   const [searchParams] = useSearchParams();
   const orderNumber = searchParams.get('order');

   const [order, setOrder] = useState<Order | null>(null);
   const [loading, setLoading] = useState(() => Boolean(orderNumber));
   const [error, setError] = useState(() => !orderNumber);

   const [file, setFile] = useState<File | null>(null);
   const [preview, setPreview] = useState<string | null>(null);
   const [uploading, setUploading] = useState(false);
   const [uploadError, setUploadError] = useState('');
   const [success, setSuccess] = useState(false);
   const [dragActive, setDragActive] = useState(false);

   const inputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      if (!orderNumber) return;
      axios
         .get(`/api/orders/${orderNumber}`)
         .then((res) => setOrder(res.data))
         .catch(() => setError(true))
         .finally(() => setLoading(false));
   }, [orderNumber]);

   const handleFile = (selected: File) => {
      if (!selected.type.startsWith('image/')) {
         setUploadError('Please upload an image file.');
         return;
      }
      if (selected.size > 5 * 1024 * 1024) {
         setUploadError('File size must be under 5MB.');
         return;
      }
      setFile(selected);
      setUploadError('');
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selected);
   };

   const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
   };

   const handleSubmit = async () => {
      if (!file || !orderNumber) return;

      setUploading(true);
      setUploadError('');

      try {
         const formData = new FormData();
         formData.append('paymentScreenshot', file);

         await axios.post(`/api/orders/${orderNumber}/payment`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
         });

         setSuccess(true);
      } catch (err: unknown) {
         const message =
            axios.isAxiosError(err) && err.response?.data?.error
               ? err.response.data.error
               : 'Failed to upload payment. Please try again.';
         setUploadError(message);
      } finally {
         setUploading(false);
      }
   };

   const removeFile = () => {
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
   };

   if (loading) {
      return (
         <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
               <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
               <div className="h-64 bg-muted rounded" />
            </div>
         </div>
      );
   }

   if (error || !order) {
      return (
         <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-2">Order not found</h1>
            <p className="text-muted-foreground mb-4">
               We couldn't find your order. Please check your order number.
            </p>
            <Link to="/events" className="text-sm text-primary hover:underline">
               ← Browse Events
            </Link>
         </div>
      );
   }

   if (success) {
      return (
         <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-4">
               <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Uploaded!</h1>
            <p className="text-muted-foreground mb-2">
               Your payment screenshot has been submitted for{' '}
               <span className="font-medium">{order.orderNumber}</span>.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
               The organizer will review your payment upload and mark the order
               as paid after verification.
            </p>
            <Link
               to="/events"
               className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
               Browse Events
            </Link>
         </div>
      );
   }

   return (
      <div className="max-w-2xl mx-auto px-4 py-12">
         <h1 className="text-3xl font-bold mb-2 text-center">Upload Payment</h1>
         <p className="text-muted-foreground text-center mb-8">
            Upload your payment screenshot for bank transfer orders.
         </p>

         {/* Order summary */}
         <div className="border border-border rounded-xl p-5 mb-6">
            <div className="flex justify-between text-sm mb-1">
               <span className="text-muted-foreground">Order Number</span>
               <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
               <span className="text-muted-foreground">Event</span>
               <span>{order.event.name}</span>
            </div>
            <div className="flex justify-between text-sm">
               <span className="text-muted-foreground">Total</span>
               <span className="font-semibold">${order.total.toFixed(2)}</span>
            </div>
         </div>

         {/* Upload area */}
         <div
            onDragOver={(e) => {
               e.preventDefault();
               setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6 ${
               dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
            }`}
         >
            <input
               ref={inputRef}
               type="file"
               accept="image/*"
               onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFile(selected);
               }}
               className="hidden"
            />

            {preview ? (
               <div className="space-y-4">
                  <img
                     src={preview}
                     alt="Payment preview"
                     className="max-h-64 mx-auto rounded-lg border border-border"
                  />
                  <div className="flex items-center justify-center gap-2">
                     <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {file?.name}
                     </p>
                     <button
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                           removeFile();
                        }}
                        className="text-xs text-destructive hover:underline"
                     >
                        Remove
                     </button>
                  </div>
               </div>
            ) : (
               <div className="space-y-2">
                  <div className="text-4xl">📸</div>
                  <p className="font-medium">
                     Drag & drop your payment screenshot here
                  </p>
                  <p className="text-sm text-muted-foreground">
                     or click to browse · JPG, PNG up to 5MB
                  </p>
               </div>
            )}
         </div>

         {/* Error */}
         {uploadError && (
            <p className="text-sm text-destructive text-center mb-4">
               {uploadError}
            </p>
         )}

         {/* Submit */}
         <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
         >
            {uploading ? 'Uploading...' : 'Submit Payment'}
         </button>
      </div>
   );
}
