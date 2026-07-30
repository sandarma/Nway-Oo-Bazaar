import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAxiosError } from 'axios';

export default function LoginPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const { login } = useAuth();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState(
      (location.state as { message?: string })?.message || ''
   );
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         const user = await login(email, password);
         // Redirect based on user role
         if (user.role === 'ADMIN') {
            navigate('/admin/invitations');
         } else {
            navigate('/dashboard');
         }
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

   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="w-full max-w-md">
            <div className="text-center mb-8">
               <h1 className="text-3xl font-bold text-foreground">
                  Nway Oo Bazaar
               </h1>
               <p className="text-muted-foreground mt-2">Sign in to manage</p>
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
                     placeholder="admin@nwayoobazaar.com"
                  />
               </div>

               <div className="mb-6">
                  <label
                     htmlFor="password"
                     className="block text-sm font-medium text-foreground mb-1"
                  >
                     Password
                  </label>
                  <input
                     id="password"
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                     placeholder="••••••••"
                  />
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
               >
                  {loading ? 'Signing in...' : 'Sign in'}
               </button>

               <p className="mt-4 text-center text-sm text-muted-foreground">
                  Have an invitation code?{' '}
                  <Link to="/register" className="text-primary hover:underline">
                     Register here
                  </Link>
               </p>
            </form>
         </div>
      </div>
   );
}
