import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Invitation = {
   id: number;
   code: string;
   email: string | null;
   role: string;
   expiresAt: string;
   usedAt: string | null;
   usedBy: number | null;
   createdAt: string;
};

export default function InvitationsPage() {
   const { toast } = useToast();
   const [invitations, setInvitations] = useState<Invitation[]>([]);
   const [loading, setLoading] = useState(true);
   const [showForm, setShowForm] = useState(false);
   const [newInvitation, setNewInvitation] = useState<Invitation | null>(null);
   const [formEmail, setFormEmail] = useState('');
   const [formRole, setFormRole] = useState('ORGANIZER');
   const [creating, setCreating] = useState(false);
   const [error, setError] = useState('');

   const fetchInvitations = async () => {
      try {
         const { data } = await api.get('/invitations');
         setInvitations(data.invitations);
      } catch {
         setError('Unable to load invitations. Please try again.');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchInvitations();
   }, []);

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      setError('');

      try {
         const { data } = await api.post('/invitations', {
            email: formEmail || undefined,
            role: formRole,
         });
         setNewInvitation(data.invitation);
         setFormEmail('');
         setFormRole('ORGANIZER');
         setShowForm(false);
         fetchInvitations();
      } catch (err) {
         const message =
            err instanceof Error
               ? err.message
               : 'Unable to create invitation. Please try again.';
         setError(message);
      } finally {
         setCreating(false);
      }
   };

   const handleRevoke = async (id: number) => {
      if (!confirm('Are you sure you want to revoke this invitation?')) return;

      try {
         await api.delete(`/invitations/${id}`);
         fetchInvitations();
      } catch (err) {
         const message =
            err instanceof Error
               ? err.message
               : 'Unable to revoke invitation. Please try again.';
         setError(message);
      }
   };

   const copyLink = (code: string) => {
      const url = `${window.location.origin}/register?code=${code}`;
      navigator.clipboard.writeText(url);
      toast('Registration link copied to clipboard!', 'success');
   };

   const getStatus = (inv: Invitation) => {
      if (inv.usedAt)
         return { label: 'Used', color: 'bg-green-100 text-green-800' };
      if (new Date(inv.expiresAt) < new Date())
         return { label: 'Expired', color: 'bg-gray-100 text-gray-800' };
      return { label: 'Active', color: 'bg-blue-100 text-blue-800' };
   };

   if (loading) {
      return <div className="text-muted-foreground">Loading...</div>;
   }

   return (
      <div>
         <div className="flex items-center justify-between mb-8">
            <div>
               <h1 className="text-2xl font-bold text-foreground">
                  Invitations
               </h1>
               <p className="text-muted-foreground mt-1">
                  Manage registration invitations for organizers
               </p>
            </div>
            <button
               onClick={() => setShowForm(!showForm)}
               className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90"
            >
               {showForm ? 'Cancel' : '+ New Invitation'}
            </button>
         </div>

         {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
               {error}
            </div>
         )}

         {/* New invitation created - show code */}
         {newInvitation && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="font-medium text-green-800">
                        Invitation created!
                     </p>
                     <p className="text-sm text-green-700 mt-1">
                        Code:{' '}
                        <span className="font-mono font-bold">
                           {newInvitation.code}
                        </span>
                     </p>
                     <p className="text-sm text-green-700">
                        Send this link:{' '}
                        <span className="font-mono text-xs">
                           {window.location.origin}/register?code=
                           {newInvitation.code}
                        </span>
                     </p>
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => copyLink(newInvitation.code)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                     >
                        Copy Link
                     </button>
                     <button
                        onClick={() => setNewInvitation(null)}
                        className="px-3 py-1 text-sm text-green-700 hover:text-green-900"
                     >
                        Dismiss
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Create form */}
         {showForm && (
            <div className="mb-6 p-4 bg-card border border-border rounded-md">
               <h3 className="font-medium text-foreground mb-3">
                  Create Invitation
               </h3>
               <form onSubmit={handleCreate} className="flex gap-4 items-end">
                  <div className="flex-1">
                     <label className="block text-sm text-muted-foreground mb-1">
                        Email (optional — restrict to this email)
                     </label>
                     <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                        placeholder="organizer@example.com"
                     />
                  </div>
                  <div>
                     <label className="block text-sm text-muted-foreground mb-1">
                        Role
                     </label>
                     <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                     >
                        <option value="ORGANIZER">Organizer</option>
                        <option value="ADMIN">Admin</option>
                     </select>
                  </div>
                  <button
                     type="submit"
                     disabled={creating}
                     className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                     {creating ? 'Creating...' : 'Create'}
                  </button>
               </form>
            </div>
         )}

         {/* Invitations table */}
         <div className="bg-card border border-border rounded-md overflow-hidden">
            <table className="w-full">
               <thead>
                  <tr className="border-b border-border bg-muted/50">
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Code
                     </th>
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Email
                     </th>
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Role
                     </th>
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Status
                     </th>
                     <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Expires
                     </th>
                     <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                        Actions
                     </th>
                  </tr>
               </thead>
               <tbody>
                  {invitations.length === 0 ? (
                     <tr>
                        <td
                           colSpan={6}
                           className="px-4 py-8 text-center text-muted-foreground"
                        >
                           No invitations yet. Create one to get started.
                        </td>
                     </tr>
                  ) : (
                     invitations.map((inv) => {
                        const status = getStatus(inv);
                        return (
                           <tr
                              key={inv.id}
                              className="border-b border-border last:border-0"
                           >
                              <td className="px-4 py-3">
                                 <span className="font-mono text-sm">
                                    {inv.code}
                                 </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                 {inv.email || (
                                    <span className="text-muted-foreground">
                                       Any
                                    </span>
                                 )}
                              </td>
                              <td className="px-4 py-3">
                                 <span className="px-2 py-0.5 text-xs font-medium bg-muted rounded">
                                    {inv.role}
                                 </span>
                              </td>
                              <td className="px-4 py-3">
                                 <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${status.color}`}
                                 >
                                    {status.label}
                                 </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                 {new Date(inv.expiresAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                 {!inv.usedAt && (
                                    <div className="flex gap-2 justify-end">
                                       <button
                                          onClick={() => copyLink(inv.code)}
                                          className="text-sm text-primary hover:underline"
                                       >
                                          Copy Link
                                       </button>
                                       <button
                                          onClick={() => handleRevoke(inv.id)}
                                          className="text-sm text-destructive hover:underline"
                                       >
                                          Revoke
                                       </button>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        );
                     })
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}
