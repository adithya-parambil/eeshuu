# Socket Debug: Fix Delivery Pool Join Issue

## Plan Status: ✅ Approved by user

**Breakdown:**
1. ~~[x]~~ Read key files (useOrderSocket, order.namespace.ts, delivery.store.ts) ✓
2. ~~[x]~~ Confirm issue: Delivery not in "delivery:pool" room → no v1:ORDER:NEW received
3. [ ] Add debug logs to 3 files
4. [ ] Restart services  
5. [ ] Test: Place order → check instant delivery + logs
6. [ ] Remove debug logs after fix verified
7. [ ] attempt_completion

**Current Step:** 3/7 - Add debug logging

