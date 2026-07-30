import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import EventSelector from '@/components/dashboard/EventSelector';

interface MenuItem {
   id: number;
   itemCode: string;
   name: string;
   chef: string | null;
   category: string;
   price: number;
   stockQty: number;
   isSoldOut: boolean;
   eventId: number;
}

const CATEGORIES = [
   'MAIN_DISH',
   'SNACK',
   'DESSERT',
   'DRINK',
   'RAFFLE_TICKET',
   'CINEMA_TICKET',
];

export default function MenuPage() {
   const { toast } = useToast();
   const [searchParams] = useSearchParams();
   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
   const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

   const eventId = searchParams.get('eventId');

   useEffect(() => {
      if (eventId) {
         fetchMenuItems();
      }
   }, [eventId]);

   const fetchMenuItems = async () => {
      if (!eventId) return;

      setLoading(true);
      try {
         const response = await api.get(`/dashboard/${eventId}/menu`);
         setMenuItems(response.data);
      } catch (error) {
         console.error('Failed to fetch menu items:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleDelete = async (itemId: number) => {
      if (!confirm('Are you sure you want to delete this menu item?')) {
         return;
      }

      try {
         await api.delete(`/menu-items/${itemId}`);
         setMenuItems(menuItems.filter((item) => item.id !== itemId));
      } catch (error) {
         console.error('Failed to delete menu item:', error);
         toast('Failed to delete menu item', 'error');
      }
   };

   const handleCreate = async (itemData: Partial<MenuItem>) => {
      try {
         const response = await api.post('/menu-items', {
            ...itemData,
            eventId: Number(eventId),
         });
         setMenuItems([response.data.menuItem, ...menuItems]);
         setShowCreateModal(false);
      } catch (error) {
         console.error('Failed to create menu item:', error);
         toast('Failed to create menu item', 'error');
      }
   };

   const handleUpdate = async (itemData: Partial<MenuItem>) => {
      if (!editingItem) return;

      try {
         const response = await api.patch(
            `/menu-items/${editingItem.id}`,
            itemData
         );
         setMenuItems(
            menuItems.map((item) =>
               item.id === editingItem.id ? response.data.menuItem : item
            )
         );
         setEditingItem(null);
      } catch (error) {
         console.error('Failed to update menu item:', error);
         toast('Failed to update menu item', 'error');
      }
   };

   const handleBulkMarkSoldOut = async (soldOut: boolean) => {
      if (
         !confirm(
            `Are you sure you want to mark all items as ${soldOut ? 'sold out' : 'available'}?`
         )
      ) {
         return;
      }

      try {
         await Promise.all(
            menuItems.map((item) =>
               api.patch(`/menu-items/${item.id}`, { isSoldOut: soldOut })
            )
         );
         setMenuItems(
            menuItems.map((item) => ({ ...item, isSoldOut: soldOut }))
         );
      } catch (error) {
         console.error('Failed to update menu items:', error);
         toast('Failed to update menu items', 'error');
      }
   };

   const filteredItems =
      selectedCategory === 'ALL'
         ? menuItems
         : menuItems.filter((item) => item.category === selectedCategory);

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">Menu Items</h1>
            <div className="flex gap-2 items-center">
               <EventSelector />
               <button
                  onClick={() => handleBulkMarkSoldOut(true)}
                  className="px-3 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-muted"
               >
                  Mark All Sold Out
               </button>
               <button
                  onClick={() => handleBulkMarkSoldOut(false)}
                  className="px-3 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-muted"
               >
                  Mark All Available
               </button>
               <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
               >
                  <Plus className="w-4 h-4" />
                  Add Item
               </button>
            </div>
         </div>

         {/* Category Filter */}
         <div className="flex flex-wrap gap-2">
            <button
               onClick={() => setSelectedCategory('ALL')}
               className={`px-3 py-1.5 text-sm rounded-md ${
                  selectedCategory === 'ALL'
                     ? 'bg-primary text-primary-foreground'
                     : 'bg-muted text-muted-foreground hover:bg-muted/80'
               }`}
            >
               All
            </button>
            {CATEGORIES.map((cat) => (
               <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                     selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
               >
                  {cat.replace(/_/g, ' ')}
               </button>
            ))}
         </div>

         {/* Menu Items List */}
         {loading ? (
            <div className="space-y-4">
               {[...Array(5)].map((_, i) => (
                  <div
                     key={i}
                     className="h-20 bg-muted rounded-lg animate-pulse"
                  />
               ))}
            </div>
         ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
               <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">No menu items found</p>
               <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-primary hover:underline"
               >
                  Add your first menu item
               </button>
            </div>
         ) : (
            <div className="space-y-4">
               {filteredItems.map((item) => (
                  <MenuItemCard
                     key={item.id}
                     item={item}
                     onEdit={() => setEditingItem(item)}
                     onDelete={() => handleDelete(item.id)}
                  />
               ))}
            </div>
         )}

         {/* Create Modal */}
         {showCreateModal && (
            <MenuItemModal
               title="Add Menu Item"
               onClose={() => setShowCreateModal(false)}
               onSubmit={handleCreate}
            />
         )}

         {/* Edit Modal */}
         {editingItem && (
            <MenuItemModal
               title="Edit Menu Item"
               item={editingItem}
               onClose={() => setEditingItem(null)}
               onSubmit={handleUpdate}
            />
         )}
      </div>
   );
}

function MenuItemCard({
   item,
   onEdit,
   onDelete,
}: {
   item: MenuItem;
   onEdit: () => void;
   onDelete: () => void;
}) {
   const categoryColors = {
      MAIN_DISH: 'bg-blue-100 text-blue-800',
      SNACK: 'bg-yellow-100 text-yellow-800',
      DESSERT: 'bg-pink-100 text-pink-800',
      DRINK: 'bg-cyan-100 text-cyan-800',
      RAFFLE_TICKET: 'bg-purple-100 text-purple-800',
      CINEMA_TICKET: 'bg-indigo-100 text-indigo-800',
   };

   return (
      <div
         className={`p-4 bg-card border border-border rounded-lg ${item.isSoldOut ? 'opacity-60' : ''}`}
      >
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
               <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">
                     {item.itemCode}
                  </span>
                  <span
                     className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[item.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}
                  >
                     {item.category.replace(/_/g, ' ')}
                  </span>
                  {item.isSoldOut && (
                     <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Sold Out
                     </span>
                  )}
               </div>
               <p className="mt-1 font-medium text-foreground">{item.name}</p>
               {item.chef && (
                  <p className="mt-1 text-sm text-muted-foreground">
                     Chef:{' '}
                     <span className="font-medium text-foreground">
                        {item.chef}
                     </span>
                  </p>
               )}
               <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>${item.price.toFixed(2)}</span>
                  <span className="flex items-center gap-1">
                     <Package className="w-4 h-4" />
                     {item.stockQty} in stock
                  </span>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button
                  onClick={onEdit}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
               >
                  <Edit className="w-4 h-4" />
               </button>
               <button
                  onClick={onDelete}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
   );
}

function MenuItemModal({
   title,
   item,
   onClose,
   onSubmit,
}: {
   title: string;
   item?: MenuItem;
   onClose: () => void;
   onSubmit: (data: Partial<MenuItem>) => void;
}) {
   const [formData, setFormData] = useState({
      itemCode: item?.itemCode || '',
      name: item?.name || '',
      chef: item?.chef || '',
      category: item?.category || 'MAIN_DISH',
      price: item?.price || 0,
      stockQty: item?.stockQty || 0,
      isSoldOut: item?.isSoldOut || false,
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
   };

   return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
         <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
               <h2 className="text-lg font-semibold text-foreground">
                  {title}
               </h2>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-md"
               >
                  ✕
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Item Code *
                  </label>
                  <input
                     type="text"
                     value={formData.itemCode}
                     onChange={(e) =>
                        setFormData({ ...formData, itemCode: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Name *
                  </label>
                  <input
                     type="text"
                     value={formData.name}
                     onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Chef
                  </label>
                  <input
                     type="text"
                     value={formData.chef}
                     onChange={(e) =>
                        setFormData({ ...formData, chef: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     placeholder="Optional"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Category *
                  </label>
                  <select
                     value={formData.category}
                     onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     required
                  >
                     {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                           {cat.replace(/_/g, ' ')}
                        </option>
                     ))}
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Price *
                     </label>
                     <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              price: parseFloat(e.target.value) || 0,
                           })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        required
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Stock Quantity *
                     </label>
                     <input
                        type="number"
                        min="0"
                        value={formData.stockQty}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              stockQty: parseInt(e.target.value) || 0,
                           })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        required
                     />
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <input
                     type="checkbox"
                     id="isSoldOut"
                     checked={formData.isSoldOut}
                     onChange={(e) =>
                        setFormData({
                           ...formData,
                           isSoldOut: e.target.checked,
                        })
                     }
                     className="w-4 h-4 rounded border-border"
                  />
                  <label
                     htmlFor="isSoldOut"
                     className="text-sm text-foreground"
                  >
                     Mark as Sold Out
                  </label>
               </div>
               <div className="flex gap-3 pt-4">
                  <button
                     type="button"
                     onClick={onClose}
                     className="flex-1 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                     {item ? 'Update' : 'Add'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
