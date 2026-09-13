-- ============================================================================
-- Module: cart
-- Active shopping carts and their lines.
--
-- Line prices are SNAPSHOTTED at add time. If the catalogue price moves while a
-- cart sits open, the shopper still sees what they were quoted, and the agent
-- can detect the drift and say so rather than silently repricing.
-- ============================================================================

CREATE TABLE carts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- null for a guest cart, claimed on sign-in
    user_id    uuid        REFERENCES users(id) ON DELETE CASCADE,   -- crosses into: user
    session_id uuid        REFERENCES sessions(id) ON DELETE SET NULL,
    status     varchar(16) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'CONVERTED', 'ABANDONED', 'MERGED')),
    currency   char(3)     NOT NULL DEFAULT 'USD',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    converted_at timestamptz
);

-- One active cart per signed-in user; guests are keyed by session instead.
CREATE UNIQUE INDEX ux_carts_active_user
    ON carts (user_id) WHERE status = 'ACTIVE' AND user_id IS NOT NULL;

CREATE INDEX ix_carts_session ON carts (session_id) WHERE status = 'ACTIVE';
CREATE INDEX ix_carts_sweep   ON carts (expires_at) WHERE status = 'ACTIVE';

CREATE TRIGGER trg_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------ cart items ----
CREATE TABLE cart_items (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id      uuid          NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id   uuid          NOT NULL
        REFERENCES product_variants(id) ON DELETE RESTRICT,          -- crosses into: catalog
    -- In the variant's selling unit: 2 tins, or 0.500 of a pound of turkey.
    quantity     numeric(12,3) NOT NULL CHECK (quantity > 0),
    -- price as quoted when the line was added, not the live catalogue price
    unit_price_amount numeric(19,4) NOT NULL CHECK (unit_price_amount >= 0),
    currency     char(3)       NOT NULL DEFAULT 'USD',
    -- who put this line here: a human clicking, or the chat agent
    actor_type   varchar(16)   NOT NULL DEFAULT 'USER'
        CHECK (actor_type IN ('USER', 'AGENT', 'ADMIN', 'SYSTEM')),
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz   NOT NULL DEFAULT now(),

    -- Adding the same variant twice bumps quantity instead of duplicating.
    UNIQUE (cart_id, variant_id)
);

CREATE INDEX ix_cart_items_cart ON cart_items (cart_id);

CREATE TRIGGER trg_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
