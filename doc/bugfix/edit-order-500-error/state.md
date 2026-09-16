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
