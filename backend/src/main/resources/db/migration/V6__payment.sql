-- ============================================================================
-- Module: payment
-- Billing accounts, stored methods, payment attempts, refunds, webhook log.
--
-- Money moves late. Checkout takes no payment at all: the customer sets up a
-- billing account once from settings, and the saved method is charged
-- off-session once the pick is confirmed, for what is actually going out. The
-- failure to design around is therefore not the refund — there isn't one — it
-- is the charge that declines when the goods are already picked and staged.
--
-- Nothing here ever stores a raw card number. `provider_token` is the vault
-- reference handed back by Stripe/Adyen/etc; brand + last4 exist only so the
-- chat agent can say "your Visa ending 4242" without touching PAN data.
-- ============================================================================

-- ------------------------------------------------------ billing accounts ----
-- The customer's identity at the provider — a Stripe Customer — created once
-- from account settings, long before any order exists. Every stored method
-- hangs off it, and every charge is made against it.
--
-- It earns its own table because this flow bills off-session: by the time the
-- card is charged the customer is not at the keyboard, so there is nobody there
-- to answer a 3-D Secure challenge. Setting the account up while they *are*
-- present is what makes the later charge possible.
CREATE TABLE billing_accounts (
    id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- crosses into: user

    provider varchar(32) NOT NULL DEFAULT 'STRIPE',
    -- Stripe's "cus_..."; a reference, never card data
    provider_customer_id text NOT NULL,

    status varchar(16) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- One account per user per provider, and a provider id belongs to one user.
    UNIQUE (user_id, provider),
    UNIQUE (provider, provider_customer_id)
);

CREATE INDEX ix_billing_accounts_user ON billing_accounts (user_id);

CREATE TRIGGER trg_billing_accounts_updated_at
    BEFORE UPDATE ON billing_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------- payment methods ----
CREATE TABLE payment_methods (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- crosses into: user
    billing_account_id uuid    NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
    provider       varchar(32) NOT NULL,
    -- vault reference at the provider; never card data
    provider_token text        NOT NULL,
    method_type    varchar(24) NOT NULL
        CHECK (method_type IN ('CARD', 'WALLET', 'BANK_TRANSFER', 'CASH_ON_DELIVERY')),
    brand          varchar(32),
    last4          char(4),
    exp_month      smallint CHECK (exp_month BETWEEN 1 AND 12),
    exp_year       smallint CHECK (exp_year >= 2020),
    is_default     boolean     NOT NULL DEFAULT false,

    -- Whether this method may be charged with the customer away. A card earns
    -- that by being confirmed through a SetupIntent while they were present,
    -- and the intent's id is the evidence — so the flag can never be set on a
    -- method that has nothing behind it. A method without it is a method this
    -- order flow cannot use.
    off_session_ok           boolean NOT NULL DEFAULT false,
    provider_setup_intent_id text,

    created_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz,

    UNIQUE (provider, provider_token),

    CONSTRAINT ck_payment_methods_off_session CHECK (
        NOT off_session_ok OR provider_setup_intent_id IS NOT NULL
    )
);

CREATE INDEX ix_payment_methods_account ON payment_methods (billing_account_id)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_payment_methods_user ON payment_methods (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX ux_payment_methods_default
    ON payment_methods (user_id) WHERE is_default AND deleted_at IS NULL;

-- Which account this order will be charged against, pinned when the order is
-- placed rather than looked up when it is charged — the customer may add or
-- remove methods in the meantime. Lives here, not in V5, because the table it
-- points at is this module's.
--
-- Nullable on purpose, and SET NULL rather than RESTRICT: a customer removing
-- their billing account after placing an order is a case this flow handles
-- rather than forbids, and a NULL here is exactly the signal that it happened.
ALTER TABLE orders
    ADD COLUMN billing_account_id uuid
        REFERENCES billing_accounts(id) ON DELETE SET NULL;   -- crosses into: order

CREATE INDEX ix_orders_billing_account ON orders (billing_account_id);

-- ------------------------------------------------------------- payments -----
CREATE TABLE payments (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   uuid          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,  -- crosses into: order
    payment_method_id uuid   REFERENCES payment_methods(id) ON DELETE SET NULL,

    provider            varchar(32) NOT NULL,
    provider_payment_id text,
    -- present for card flows that need a second user step (3-D Secure)
    provider_client_secret text,

    amount   numeric(19,4) NOT NULL CHECK (amount > 0),
    currency char(3)       NOT NULL DEFAULT 'USD',

    status varchar(24) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'REQUIRES_ACTION', 'AUTHORIZED', 'CAPTURED',
                          'FAILED', 'CANCELLED', 'EXPIRED')),

    -- how much of this capture has been refunded
    refunded_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),

    actor_type varchar(16) NOT NULL DEFAULT 'USER'
        CHECK (actor_type IN ('USER', 'AGENT', 'ADMIN', 'SYSTEM')),

    -- Stops a retried "pay" tool call from charging the customer twice.
    idempotency_key varchar(128) UNIQUE,

    failure_code    varchar(64),
    failure_message text,

    -- Kept as a record, not as a schedule. The card is authorised at checkout
    -- while the shopper is present, so a card that cannot pay fails THERE —
    -- before any picking labour is spent — and the later capture is against an
    -- authorisation the issuer has already agreed to. There is nothing left for
    -- a retry loop to usefully retry, so a capture that still fails goes to a
    -- moderator rather than to a worker.
    attempt_count   integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    first_failed_at timestamptz,
    authorized_at timestamptz,
    captured_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_payments_refund_within_amount CHECK (refunded_amount <= amount)
);

-- Captures that failed with the goods already picked. Short list, and somebody
-- has to look at every row on it.
CREATE INDEX ix_payments_failed ON payments (first_failed_at)
    WHERE status = 'FAILED';

CREATE INDEX ix_payments_order    ON payments (order_id);
CREATE INDEX ix_payments_status   ON payments (status);
CREATE UNIQUE INDEX ux_payments_provider_ref
    ON payments (provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------------- refunds -----
CREATE TABLE refunds (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid          NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    order_id   uuid          NOT NULL REFERENCES orders(id)   ON DELETE RESTRICT,

    amount   numeric(19,4) NOT NULL CHECK (amount > 0),
    currency char(3)       NOT NULL DEFAULT 'USD',

    reason varchar(32) NOT NULL
        CHECK (reason IN ('REQUESTED_BY_CUSTOMER', 'DAMAGED', 'WRONG_ITEM',
                          'NOT_DELIVERED', 'DUPLICATE', 'FRAUDULENT', 'OTHER')),
    reason_note text,

    -- REQUESTED is where an agent-initiated refund lands; a human moves it on.
    status varchar(24) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING',
                          'SUCCEEDED', 'FAILED')),

    provider_refund_id text,

    requested_by_actor varchar(16) NOT NULL DEFAULT 'USER'
        CHECK (requested_by_actor IN ('USER', 'AGENT', 'ADMIN', 'SYSTEM')),
    requested_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    -- deliberately a user, never an agent: money leaving needs a human owner
    approved_by_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
    approved_at timestamptz,

    idempotency_key varchar(128) UNIQUE,

    failure_message text,
    processed_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),

    -- An approved refund must name who approved it.
    CONSTRAINT ck_refunds_approval_recorded
        CHECK (status <> 'APPROVED' OR approved_by_user_id IS NOT NULL)
);

CREATE INDEX ix_refunds_payment ON refunds (payment_id);
CREATE INDEX ix_refunds_order   ON refunds (order_id);
CREATE INDEX ix_refunds_pending ON refunds (status) WHERE status IN ('REQUESTED', 'PROCESSING');

CREATE TRIGGER trg_refunds_updated_at
    BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------- provider webhook log -----
-- Append-only. Providers redeliver webhooks; (provider, provider_event_id)
-- being UNIQUE makes replay a no-op instead of a double refund.
CREATE TABLE payment_events (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
    refund_id  uuid REFERENCES refunds(id)  ON DELETE CASCADE,

    provider          varchar(32) NOT NULL,
    provider_event_id text        NOT NULL,
    event_type        varchar(64) NOT NULL,
    payload           jsonb       NOT NULL,
    processed_at      timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),

    UNIQUE (provider, provider_event_id)
);

CREATE INDEX ix_payment_events_payment ON payment_events (payment_id);
CREATE INDEX ix_payment_events_unprocessed ON payment_events (created_at) WHERE processed_at IS NULL;
