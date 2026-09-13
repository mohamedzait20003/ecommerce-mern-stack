-- ============================================================================
-- Module: inventory
-- Stock levels, reservations, movement ledger.
--
-- Reservations are what make an agentic checkout safe. When the chat agent adds
-- an item to a cart it takes a HELD reservation with an expiry; the order flow
-- promotes it to COMMITTED. Without this, an agent that pauses for a user
-- confirmation can happily sell the same last unit twice.
-- ============================================================================

CREATE TABLE inventory_items (
    variant_id         uuid PRIMARY KEY
        REFERENCES product_variants(id) ON DELETE CASCADE,   -- crosses into: catalog
    -- Numeric, not integer: a shelf holds 12.400 kg of loose apples as readily
    -- as it holds 12 tins, and a deli pick takes 0.540 of a pound off it.
    quantity_on_hand   numeric(12,3) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved  numeric(12,3) NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    reorder_level      integer     NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    -- allow selling into negative stock (backorder) for this variant
    allow_backorder    boolean     NOT NULL DEFAULT false,
    updated_at         timestamptz NOT NULL DEFAULT now(),

    -- You can never reserve more than you hold, unless backorder is permitted.
    CONSTRAINT ck_inventory_not_oversold
        CHECK (allow_backorder OR quantity_reserved <= quantity_on_hand)
);

CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sellable quantity, as the agent should read it before promising anything.
CREATE VIEW inventory_available AS
SELECT variant_id,
       quantity_on_hand,
       quantity_reserved,
       quantity_on_hand - quantity_reserved AS quantity_available,
       allow_backorder
FROM   inventory_items;

-- --------------------------------------------------------- reservations -----
CREATE TABLE inventory_reservations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id  uuid        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity    numeric(12,3) NOT NULL CHECK (quantity > 0),
    -- what the hold is for: a cart line first, an order once placed
    owner_type  varchar(16) NOT NULL CHECK (owner_type IN ('CART', 'ORDER')),
    owner_id    uuid        NOT NULL,
    status      varchar(16) NOT NULL DEFAULT 'HELD'
        CHECK (status IN ('HELD', 'COMMITTED', 'RELEASED', 'EXPIRED')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    -- HELD reservations past this point are swept back into available stock
    expires_at  timestamptz,
    released_at timestamptz
);

CREATE INDEX ix_reservations_owner   ON inventory_reservations (owner_type, owner_id);
CREATE INDEX ix_reservations_variant ON inventory_reservations (variant_id) WHERE status = 'HELD';
CREATE INDEX ix_reservations_sweep   ON inventory_reservations (expires_at) WHERE status = 'HELD';

-- ------------------------------------------------------ movement ledger -----
-- Append-only. Every change to quantity_on_hand should land here so stock is
-- reconstructable and an agent-driven mistake is traceable.
CREATE TABLE stock_movements (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id    uuid        NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    -- signed: positive on restock/return, negative on fulfilment
    quantity_delta numeric(12,3) NOT NULL CHECK (quantity_delta <> 0),
    reason        varchar(32) NOT NULL
        CHECK (reason IN ('RESTOCK', 'FULFILMENT', 'RETURN', 'ADJUSTMENT', 'DAMAGE')),
    reference_type varchar(16),
    reference_id   uuid,
    actor_type    varchar(16) NOT NULL DEFAULT 'SYSTEM'
        CHECK (actor_type IN ('USER', 'AGENT', 'ADMIN', 'SYSTEM')),
    actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,  -- crosses into: user
    note          text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_stock_movements_variant ON stock_movements (variant_id, created_at DESC);
