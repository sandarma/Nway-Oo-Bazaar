## [2026-09-16 10:15 AM] feat: Fix timezone bugs, add payment mode to edit order, auto-scroll pagination, sold out items analytics

### Issues Resolved

- **#38** — Event date off by 1 day (timezone bug) + wrong export date in CSV
- **#36** — Payment mode field in Edit Order popup
- **#37** — Auto-scroll to top on pagination click
- **#35** — Sold Out Items table in dashboard analytics

### Changes

#### #38 — Timezone Fix

- **EventsPage.tsx**: Fixed event date display to parse UTC strings correctly (`event.eventDate + 'Z'` with `timeZone: 'Pacific/Auckland'`)
- **EventsPage.tsx**: Fixed form submission to send raw datetime-local value instead of `toISOString()` (which was converting local time to UTC, causing 1-day shift)
- **export.service.ts**: Changed `formatDate` from `en-US` locale to `en-NZ` with `timeZone: 'Pacific/Auckland'` to fix CSV export dates

#### #36 — Payment Mode in Edit Order

- **order.controller.ts**: Added `paymentMode` to `updateOrderRequestSchema` and passed it to service
- **order.service.ts**: Added `paymentMode` parameter to `updateOrderByOrderNo`
- **order.repository.ts**: Added `paymentMode` to `updateOrderByOrderNoWithStock` and included it in the order update
- **OrdersPage.tsx**: Added payment mode state, dropdown UI, and included it in save payload

#### #37 — Auto-scroll Pagination

- **OrdersPage.tsx**: Added `useEffect` that scrolls to top smoothly when `page` search param changes

#### #35 — Sold Out Items Analytics

- **dashboard.repository.ts**: Added `soldOutItems` query — fetches menu items where `isSoldOut: true` with sold quantity from orders
- **AnalyticsPage.tsx**: Added `soldOutItems` to Analytics interface and rendered a new "Sold Out Items" card showing name, qty sold, and stock
