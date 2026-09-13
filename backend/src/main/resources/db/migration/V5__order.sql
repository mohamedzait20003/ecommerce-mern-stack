-- ============================================================================
-- Module: order
-- Placed orders, their lines, address snapshots and status history.
--
-- Placing an order takes no money, but it does hold some. The card is authorised
-- at checkout for the basket plus headroom, and captured down to the real figure
-- once a picker has been through the order. Taking only what was actually picked
-- is why a shortfall never becomes a refund. Holding it first is why a dead card
-- fails before anyone has walked the aisles — and why the capture needs no
-- second authentication, since the authorisation already carried it.
--
-- The customer is never asked to approve the total. Where they get a say is
-- earlier and more useful: the picker proposes a substitute at the shelf and
-- they answer it there and then (see V9__fulfilment). By the time the capture
-- runs, every line has already been settled between them.
--
-- The two preconditions the service enforces at placement stand unchanged, and
-- matter more now that a hold is involved: a deliverable address, and an active
-- billing account with a default method that may be charged off-session.
--
-- Two things here exist specifically to survive an agent retrying itself:
--   * orders.idempotency_key — UNIQUE. A "place the order" tool call that runs
--     twice produces one order, not two. This is the single most important
--     constraint in the whole schema for agentic safety.
--   * order_items / order_addresses snapshot names, prices and addresses at
--     placement time, so later edits to catalogue or profile never rewrite
--     history.
-- ============================================================================

CREATE TABLE orders (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- human-facing reference shown in chat: "MM-2026-000123"
    order_number varchar(32)   NOT NULL UNIQUE,
    user_id      uuid          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- crosses into: user
    cart_id      uuid          REFERENCES carts(id) ON DELETE SET NULL,           -- crosses into: cart

    -- Listed in the order they happen in. Money is held early and taken late:
    -- AUTHORIZED is the hold going on at checkout, while the shopper is present;
    -- AWAITING_PAYMENT is the capture running after the pick, when they are not.
    -- PAYMENT_FAILED is a real place an order can come to rest, with the goods
    -- already off the shelf — rarer under a hold, but never impossible.
    status       varchar(24)   NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PLACED', 'AUTHORIZED', 'PROCESSING',
                          'AWAITING_PAYMENT', 'PAID', 'PAYMENT_FAILED',
                          'SHIPPED', 'DELIVERED',
                          'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED')),

    currency        char(3)       NOT NULL DEFAULT 'USD',
    subtotal_amount numeric(19,4) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount      numeric(19,4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount    numeric(19,4) NOT NULL CHECK (total_amount >= 0),
    -- Three figures, and they are all different:
    --
    --   total_amount       the basket as estimated at checkout
    --   authorized_amount  what was actually held on the card — that estimate
    --                      plus headroom for weighed goods that come in over
    --   final_amount       what was captured, once the picker had weighed
    --                      everything and found what they could
    --
    -- final_amount is NOT bounded by the estimate. A pound of mince that turns
    -- out to weigh 1.14 lb legitimately costs more than the basket said. It is
    -- bounded by the hold, because no card network lets you capture above an
    -- authorisation — which is the entire reason for the headroom.
    --
    -- What does not move: a substitute is billed at no more than the line it
    -- replaced, price drift between placement and capture is ours to absorb,
    -- and the delivery fee is the one fixed at placement — a basket that earned
    -- free delivery keeps it even when the picker cannot find half of it.
    authorized_amount numeric(19,4) CHECK (authorized_amount >= 0),
    final_amount      numeric(19,4) CHECK (final_amount >= 0),

    -- How much of what was charged has been given back. With nothing charged
    -- until the order is picked, this is for what goes wrong afterwards — a
    -- refused delivery, damage, goodwill — and never for a shortfall.
    refunded_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),

    -- who placed it: a human at the keyboard, or the chat agent on their behalf
    actor_type   varchar(16)   NOT NULL DEFAULT 'USER'
        CHECK (actor_type IN ('USER', 'AGENT', 'ADMIN', 'SYSTEM')),

    -- Deduplicates retried "place order" tool calls. Null for orders created
    -- through the normal UI, where the browser already guards against this.
    idempotency_key varchar(128) UNIQUE,

    -- What the customer chose and paid for. The fee itself lives in
    -- shipping_amount above; these two say what it bought.
    delivery_speed varchar(16) NOT NULL DEFAULT 'STANDARD'
        CHECK (delivery_speed IN ('STANDARD', 'EXPRESS')),
    -- STANDARD books a two-hour window; EXPRESS is as soon as a driver is free
    -- and so has no window to keep.
    delivery_window_start timestamptz,
    delivery_window_end   timestamptz,

    -- Where it is going. A reference, not a copy: the customer keeps their
    -- addresses in one place and an order names the one it used.
    --
    -- RESTRICT rather than CASCADE or SET NULL, because an address with orders
    -- against it is not something anybody may quietly remove — a delivery has
    -- to be able to say where it went.
    delivery_address_id uuid REFERENCES addresses(id) ON DELETE RESTRICT,  -- crosses into: user

    customer_note text,
    placed_at    timestamptz,
    cancelled_at timestamptz,
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz   NOT NULL DEFAULT now(),

    -- You can only give back what you took.
    CONSTRAINT ck_orders_refund_within_charge CHECK (
        refunded_amount <= COALESCE(final_amount, total_amount)
    ),

    -- The hold has to cover the estimate it was taken against.
    CONSTRAINT ck_orders_authorized_covers_total CHECK (
        authorized_amount IS NULL OR authorized_amount >= total_amount
    ),

    -- Capture less than was held, never more. This is a card-network rule
    -- before it is ours, and breaking it means a declined capture on an order
    -- that is already picked and bagged.
    CONSTRAINT ck_orders_final_within_authorized CHECK (
        final_amount IS NULL
        OR (authorized_amount IS NOT NULL AND final_amount <= authorized_amount)
    ),

    -- Nobody walks the aisles for an order whose card was never held.
    CONSTRAINT ck_orders_authorized_present CHECK (
        status NOT IN ('AUTHORIZED', 'PROCESSING', 'AWAITING_PAYMENT', 'PAID',
                       'PAYMENT_FAILED', 'SHIPPED', 'DELIVERED', 'REFUNDED',
                       'PARTIALLY_REFUNDED')
        OR authorized_amount IS NOT NULL
    ),

    -- Nothing from AWAITING_PAYMENT onward makes sense without knowing the
    -- figure, so the status can never run ahead of the arithmetic.
    CONSTRAINT ck_orders_final_amount_present CHECK (
        status NOT IN ('AWAITING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'SHIPPED',
                       'DELIVERED', 'REFUNDED', 'PARTIALLY_REFUNDED')
        OR final_amount IS NOT NULL
    ),

    -- Express has no window; standard has exactly one, two hours wide. Whether
    -- that window is far enough out (three hours) and inside opening hours
    -- (until 22:00) depends on when the order was placed, so the service checks
    -- it at selection time — but the shape is an invariant and belongs here.
    -- Today or tomorrow, never further out. Written as a duration rather than
    -- a calendar rule because a CHECK cannot call date_trunc on a timestamptz —
    -- that depends on the session timezone and so is not immutable. The exact
    -- rule (today or tomorrow in the store's own timezone, closing at 22:00)
    -- belongs to the service that knows where the store is. This bound does one
    -- more job besides: it keeps every order comfortably inside the lifetime of
    -- the card authorisation taken at checkout.
    CONSTRAINT ck_orders_delivery_horizon CHECK (
        delivery_window_start IS NULL
        OR delivery_window_start <= created_at + interval '48 hours'
    ),

    CONSTRAINT ck_orders_delivery_window CHECK (
        CASE delivery_speed
            WHEN 'EXPRESS' THEN
                delivery_window_start IS NULL AND delivery_window_end IS NULL
            WHEN 'STANDARD' THEN
                delivery_window_start IS NOT NULL
                AND delivery_window_end = delivery_window_start + interval '2 hours'
        END
    )
);

CREATE INDEX ix_orders_user   ON orders (user_id, created_at DESC);
CREATE INDEX ix_orders_status ON orders (status);
CREATE INDEX ix_orders_delivery_address ON orders (delivery_address_id);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------- order items ----
CREATE TABLE order_items (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    -- RESTRICT, not CASCADE: a delisted product must not erase order history
    variant_id uuid          REFERENCES product_variants(id) ON DELETE RESTRICT,

    -- snapshots, so the line reads correctly forever
    sku          varchar(64) NOT NULL,
    product_name text        NOT NULL,
    variant_name text        NOT NULL,

    -- In the variant's selling unit, which the three snapshot columns below pin
    -- down: 2 tins, or 0.500 of a pound of sliced turkey.
    quantity          numeric(12,3) NOT NULL CHECK (quantity > 0),
    unit_price_amount numeric(19,4) NOT NULL CHECK (unit_price_amount >= 0),
    -- An estimate rather than a fact wherever price_by is WEIGHT, until the
    -- picker puts the item on the scale.
    total_amount      numeric(19,4) NOT NULL CHECK (total_amount >= 0),

    -- How the variant was sold and priced, captured at placement so the line
    -- still reads and reprices correctly years later — even if the product is
    -- since re-listed by the piece.
    sell_by    varchar(8) NOT NULL DEFAULT 'EACH'
        CHECK (sell_by  IN ('EACH', 'WEIGHT')),
    price_by   varchar(8) NOT NULL DEFAULT 'EACH'
        CHECK (price_by IN ('EACH', 'WEIGHT')),
    price_unit varchar(4)
        CHECK (price_unit IN ('LB', 'KG', 'OZ', 'G')),
    -- The band as it stood at placement. `max_weight` is what the hold was
    -- computed from and what the capture is capped at, so it has to be the
    -- figure the shopper was quoted — not whatever the catalogue says today.
    min_weight numeric(12,3) CHECK (min_weight > 0),
    max_weight numeric(12,3) CHECK (max_weight > 0),

    -- The rate from products.tax_rate as it stood at placement, and the tax it
    -- produced for this line. Per line, because the basket is taxed per product
    -- — and because a shortfall has to recompute tax on what the picker
    -- actually found, not on what was ordered.
    tax_rate          numeric(5,2)  NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0 AND tax_rate <= 100),
    tax_amount        numeric(19,4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    -- units already sent back; drives partial refunds
    refunded_quantity numeric(12,3) NOT NULL DEFAULT 0 CHECK (refunded_quantity >= 0),
    currency          char(3)       NOT NULL DEFAULT 'USD',

    CONSTRAINT ck_order_items_refund_qty CHECK (refunded_quantity <= quantity),

    -- The same rule the catalogue holds: priced by weight means the unit and
    -- the band are on the record; priced per item means there is nothing to
    -- record. A line cannot be weight-priced and leave the ceiling unstated,
    -- because the ceiling is what the card was held against.
    CONSTRAINT ck_order_items_weight_band CHECK (
        CASE price_by
            WHEN 'WEIGHT' THEN
                price_unit IS NOT NULL
                AND min_weight IS NOT NULL
                AND max_weight IS NOT NULL
                AND max_weight >= min_weight
            ELSE
                price_unit IS NULL
                AND min_weight IS NULL
                AND max_weight IS NULL
        END
    )
);

CREATE INDEX ix_order_items_order ON order_items (order_id);

-- ------------------------------------------------------ address snapshot ----
-- ---------------------------------------------------------- status trail ----
CREATE TABLE order_status_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status varchar(24),
    to_status   varchar(24) NOT NULL,
    reason      text,
    actor_type  varchar(16) NOT NULL DEFAULT 'SYSTEM'
        CHECK (actor_type IN ('USER', 'AGENT', 'ADMIN', 'SYSTEM')),
    actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_order_status_history_order ON order_status_history (order_id, created_at);
