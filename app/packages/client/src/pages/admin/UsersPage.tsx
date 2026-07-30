import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type User = {
   id: number;
   email: string;
   name: string;
   role: string;
   createdAt: string;
};

export default function UsersPage() {
   const { user: currentUser } = useAuth();
   const [users, setUsers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   const fetchUsers = async () => {
      try {
         const { data } = await api.get('/users');
         setUsers(data.users);
      } catch {
         setError('Unable to load users. Please try again.');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchUsers();
   }, []);

   const handleDelete = async (id: number, name: string) => {
      if (
         !confirm(
            `Are you sure you want to delete ${name}? This action cannot be undone.`
         )
      )
         return;

      try {
         await api.delete(`/users/${id}`);
         fetchUsers();
      } catch (err) {
         const message =
            err instanceof Error
               ? err.message
               : 'Unable to delete user. Please try again.';
         setError(message);
      }
   };

   if (loading) {
      return <div className="text-muted-foreground">Loading...</div>;
   }

   return (
      <div>
         <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">
               Manage organizer accounts
            </p>
         </div>

         {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
               {error}
            </div>
         )}

         <div className="bg-card border border-border rounded-md overflow-hidden">
            <table className="w-full">
               <thead>
                  <tr className="border-b border-border bg-muted/50">
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Name
                     </th>
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Email
                     </th>
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Role
                     </th>
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Joined
                     </th>
                     <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                        Actions
                     </th>
                  </tr>
               </thead>
               <tbody>
                  {users.map((user) => (
                     <tr
                        key={user.id}
                        className="border-b border-border last:border-0"
                     >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                           {user.name}
                           {user.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                 (you)
                              </span>
                           )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                           {user.email}
                        </td>
                        <td className="px-4 py-3">
                           <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                 user.role === 'ADMIN'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                           >
                              {user.role}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                           {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                           {user.id !== currentUser?.id && (
                              <button
                                 onClick={() =>
                                    handleDelete(user.id, user.name)
                                 }
                                 className="text-sm text-destructive hover:underline"
                              >
                                 Delete
                              </button>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
