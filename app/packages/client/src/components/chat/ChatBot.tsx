// create a chatbot component
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator';
import ChatMessages, { type Message } from './ChatMessages';
import ChatInput, { type ChatFormData } from './ChatInput';
import popSound from '@/assets/sounds/pop.mp3';
import notificationSound from '@/assets/sounds/notification.mp3';

const popAudio = new Audio(popSound);
popAudio.volume = 0.2;

const notificationAudio = new Audio(notificationSound);
notificationAudio.volume = 0.2;

type ChatResponse = { message: string };

type Phase =
   | 'choose_event'
   | 'show_menu'
   | 'choose_items'
   | 'collect_profile'
   | 'confirm'
   | 'placed';

const API = {
   activeEvents: '/api/events/active',
   menuByEvent: (eventId: number) => `/api/events/${eventId}/menu-items`,
   createOrder: '/api/orders',
   chat: '/api/chat',
   extractOrder: '/api/chat/extract-order',
};

type EventDto = {
   id: number;
   name: string;
   eventInfo: string | null;
   pickupInfo?: string | null;
   paymentInfo?: string | null;
   eventDate: string;
   location: string;
   preOrderClose?: string | null;
};

type ActiveEventsResponse = {
   activeEvents: EventDto[];
};

type MenuItemDto = {
   id: number;
   name: string;
   itemCode: string;
   price: number;
   stockQty: number;
   isSoldOut: boolean;
   eventId: number;
   category: 'MAIN_DISH' | 'SNACK' | 'DESSERT' | 'DRINK';
};

type ActiveMenuItemsResponse = {
   menuItems: MenuItemDto[];
};

type DraftOrderItem = {
   menuItemId: number;
   name: string;
   quantity: number;
   unitPrice: number;
   subtotal: number;
};

type DraftOrder = {
   eventId: number | null;
   items: DraftOrderItem[];
   customer: { name: string; phone: string };
   note: string;
};

type OrderCreateResponse = {
   id: number;
   orderNumber: string;
   total: number;
   status: string;
   event?: {
      name: string;
      eventDate: string;
      pickupInfo?: string | null;
      paymentInfo?: string | null;
   };
};

// type ExtractedOp = {
//    name: string;
//    quantity: number;
//    action?: 'add' | 'set' | 'remove';
// };

// type ExtractOrderResponse = {
//    items: ExtractedOp[];
//    note?: string;
// };

const ChatBot = () => {
   const [messages, setMessages] = useState<Message[]>([]);
   const [isBotTyping, setIsBotTyping] = useState(false);

   const [error, setError] = useState('');

   const conversationId = useRef(crypto.randomUUID());

   const [phase, setPhase] = useState<Phase>('choose_event');
   const [activeEvents, setActiveEvents] = useState<EventDto[]>([]);
   const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
   const [placedOrder, setPlacedOrder] = useState<OrderCreateResponse | null>(
      null
   );

   const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);

   const [draftOrder, setDraftOrder] = useState<DraftOrder>({
      eventId: null,
      items: [],
      customer: { name: '', phone: '' },
      note: '',
   });

   const pushBot = (content: string) =>
      setMessages((prev) => [...prev, { content, role: 'bot' }]);

   const pushUser = (content: string) =>
      setMessages((prev) => [...prev, { content, role: 'user' }]);

   useEffect(() => {
      const init = async () => {
         try {
            setIsBotTyping(true);

            // console.log('data active events: ', data);
            const { data } = await axios.get<ActiveEventsResponse>(
               API.activeEvents
            );
            setActiveEvents(data.activeEvents);

            if (!data.activeEvents.length) {
               pushBot('Mingalarba! There is no active event right now.');
               return;
            }

            const eventText = data.activeEvents
               .map(
                  (e, i) =>
                     `${i + 1}. ${e.name} (${new Date(e.eventDate).toLocaleDateString()})`
               )
               .join('\n');

            pushBot(
               `Mingalarba! Please choose an event by number:\n\n${eventText}`
            );
         } catch (e) {
            setError('Failed to load active events.');
         } finally {
            setIsBotTyping(false);
         }
      };

      init();
   }, []);

   const handleChooseEvent = async (prompt: string) => {
      const selected = Number(prompt.trim());
      if (
         Number.isNaN(selected) ||
         selected < 1 ||
         selected > activeEvents.length
      ) {
         pushBot('Please choose a valid event number.');
         return;
      }

      const event = activeEvents[selected - 1];

      const now = new Date();
      const closeAt = event.preOrderClose
         ? new Date(event.preOrderClose)
         : null;

      if (closeAt && now > closeAt) {
         pushBot(
            `Pre-order is already closed for ${event.name}. Please choose another event.`
         );
         setPhase('choose_event');
         return;
      }

      setSelectedEvent(event);

      const eventDate = new Date(event.eventDate).toLocaleDateString('en-NZ', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
      });

      pushBot(
         `You selected: ${event.name}\n\nEvent Info: ${event.eventInfo ?? 'no info'}\n\nLocation: ${event.location}\n\nDate: ${eventDate}\n\nWould you like to see the menu? (yes/no)`
      );

      setPhase('show_menu');
   };

   const handleShowMenu = async (prompt: string) => {
      const lowered = prompt.toLowerCase().trim();
      if (lowered !== 'yes') {
         pushBot('Okay. You can choose another event number.');
         setPhase('choose_event');
         return;
      }

      const { data } = await axios.get<ActiveMenuItemsResponse>(
         API.menuByEvent(selectedEvent.id)
      );
      const available = data.menuItems.filter(
         (m) => !m.isSoldOut && m.stockQty > 0
      );

      if (!available.length) {
         pushBot(
            `You selected: ${selectedEvent.name}\n\nThis event has no available menu yet. Please choose another event number.`
         );
         setPhase('choose_event'); // keep user in event selection
         return;
      }

      setMenuItems(available);
      setDraftOrder((prev) => ({ ...prev, eventId: selectedEvent.id }));
      setPhase('choose_items');

      // const menuText = available
      //    .map((m) => `${m.name} - $${m.price} (stock: ${m.stockQty})`)
      //    .join('\n');

      const grouped = {
         DRINK: [] as MenuItemDto[],
         DESSERT: [] as MenuItemDto[],
         MAIN_DISH: [] as MenuItemDto[],
         SNACK: [] as MenuItemDto[],
      };

      for (const item of available) {
         if (grouped[item.category as keyof typeof grouped]) {
            grouped[item.category as keyof typeof grouped].push(item);
         }
      }

      const section = (title: string, items: MenuItemDto[]) =>
         items.length
            ? `**${title}**\n` +
              items
                 .map(
                    (m, i) =>
                       `${i + 1}. ${m.name} — $${m.price} (stock: ${m.stockQty})`
                 )
                 .join('\n')
            : '';

      const menuText = [
         section('Main Dishes', grouped.MAIN_DISH),
         section('Snacks', grouped.SNACK),
         section('Desserts', grouped.DESSERT),
         section('Drinks', grouped.DRINK),
      ]
         .filter(Boolean)
         .join('\n\n');

      setPhase('choose_items');
      pushBot(
         `${selectedEvent.name}\n\nMenu:\n\n${menuText}\n\nType items like: "2 Chicken curry puff, 1 Durian bubble tea"`
      );
   };

   const getDraftTotal = (items: DraftOrderItem[]) =>
      items.reduce((sum, item) => sum + item.subtotal, 0);

   const formatMoney = (n: number) => `$${n.toFixed(2)}`;

   const showDraftSummary = (items = draftOrder.items) => {
      if (!items.length) {
         pushBot('Your cart is empty. Please add items.');
         return;
      }

      const lines = items.map(
         (item, idx) =>
            `${idx + 1}. ${item.name} (${formatMoney(item.unitPrice)}) x ${item.quantity} — ${formatMoney(item.subtotal)}`
      );

      const total = items.reduce((sum, item) => sum + item.subtotal, 0);

      pushBot(
         `Your order now includes:\n\n${lines.join('\n')}\n\nTotal: ${formatMoney(total)}`
      );
   };

   // const parseItemsFromText = (prompt: string, menu: MenuItemDto[]) => {
   //    const parts = prompt
   //       .split(',')
   //       .map((p) => p.trim())
   //       .filter(Boolean);

   //    const result: DraftOrderItem[] = [];

   //    for (const part of parts) {
   //       const match = part.match(/^(\d+)\s+(.+)$/i);
   //       if (!match) continue;

   //       const quantity = Number(match[1]);
   //       const nameInput = match[2].toLowerCase();

   //       const menuItem = menu.find((m) =>
   //          m.name.toLowerCase().includes(nameInput)
   //       );
   //       if (!menuItem) continue;
   //       if (quantity <= 0) continue;

   //       result.push({
   //          menuItemId: menuItem.id,
   //          name: menuItem.name,
   //          quantity,
   //          unitPrice: menuItem.price,
   //          subtotal: menuItem.price * quantity,
   //       });
   //    }

   //    return result;
   // };

   // const mergeItems = (
   //    oldItems: DraftOrderItem[],
   //    newItems: DraftOrderItem[]
   // ) => {
   //    const map = new Map<number, DraftOrderItem>();

   //    for (const i of oldItems) map.set(i.menuItemId, { ...i });
   //    for (const i of newItems) {
   //       const existing = map.get(i.menuItemId);
   //       if (!existing) map.set(i.menuItemId, i);
   //       else {
   //          const qty = existing.quantity + i.quantity;
   //          map.set(i.menuItemId, {
   //             ...existing,
   //             quantity: qty,
   //             subtotal: qty * existing.unitPrice,
   //          });
   //       }
   //    }

   //    return Array.from(map.values());
   // };

   const handleChooseItems = async (prompt: string) => {
      const lowered = prompt.toLowerCase().trim();
      const normalized = lowered.replace(/\s+/g, ' ');

      const isCheckout = normalized === 'done' || normalized === 'checkout';
      const isConfirm = [
         'confirm',
         'confirm items',
         'yes',
         'ok',
         'proceed',
      ].includes(normalized);

      if (isCheckout || isConfirm) {
         if (!draftOrder.items.length) {
            pushBot('Your cart is empty. Please add at least one item first.');
            return;
         }
         setPhase('collect_profile');
         pushBot(
            'Please provide your name and phone like: Sandar, 02902266326'
         );
         return;
      }

      if (!menuItems.length) {
         pushBot(
            'No menu items available for this event yet. Please choose another event.'
         );
         setPhase('choose_event');
         return;
      }

      type ExtractedOp = {
         name: string;
         quantity: number;
         action?: 'add' | 'set' | 'remove';
      };

      type ExtractOrderResponse = {
         items: ExtractedOp[];
         note?: string;
      };

      const normalize = (s: string) =>
         s.toLowerCase().replace(/\s+/g, ' ').trim();

      const findBestMenuMatch = (opName: string, menu: MenuItemDto[]) => {
         const q = normalize(opName);

         const exact = menu.find((m) => normalize(m.name) === q);
         if (exact) return exact;

         const starts = menu.find((m) => normalize(m.name).startsWith(q));
         if (starts) return starts;

         const contains = menu
            .filter((m) => {
               const n = normalize(m.name);
               return n.includes(q) || q.includes(n);
            })
            .sort(
               (a, b) => normalize(b.name).length - normalize(a.name).length
            );

         return contains[0];
      };

      const applyOps = (
         current: DraftOrderItem[],
         ops: ExtractedOp[],
         menu: MenuItemDto[]
      ): { updatedItems: DraftOrderItem[]; unmatched: string[] } => {
         const map = new Map<number, DraftOrderItem>(
            current.map((i) => [i.menuItemId, { ...i }])
         );

         const unmatched: string[] = [];

         for (const op of ops) {
            if (!op?.name?.trim()) continue;

            const matched = findBestMenuMatch(op.name, menu);
            if (!matched) {
               unmatched.push(op.name);
               continue;
            }

            const existing = map.get(matched.id);
            const currentQty = existing?.quantity ?? 0;
            const action = (op.action ?? 'add').toLowerCase() as
               'add' | 'set' | 'remove';

            const safeQty = Number.isFinite(op.quantity)
               ? Math.max(0, op.quantity)
               : 1;

            let nextQty = currentQty;
            if (action === 'add') nextQty = currentQty + (safeQty || 1);
            if (action === 'set') nextQty = safeQty;
            if (action === 'remove') nextQty = 0;

            if (nextQty <= 0) {
               map.delete(matched.id);
               continue;
            }

            map.set(matched.id, {
               menuItemId: matched.id,
               name: matched.name,
               quantity: nextQty,
               unitPrice: matched.price,
               subtotal: matched.price * nextQty,
            });
         }

         return { updatedItems: Array.from(map.values()), unmatched };
      };

      try {
         const { data } = await axios.post<ExtractOrderResponse>(
            API.extractOrder,
            {
               prompt,
               menuItems: menuItems.map((m) => m.name),
            }
         );

         if (!data.items || data.items.length === 0) {
            pushBot('I could not understand items. Please try again.');
            return;
         }

         const { updatedItems, unmatched } = applyOps(
            draftOrder.items,
            data.items,
            menuItems
         );

         if (updatedItems.length === 0) {
            if (unmatched.length) {
               pushBot(
                  `There is no such item in current menu: ${unmatched.join(', ')}`
               );
            } else {
               pushBot('Your cart is empty now. Please add items.');
            }
            setDraftOrder((prev) => ({
               ...prev,
               items: [],
               note: data.note ?? prev.note,
            }));
            return;
         }

         if (unmatched.length) {
            pushBot(
               `These items are not in current menu: ${unmatched.join(', ')}`
            );
         }

         setDraftOrder((prev) => ({
            ...prev,
            items: updatedItems,
            note: data.note ?? prev.note,
         }));

         showDraftSummary(updatedItems);
         pushBot('Please confirm or add more items.');
      } catch (error) {
         console.error(error);
         pushBot('I could not process your order update. Please try again.');
      }
   };

   const handleCollectProfile = async (prompt: string) => {
      const [nameRaw, phoneRaw] = prompt.split(',').map((x) => x?.trim() ?? '');
      if (!nameRaw || !phoneRaw) {
         pushBot('Please provide: Name, Phone');
         return;
      }

      // Validate phone number format
      const digits = phoneRaw.replace(/[\s\-().]/g, '');
      if (digits.length < 7 || digits.length > 15 || !/^\+?\d+$/.test(digits)) {
         pushBot(
            'That does not look like a valid phone number. Please enter a valid phone number (e.g. 021 123 456).'
         );
         return;
      }

      setDraftOrder((prev) => ({
         ...prev,
         customer: { name: nameRaw, phone: phoneRaw },
      }));
      setPhase('confirm');

      const total = getDraftTotal(draftOrder.items);
      pushBot(
         `Please confirm your order.\nItems: ${draftOrder.items.length}\nTotal: $${total}\nReply: yes or no`
      );
   };

   const handleConfirm = async (prompt: string) => {
      const lowered = prompt.toLowerCase().trim();
      if (lowered !== 'yes') {
         pushBot('No problem. You can continue editing items.');
         setPhase('choose_items');
         return;
      }

      if (!draftOrder.eventId) {
         pushBot('Event is missing. Please choose event again.');
         setPhase('choose_event');
         return;
      }

      const payload = {
         eventId: draftOrder.eventId,
         customer: draftOrder.customer,
         items: draftOrder.items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
         })),
         note: draftOrder.note || '',
      };

      const { data } = await axios.post<OrderCreateResponse>(
         API.createOrder,
         payload
      );
      setPlacedOrder(data);
      setPhase('placed');

      pushBot(
         `Kyay Zu Bar! Your order number is ${data.orderNumber}.
Event: ${data.event?.name ?? selectedEvent?.name ?? 'Event'}
Event Date: ${data.event?.eventDate ? new Date(data.event.eventDate).toLocaleDateString('en-NZ') : selectedEvent?.eventDate ? new Date(selectedEvent.eventDate).toLocaleDateString('en-NZ') : 'N/A'}
${data.event?.pickupInfo ? `Pickup Info: ${data.event.pickupInfo}\n` : ''}${
            data.event?.paymentInfo
               ? `Payment Information:\n${data.event.paymentInfo}\n`
               : `Payment Information
- Contact: Sandar (xxxxxxxx), Rolex (xxxxxxxxx)
- FB page: @xxxxxxxxx
- FB link: https://www.facebook.com/xxxxxxxx
`
         }
Please use your order number (${data.orderNumber}) in the payment remark.
Total: $${data.total}
Status: ${data.status}`
      );
   };

   const onSubmit = async ({ prompt }: ChatFormData) => {
      try {
         //   console.log(data);
         // setMessages([...messages, prompt]); // e.g ["What is the city of New Zealand?"]
         // setMessages((prev) => [...prev, { content: prompt, role: 'user' }]);
         pushUser(prompt);
         setIsBotTyping(true);
         setError('');
         // reset({ prompt: '' });

         popAudio.play();

         if (phase === 'choose_event') {
            await handleChooseEvent(prompt);
            return;
         }

         if (phase === 'show_menu') {
            await handleShowMenu(prompt);
            return;
         }

         if (phase === 'choose_items') {
            await handleChooseItems(prompt);
            return;
         }

         if (phase === 'collect_profile') {
            await handleCollectProfile(prompt);
            return;
         }

         if (phase === 'confirm') {
            await handleConfirm(prompt);
            return;
         }

         const { data } = await axios.post<ChatResponse>(API.chat, {
            prompt: prompt,
            conversationId: conversationId.current,
         });
         // setMessages([...messages, data.message]); // overwritting // e.g. ["Wellington is the capital city of New Zealand."]
         // setMessages((prev) => [
         //    ...prev,
         //    { content: data.message, role: 'bot' },
         // ]);
         pushBot(data.message);
         // setIsBotTyping(false);

         notificationAudio.play();
      } catch (error) {
         console.error(error);
         setError('Failed to send message. Please try again.');
      } finally {
         setIsBotTyping(false);
      }
   };

   return (
      <div className="flex flex-col h-full">
         <div className="flex flex-col flex-1 gap-3 mb-10 overflow-y-auto">
            <ChatMessages messages={messages} />
            {isBotTyping && <TypingIndicator />}
            {error && <p className="text-red-500">{error}</p>}
         </div>

         <ChatInput onSubmit={onSubmit} />
      </div>
   );
};

export default ChatBot;
