# Learnings

- PocketBase `createRule` sees the record being created, so `habit.user =
  @request.auth.id` blocks logging against someone else's habit. Verified
  against a local 0.40.4, along with refusing a PATCH that changes `user`.
- Client-minted ids: PocketBase accepts `id` on create if it is 15 chars of
  `[a-z0-9]`. A retried create returns 400 (id taken), so sync falls back to update.
