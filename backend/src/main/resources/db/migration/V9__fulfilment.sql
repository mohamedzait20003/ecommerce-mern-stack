-- ============================================================================
-- Module: fulfilment
-- Picking and delivery — the human half of an order.
--
-- Split from `order` on purpose. An order is the commercial record: what was
-- agreed, what was charged, what is owed back. Fulfilment is the work of making
-- it happen, and it has its own actors, its own failures and its own history.
-- The order says a two-hour window was bought; this module says who walked the
-- shelves, what they could not find, who drove it, and whether anyone answered
-- the door.
--
-- One store, so there is one picking task and one delivery per order — no split
-- shipments, no warehouse routing. Both tables carry a UNIQUE on order_id to
-- keep it that way.
--
-- Stock is read and written HERE, not at checkout and not at payment. A cart
-- holds nothing and payment moves nothing, so the first time anyone asks
-- whether the goods exist is when a picker reaches the shelf. A shortfall is an
-- ordinary outcome of that question, not an error.
--
-- The customer is in the loop here and nowhere else. When a line comes up short
-- the picker proposes a substitute from the aisle and the customer answers it
-- on the spot, so by the time the pick is confirmed everything they are about
-- to be charged for has already been agreed between them. Nothing later asks
-- them to approve a total; the charge runs off-session.
-- ============================================================================

-- --------------------------------------------------------- picking tasks -----
CREATE TABLE picking_tasks (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,  -- crosses into: order
    picker_id   uuid REFERENCES users(id) ON DELETE SET NULL,               -- crosses into: user
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,               -- the moderator

    status varchar(16) NOT NULL DEFAULT 'UNASSIGNED'
        CHECK (status IN ('UNASSIGNED', 'ASSIGNED', 'PICKING', 'PICKED', 'CANCELLED')),

    note text,

    assigned_at  timestamptz,
    started_at   timestamptz,
    completed_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),

    -- A task cannot be assigned to nobody, nor claim to be unassigned while
    -- somebody holds it.
    CONSTRAINT ck_picking_tasks_assignment CHECK (
        (status = 'UNASSIGNED' AND picker_id IS NULL)
        OR (status <> 'UNASSIGNED' AND picker_id IS NOT NULL)
    )
);

-- The queue a picker pulls from, and the board a moderator watches.
CREATE INDEX ix_picking_tasks_open   ON picking_tasks (status, created_at)
    WHERE status IN ('UNASSIGNED', 'ASSIGNED', 'PICKING');
CREATE INDEX ix_picking_tasks_picker ON picking_tasks (picker_id, status);

CREATE TRIGGER trg_picking_tasks_updated_at
    BEFORE UPDATE ON picking_tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------- picked items -----
-- What actually came off the shelf, per ordered line. This is the record that
-- explains a partial refund months later, so it stores the outcome even when
-- the outcome was "nothing".
CREATE TABLE picked_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    picking_task_id uuid NOT NULL REFERENCES picking_tasks(id) ON DELETE CASCADE,
    order_item_id   uuid NOT NULL REFERENCES order_items(id)   ON DELETE CASCADE,  -- crosses into: order

    outcome varchar(16) NOT NULL
        CHECK (outcome IN ('FULL', 'SHORT', 'UNAVAILABLE', 'SUBSTITUTED')),

    -- In the line's selling unit; zero when the shelf was empty.
    quantity_picked numeric(12,3) NOT NULL DEFAULT 0 CHECK (quantity_picked >= 0),

    -- What the scale said. Only meaningful on a line priced by weight, and on a
    -- catch-weight line it is the whole story: the shopper took one chicken, and
    -- this is what that one chicken turned out to cost them. Null for anything
    -- both sold and priced by the piece.
    weight_picked   numeric(12,3) CHECK (weight_picked > 0),

    -- A substitution is a different variant at a different price, which is why
    -- it cannot be expressed as a refund of the original line.
    substitute_variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT,  -- crosses into: catalog
    substitute_unit_price_amount numeric(19,4) CHECK (substitute_unit_price_amount >= 0),

    -- The customer's answer, given while the picker is still standing at the
    -- shelf. This is their only say in what they are charged, so a proposal
    -- that goes unanswered has to resolve by itself — a picker cannot wait in
    -- the aisle indefinitely. TIMED_OUT leaves the line unavailable rather than
    -- quietly putting something they did not choose into the bag.
    substitute_status varchar(16)
        CHECK (substitute_status IN ('PROPOSED', 'APPROVED', 'REJECTED', 'TIMED_OUT')),
    substitute_proposed_at timestamptz,
    substitute_decided_at  timestamptz,

    note       text,
    picked_at  timestamptz NOT NULL DEFAULT now(),

    -- One verdict per line.
    UNIQUE (picking_task_id, order_item_id),

    -- A proposal names what was proposed, and no proposal names nothing. Keeps
    -- a stray variant id from ever reading as a swap that was offered.
    CONSTRAINT ck_picked_items_proposal CHECK (
        (substitute_status IS NULL
         AND substitute_variant_id IS NULL
         AND substitute_unit_price_amount IS NULL)
        OR
        (substitute_status IS NOT NULL
         AND substitute_variant_id IS NOT NULL
         AND substitute_unit_price_amount IS NOT NULL)
    ),

    -- Only a swap the customer approved goes in the bag. One they refused, or
    -- never answered, leaves the line unavailable — but on the record, which is
    -- the whole point of keeping it.
    CONSTRAINT ck_picked_items_substitute CHECK (
        CASE outcome
            WHEN 'SUBSTITUTED' THEN
                substitute_status = 'APPROVED' AND quantity_picked > 0
            WHEN 'UNAVAILABLE' THEN
                quantity_picked = 0
                AND (substitute_status IS NULL OR substitute_status <> 'APPROVED')
            ELSE
                substitute_status IS NULL
        END
    )
);

CREATE INDEX ix_picked_items_task ON picked_items (picking_task_id);

-- What a customer is being asked right now, and what a picker is waiting on.
CREATE INDEX ix_picked_items_awaiting ON picked_items (substitute_proposed_at)
    WHERE substitute_status = 'PROPOSED';

-- ------------------------------------------------------------ deliveries -----
CREATE TABLE deliveries (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,  -- crosses into: order

    driver_id   uuid REFERENCES users(id) ON DELETE SET NULL,               -- crosses into: user
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,               -- the moderator

    status varchar(16) NOT NULL DEFAULT 'UNASSIGNED'
        CHECK (status IN ('UNASSIGNED', 'ASSIGNED', 'COLLECTED', 'IN_TRANSIT',
                          'DELIVERED', 'FAILED', 'RETURNED')),

    -- Copied from the order at dispatch rather than joined at read time: the
    -- window the driver is held to is the one that was promised, even if the
    -- order is edited afterwards.
    promised_window_start timestamptz,
    promised_window_end   timestamptz,

    -- Who actually took it, for the doorstep record.
    received_by text,
    proof_note  text,

    -- Copied from the order at dispatch. A driver cannot look this up — by then
    -- the basket is a sealed bag — so whether anything inside it needs an age
    -- check has to travel with the delivery.
    age_check_required boolean NOT NULL DEFAULT false,
    id_verified_at     timestamptz,

    assigned_at  timestamptz,
    collected_at timestamptz,
    delivered_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_deliveries_assignment CHECK (
        (status = 'UNASSIGNED' AND driver_id IS NULL)
        OR (status <> 'UNASSIGNED' AND driver_id IS NOT NULL)
    ),

    -- A delivered row must say when. Anything else must not claim a time.
    CONSTRAINT ck_deliveries_delivered_at CHECK (
        (status = 'DELIVERED' AND delivered_at IS NOT NULL)
        OR (status <> 'DELIVERED' AND delivered_at IS NULL)
    ),

    -- Age-restricted goods are never handed over unchecked.
    CONSTRAINT ck_deliveries_age_check CHECK (
        NOT age_check_required
        OR status <> 'DELIVERED'
        OR id_verified_at IS NOT NULL
    )
);

CREATE INDEX ix_deliveries_open   ON deliveries (status, promised_window_start)
    WHERE status IN ('UNASSIGNED', 'ASSIGNED', 'COLLECTED', 'IN_TRANSIT');
CREATE INDEX ix_deliveries_driver ON deliveries (driver_id, status);

CREATE TRIGGER trg_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------ delivery attempts ----
-- Append-only. Nobody answering the door is not a failed delivery, it is one
-- failed attempt, and the difference matters both to the customer and to the
-- driver's record.
CREATE TABLE delivery_attempts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id uuid    NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    attempt_no  integer NOT NULL CHECK (attempt_no > 0),

    driver_id uuid REFERENCES users(id) ON DELETE SET NULL,                 -- crosses into: user

    outcome varchar(24) NOT NULL
        CHECK (outcome IN ('DELIVERED', 'NO_ANSWER', 'REFUSED',
                           'ADDRESS_PROBLEM', 'RESCHEDULED')),

    note        text,
    occurred_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (delivery_id, attempt_no)
);

CREATE INDEX ix_delivery_attempts_delivery ON delivery_attempts (delivery_id, attempt_no);
