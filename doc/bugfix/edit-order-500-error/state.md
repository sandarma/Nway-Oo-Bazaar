## [2026-09-16 12:30 PM] Bugfix: Fix timezone issue in Edit Order pre-order close comparison

### Problem
In the Edit Order popup, the pre-order close date comparison was using `new Date(order.event.preOrderClose)` without appending 'Z'. When the API returns a date string like `2026-09-18T23:00` (without timezone suffix), JavaScript interprets it as local time. For NZ timezone (+12), this causes a 1-day shift, making the pre-order appear to close one day earlier than it actually does.

### Fix
Added 'Z' suffix check before parsing the date, same pattern used in EventsPage:
```typescript
const preOrderCloseDate = order.event.preOrderClose.endsWith('Z')
   ? order.event.preOrderClose
   : order.event.preOrderClose + 'Z';
const isClosed = new Date() > new Date(preOrderCloseDate);
```

### Files Changed
- `app/packages/client/src/pages/dashboard/OrdersPage.tsx` — Fixed pre-order close date comparison timezone handling

---

## [2026-09-16 12:20 PM] Bugfix: Fix 500 error on Edit Order save

### Problem
`PATCH /api/orders/:orderNumber` returns 500 Internal Server Error when saving changes in the Edit Order popup on production.

### Root Cause
The customer update condition in `order.repository.ts` only checked for `undefined`:
```typescript
if (customerName !== undefined || customerPhone !== undefined)
```
When the frontend sends `null` (cleared field) or empty strings, these pass the `!== undefined` check. Prisma then tries to set `phone: null` or `phone: ""` on a required `String` field, causing a database constraint violation → 500 error.

### Fix
Changed to filter for truthy values and only update when there's valid data:
```typescript
const customerUpdate: Record<string, string> = {};
if (customerName && customerName.trim())
   customerUpdate.name = customerName.trim();
if (customerPhone && customerPhone.trim())
   customerUpdate.phone = customerPhone.trim();
if (Object.keys(customerUpdate).length > 0) {
   await tx.customer.update({...});
}
```

### Files Changed
- `app/packages/server/repositories/order.repository.ts` — Fixed customer update condition to handle null/empty string values safely

### Testing
- TypeScript type check: ✅ passed (both server and client)
- Lint: ✅ passed (only pre-existing warnings)
