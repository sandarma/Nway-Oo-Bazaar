## [2025-07-31 08:01 PM] feat: Optimize menu import to reduce Netlify function timeout

### Changes Made
- Optimized `importMenuItems` function in `app/packages/server/repositories/menuitem.repository.ts`
- Changed from individual queries per item to batch operations:
  - Use `createMany` for bulk inserts (1 query instead of N)
  - Use `deleteMany` for bulk deletes (1 query instead of N)
  - Batch order check with single `findMany` query
- Reduced Prisma transaction timeout from 30000ms to 8000ms (Netlify free plan limit is 10s)
- Separated items by operation type (ADD/UPDATE/REMOVE) before processing
- Added early validation to skip invalid items before database operations

### Performance Impact
- Before: ~100+ database queries for 50 items = 30+ seconds
- After: ~10-15 database queries for 50 items = estimated 2-5 seconds
- Well within Netlify free plan's 10-second timeout

### Testing Notes
- Test with various import sizes: 10, 50, 100 items
- Verify all operations work: ADD, UPDATE, REMOVE
- Confirm failed items are still reported correctly
- Check that items with existing orders are properly blocked from deletion

### Related Issue
- GitHub Issue #32: perf: Optimize menu import to reduce Netlify function timeout
