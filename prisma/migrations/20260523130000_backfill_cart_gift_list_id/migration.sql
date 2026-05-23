-- Heal PAID carts whose gift_list_id was nulled out by the empty-cart branch of
-- removeFromCart (now guarded against, but historic orphan rows still need fixing
-- so they show up in analytics reports).
--
-- We can only recover the gift list from the cart's items. If a cart has items, we
-- copy gift_list_id from the first item's gift. Carts whose items were also deleted
-- are genuinely unrecoverable from current data and are left alone.
UPDATE "carts" c
SET "gift_list_id" = g."gift_list_id"
FROM "cart_items" ci
JOIN "gifts" g ON g.id = ci.gift_id
WHERE c."gift_list_id" IS NULL
  AND c.status = 'PAID'
  AND ci.cart_id = c.id
  AND ci.id = (
    SELECT MIN(id) FROM "cart_items" WHERE cart_id = c.id
  );
