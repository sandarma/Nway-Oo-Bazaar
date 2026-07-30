import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

export default function RegisterPage() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { register } = useAuth();

   const [code, setCode] = useState(searchParams.get('code') || '');
   const [name, setName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState(false);
   const [loading, setLoading] = useState(false);
   const [checkingCode, setCheckingCode] = useState(true);

   // Check invitation status on mount
   useEffect(() => {
      const checkInvitation = async () => {
         const codeFromUrl = searchParams.get('code');
         if (!codeFromUrl) {
            setCheckingCode(false);
            return;
         }

         try {
            const { data } = await api.get(`/invitations/check/${codeFromUrl}`);
            if (!data.valid) {
               navigate('/login', {
                  replace: true,
                  state: { message: data.reason },
               });
            }
         } catch {
            navigate('/login', { replace: true });
         } finally {
            setCheckingCode(false);
         }
      };

      checkInvitation();
   }, [searchParams, navigate]);

   if (checkingCode) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-background">
            <p className="text-muted-foreground">Checking invitation...</p>
         </div>
      );
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (password !== confirmPassword) {
         setError('Passwords do not match');
         return;
      }

      setLoading(true);

      try {
         await register(code, name, email, password);
         setSuccess(true);
      } catch (err) {
         if (isAxiosError(err) && err.response?.data?.error) {
            setError(err.response.data.error);
         } else {
            setError('Something went wrong. Please try again.');
         }
      } finally {
         setLoading(false);
      }
   };

   if (success) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md text-center">
               <div className="bg-card p-8 rounded-lg shadow-md border border-border">
                  <div className="text-4xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                     Account Created!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                     Your account has been successfully created. You can now
                     sign in.
                  </p>
                  <Link
                     to="/login"
                     className="inline-block bg-primary text-primary-foreground py-2 px-6 rounded-md font-medium hover:opacity-90"
                  >
                     Go to Sign In
                  </Link>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="w-full max-w-md">
            <div className="text-center mb-8">
               <h1 className="text-3xl font-bold text-foreground">
                  Nway Oo Bazaar
               </h1>
               <p className="text-muted-foreground mt-2">
                  Create your organizer account
               </p>
            </div>

            <form
               onSubmit={handleSubmit}
               className="bg-card p-8 rounded-lg shadow-md border border-border"
            >
               {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                     {error}
                  </div>
               )}

               <div className="mb-4">
                  <label
                     htmlFor="code"
                     className="block text-sm font-medium text-foreground mb-1"
                  >
                     Invitation Code
                  </label>
                  <input
                     id="code"
                     type="text"
                     value={code}
                     onChange={(e) => setCode(e.target.value)}
                     required
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                     placeholder="e.g. ABC123DEF456"
                  />
               </div>

               <div className="mb-4">
                  <label
                     htmlFor="name"
                     className="block text-sm font-medium text-foreground mb-1"
                  >
                     Full Name
                  </label>
                  <input
                     id="name"
                     type="text"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     required
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                     placeholder="Your name"
                  />
               </div>

               <div className="mb-4">
                  <label
                     htmlFor="email"
                     className="block text-sm font-medium text-foreground mb-1"
                  >
                     Email
                  </label>
                  <input
                     id="email"
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                     placeholder="you@example.com"
                  />
               </div>

               <div className="mb-4">
                  <label
                     htmlFor="password"
                     className="block text-sm font-medium text-foreground mb-1"
                  >
                     Password
                  </label>
                  <div className="relative">
                     <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="At least 8 characters"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                     >
                        {showPassword ? (
                           <EyeOff className="h-4 w-4" />
                        ) : (
                           <Eye className="h-4 w-4" />
                        )}
                     </button>
                  </div>
               </div>

               <div className="mb-6">
                  <label
                     htmlFor="confirmPassword"
                     className="block text-sm font-medium text-foreground mb-1"
                  >
                     Confirm Password
                  </label>
                  <div className="relative">
                     <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Re-enter your password"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                     >
                        {showPassword ? (
                           <EyeOff className="h-4 w-4" />
                        ) : (
                           <Eye className="h-4 w-4" />
                        )}
                     </button>
                  </div>
                  {password &&
                     confirmPassword &&
                     password !== confirmPassword && (
                        <p className="mt-1 text-sm text-destructive">
                           Passwords do not match
                        </p>
                     )}
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
               >
                  {loading ? 'Creating account...' : 'Create Account'}
               </button>

               <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                     Sign in
                  </Link>
               </p>
            </form>
         </div>
      </div>
   );
}
