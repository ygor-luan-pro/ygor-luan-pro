ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_id_key;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS unique_payment_id;

ALTER TABLE orders
  ADD CONSTRAINT unique_payment_id UNIQUE (payment_id);
