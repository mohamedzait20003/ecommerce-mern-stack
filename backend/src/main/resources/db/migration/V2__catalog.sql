-- ============================================================================
-- Module: catalog
-- Categories, products, variants, media, and the offers/deals that price them.
--
-- A product is the thing a shopper talks about ("the blue running shoe").
-- A variant is the thing that is actually priced, stocked and bought (size 42,
-- blue). Everything downstream — cart, order, inventory — references VARIANTS,
-- never products. This is the single most important modelling decision here.
--
-- Prices are modelled in two layers, and the split matters:
--   * product_variants.price_amount is the LIST price. It is a fact about the
--     variant and it does not move when a sale starts.
--   * an OFFER is a rule that reduces that price for a window of time; a DEAL
--     is the shopper-facing campaign a set of offers is merchandised under
--     ("Flash Friday", "Deal of the day").
-- Nothing ever overwrites price_amount to put something on sale, so ending a
-- campaign is a matter of the clock rather than a batch job that has to
-- remember what every price used to be.
-- ============================================================================

CREATE TABLE categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   uuid REFERENCES categories(id) ON DELETE RESTRICT,
    slug        varchar(160) NOT NULL UNIQUE,
    name        text         NOT NULL,
    description text,
    position    integer      NOT NULL DEFAULT 0,
    is_active   boolean      NOT NULL DEFAULT true,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX ix_categories_parent ON categories (parent_id);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------- products -----
CREATE TABLE products (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id  uuid REFERENCES categories(id) ON DELETE RESTRICT,
    slug         varchar(200) NOT NULL UNIQUE,
    name         text         NOT NULL,
    description  text,
    brand        text,
    status       varchar(16)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),

    -- Tax is a percentage of the line and is set per product, because a basket
    -- mixes rates: fresh food is commonly zero-rated where household goods are
    -- not. Orders snapshot the rate they were placed under, so changing it here
    -- never rewrites what an old order was charged.
    tax_rate     numeric(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0 AND tax_rate <= 100),

    -- How the product is held, which decides what happens to it when a picked
    -- order is abandoned. Ambient goods go back on the shelf as a RESTOCK
    -- movement; anything chilled or frozen has been out of temperature control
    -- by then and is written off as DAMAGE instead. Defaulting to AMBIENT keeps
    -- the safe-to-restock case free and makes the exception explicit.
    storage_type varchar(16)  NOT NULL DEFAULT 'AMBIENT'
        CHECK (storage_type IN ('AMBIENT', 'CHILLED', 'FROZEN')),

    -- Beer, wine, spirits, tobacco. The flag is a catalogue fact, but it is the
    -- delivery that has to act on it: the driver checks ID at the door, and by
    -- then the basket is a sealed bag they cannot inspect. So the answer travels
    -- with the delivery rather than being looked up from it.
    is_age_restricted boolean  NOT NULL DEFAULT false,
    min_age           smallint CHECK (min_age BETWEEN 16 AND 25),

    search_vector tsvector,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    updated_at   timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE products ADD CONSTRAINT ck_products_min_age CHECK (
    is_age_restricted = (min_age IS NOT NULL)
);

CREATE INDEX ix_products_category ON products (category_id);
CREATE INDEX ix_products_status   ON products (status) WHERE status = 'ACTIVE';
CREATE INDEX ix_products_search   ON products USING gin (search_vector);
-- Brand is a targetable scope for offers ("20% off everything by Acme"), so it
-- has to be cheap to filter on and not only cheap to full-text search.
CREATE INDEX ix_products_brand    ON products (brand) WHERE brand IS NOT NULL;

CREATE OR REPLACE FUNCTION products_refresh_search_vector() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', coalesce(NEW.name, '')),        'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.brand, '')),       'B') ||
        setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_search_vector
    BEFORE INSERT OR UPDATE OF name, brand, description ON products
    FOR EACH ROW EXECUTE FUNCTION products_refresh_search_vector();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------- variants -----
CREATE TABLE product_variants (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     uuid          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku            varchar(64)   NOT NULL UNIQUE,
    name           text          NOT NULL,
    
    -- The LIST price, per selling unit — per item for a tin of beans, per pound
    -- for the deli counter. Which of those it means is `price_by` below. The
    -- struck-through "was" figure on a sale badge is this column; what the
    -- shopper actually pays comes from the effective-price view further down.
    -- There is deliberately no compare_at column: two hand-maintained prices
    -- drift apart, and the discount is derivable from the offer that caused it.
    price_amount   numeric(19,4) NOT NULL CHECK (price_amount >= 0),
    currency       char(3)       NOT NULL DEFAULT 'USD',

    -- ---- how this thing is bought and priced -----------------------------
    -- A grocery basket mixes three shapes and they are two independent
    -- questions, not one:
    --
    --   tin of beans   sell_by EACH   price_by EACH     count it, price per tin
    --   whole chicken  sell_by EACH   price_by WEIGHT   count it, price per lb
    --   deli turkey    sell_by WEIGHT price_by WEIGHT   ask for 0.5 lb, price per lb
    --
    -- The middle row is the awkward one — "catch weight". The shopper takes one
    -- chicken, but nobody knows what it costs until it is on the scale, so
    -- checkout can only estimate from `weight_grams` and the real figure lands
    -- when the picker weighs it. That estimate is exactly why the card is
    -- authorised for more than the basket says (see V5__order).
    sell_by  varchar(8) NOT NULL DEFAULT 'EACH'
        CHECK (sell_by  IN ('EACH', 'WEIGHT')),
    price_by varchar(8) NOT NULL DEFAULT 'EACH'
        CHECK (price_by IN ('EACH', 'WEIGHT')),
    -- The unit `price_amount` is quoted in when priced by weight.
    price_unit varchar(4)
        CHECK (price_unit IN ('LB', 'KG', 'OZ', 'G')),
    -- Two shapes, two different questions, and only one applies to any row.
    --
    -- CATCH WEIGHT (counted by the piece, priced by the scale) has a band: a
    -- whole chicken is "3.5-4.5 lb". Nobody knows which bird until it is on the
    -- scale, so max_weight is what checkout authorises against.
    min_weight numeric(12,3) CHECK (min_weight > 0),
    max_weight numeric(12,3) CHECK (max_weight > 0),
    --
    -- SOLD BY WEIGHT (the counter, the loose bins) has no band to state in
    -- advance — the shopper names the amount. What it needs instead is how far
    -- over that amount a cut may be billed. Ask for 0.5 lb of ham at 10% and
    -- the ceiling is 0.55 lb; the slicer may hand over 0.6 lb and often will,
    -- but the customer is charged for 0.55.
    --
    -- Either way the ceiling is a BILLING cap before it is a description. An
    -- over-weight pick still goes in the bag — the customer simply never pays
    -- past what they were quoted, which is what keeps a capture inside its
    -- authorisation without anyone having to guess a buffer.
    pick_tolerance_pct numeric(5,2)
        CHECK (pick_tolerance_pct >= 0 AND pick_tolerance_pct <= 100),

    -- The nominal weight of one unit. Doubles as the shipping weight and as the
    -- estimate a catch-weight line is priced from at checkout.
    weight_grams   integer       CHECK (weight_grams >= 0),

    -- What is in the package, for the shelf-edge unit price ("$0.42/oz"). Sold
    -- separately from the pricing columns because a tin of beans is priced per
    -- tin but still has to display a price per ounce.
    net_content      numeric(12,3) CHECK (net_content > 0),
    net_content_unit varchar(6)
        CHECK (net_content_unit IN ('G', 'KG', 'ML', 'L', 'OZ', 'LB', 'FLOZ', 'CT')),

    is_default     boolean       NOT NULL DEFAULT false,
    is_active      boolean       NOT NULL DEFAULT true,
    created_at     timestamptz   NOT NULL DEFAULT now(),
    updated_at     timestamptz   NOT NULL DEFAULT now(),

    -- Priced per item: no weight machinery at all, and it cannot be ordered by
    -- weight either — asking for "half a pound of tinned beans" is nonsense.
    -- Priced per weight: the unit and the tolerance are both required, and a
    -- catch-weight line additionally needs a nominal weight to estimate from.
    CONSTRAINT ck_variants_weight_pricing CHECK (
        CASE
            -- Priced per item: none of the weight machinery applies, and it
            -- cannot be ordered by weight either — "half a pound of tinned
            -- beans" is not a thing anyone can sell you.
            WHEN price_by = 'EACH' THEN
                sell_by = 'EACH'
                AND price_unit IS NULL
                AND min_weight IS NULL AND max_weight IS NULL
                AND pick_tolerance_pct IS NULL
            -- Catch weight: the band is the band one unit comes in, and
            -- weight_grams is the nominal figure checkout estimates from.
            WHEN sell_by = 'EACH' THEN
                price_unit IS NOT NULL
                AND min_weight IS NOT NULL AND max_weight IS NOT NULL
                AND max_weight >= min_weight
                AND weight_grams IS NOT NULL
                AND pick_tolerance_pct IS NULL
            -- Sold by weight: a tolerance, and no band.
            ELSE
                price_unit IS NOT NULL
                AND pick_tolerance_pct IS NOT NULL
                AND min_weight IS NULL AND max_weight IS NULL
        END
    ),

    -- A quantity without its unit cannot be displayed and cannot be compared.
    CONSTRAINT ck_variants_net_content CHECK (
        (net_content IS NULL) = (net_content_unit IS NULL)
    )
);

CREATE INDEX ix_variants_product ON product_variants (product_id);

-- Exactly one default variant per product — this is what the agent picks when
-- the shopper says "add the blue shoe" without naming a size.
CREATE UNIQUE INDEX ux_variants_default ON product_variants (product_id) WHERE is_default;

CREATE TRIGGER trg_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Distinguishing attributes: size=42, colour=blue.
CREATE TABLE variant_attributes (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id uuid         NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    name       varchar(64)  NOT NULL,
    value      varchar(128) NOT NULL,
    UNIQUE (variant_id, name)
);

CREATE INDEX ix_variant_attributes_lookup ON variant_attributes (name, value);

-- ---------------------------------------------------------------- media -----
CREATE TABLE product_images (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- when set, this image represents that specific variant
    variant_id uuid        REFERENCES product_variants(id) ON DELETE CASCADE,
    url        text        NOT NULL,
    alt_text   text,
    position   integer     NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_product_images_product ON product_images (product_id, position);

-- -------------------------------------------------------------- reviews -----
-- Ratings hang off the PRODUCT, not the variant. A shopper rates "the blue
-- running shoe", not size 42 of it, and splitting the score across variants
-- would give every size its own thin, useless average.
CREATE TABLE product_reviews (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    uuid     NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- crosses into: user

    rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title      text,
    body       text,

    status     varchar(16) NOT NULL DEFAULT 'PUBLISHED'
        CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED')),

    -- Set by whoever can see the order history; catalog cannot work it out and
    -- does not guess. False means "not established", never "did not buy it".
    is_verified_purchase boolean NOT NULL DEFAULT false,

    -- "Was this helpful" tally, kept here so ranking a product's own reviews
    -- needs no second table.
    helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- One review per person per product. Editing yours updates this row; it is
    -- also what stops a single account voting a product up twenty times.
    UNIQUE (product_id, user_id)
);

-- The aggregate reads only PUBLISHED rows, so the partial index is the one that
-- matters; the plain index serves "my reviews" lookups.
CREATE INDEX ix_product_reviews_published
    ON product_reviews (product_id, created_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX ix_product_reviews_user ON product_reviews (user_id, created_at DESC);

CREATE TRIGGER trg_product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- OFFERS & DEALS
--
--   deal  — the campaign a shopper sees and can be linked to: a title, a
--           banner, a countdown. Pure merchandising; it prices nothing itself.
--   offer — the rule that actually moves money: "30% off", "$10 off",
--           "buy 2 get 1 half price", "these three for $99".
--   offer_targets — what an offer applies to, expressed as a scope rather than
--           a list, so "everything in Footwear except the Acme range" stays two
--           rows when the category gains a hundred products tomorrow.
--
-- An offer may stand alone (a permanent markdown on one SKU, no campaign) or
-- hang off a deal. A deal with no offers is a poster with no prices behind it,
-- which is legal and normal while a merchandiser is still building it.
--
-- Coupon codes are NOT here. A code is something a shopper types at checkout,
-- and it belongs to the order module; everything in this file applies by itself
-- to whoever is looking at the shelf.
-- ============================================================================

CREATE TABLE deals (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        varchar(160) NOT NULL UNIQUE,
    title       text         NOT NULL,
    headline    text,
    description text,

    kind        varchar(16)  NOT NULL DEFAULT 'CAMPAIGN' CHECK (kind IN ('FLASH', 'DAILY', 'CLEARANCE', 'BUNDLE', 'CAMPAIGN')),
    status      varchar(16)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED')),

    badge_text       varchar(32),
    banner_image_url text,

    starts_at   timestamptz,
    ends_at     timestamptz,

    priority    integer      NOT NULL DEFAULT 0,
    is_featured boolean      NOT NULL DEFAULT false,

    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT ck_deals_window CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX ix_deals_live     ON deals (priority DESC, ends_at) WHERE status = 'ACTIVE';
CREATE INDEX ix_deals_featured ON deals (priority DESC) WHERE status = 'ACTIVE' AND is_featured;

CREATE TRIGGER trg_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------- offers -----
CREATE TABLE offers (
    id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    name    text NOT NULL,

    discount_type varchar(16) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE', 'BUY_X_GET_Y', 'BUNDLE')),

    percent_off         numeric(5,2)  CHECK (percent_off > 0 AND percent_off <= 100),
    amount_off          numeric(19,4) CHECK (amount_off > 0),
    fixed_price_amount  numeric(19,4) CHECK (fixed_price_amount >= 0),
    
    max_discount_amount numeric(19,4) CHECK (max_discount_amount > 0),
    currency  char(3) NOT NULL DEFAULT 'USD',

    -- Threshold before the offer bites. 1 means "every unit, from the first",
    -- which is the only kind that can be shown as a shelf price.
    min_quantity integer NOT NULL DEFAULT 1 CHECK (min_quantity > 0),

    -- BUY_X_GET_Y: buy `buy_quantity`, then `get_quantity` more come at
    -- `get_percent_off` off (100 = free). Resolved by the cart, not the shelf.
    buy_quantity    integer      CHECK (buy_quantity > 0),
    get_quantity    integer      CHECK (get_quantity > 0),
    get_percent_off numeric(5,2) CHECK (get_percent_off > 0 AND get_percent_off <= 100),

    -- Higher wins when two offers land on the same variant at the same price.
    priority     integer NOT NULL DEFAULT 0,
    -- Whether this may combine with another offer on the same line. The shelf
    -- price always shows the single best offer; combining is a cart-time
    -- decision, because it depends on quantities the catalogue cannot know.
    is_stackable boolean NOT NULL DEFAULT false,
    is_active    boolean NOT NULL DEFAULT true,

    -- Null inherits the parent deal's window. Set them to run an offer on a
    -- tighter schedule than the campaign around it.
    starts_at timestamptz,
    ends_at   timestamptz,

    -- Allocation, for scarcity: "only 40 at this price". Null means unlimited.
    -- redeemed_count is incremented by the order module at placement, and is
    -- what drives the "68% claimed" bar and the "4 left" copy on a deal card.
    redemption_limit integer CHECK (redemption_limit > 0),
    redeemed_count   integer NOT NULL DEFAULT 0 CHECK (redeemed_count >= 0),

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_offers_window
        CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at),

    CONSTRAINT ck_offers_allocation
        CHECK (redemption_limit IS NULL OR redeemed_count <= redemption_limit),

    -- Each discount_type carries its own fields and no others, so a PERCENTAGE
    -- offer can never sit in the table with a stray amount_off that some later
    -- reader mistakes for the real discount.
    CONSTRAINT ck_offers_shape CHECK (
        CASE discount_type
            WHEN 'PERCENTAGE' THEN
                percent_off IS NOT NULL
                AND amount_off IS NULL AND fixed_price_amount IS NULL
            WHEN 'FIXED_AMOUNT' THEN
                amount_off IS NOT NULL
                AND percent_off IS NULL AND fixed_price_amount IS NULL
                AND max_discount_amount IS NULL
            WHEN 'FIXED_PRICE' THEN
                fixed_price_amount IS NOT NULL
                AND percent_off IS NULL AND amount_off IS NULL
                AND max_discount_amount IS NULL
            WHEN 'BUY_X_GET_Y' THEN
                buy_quantity IS NOT NULL AND get_quantity IS NOT NULL
                AND get_percent_off IS NOT NULL
                AND percent_off IS NULL AND amount_off IS NULL
                AND fixed_price_amount IS NULL
            WHEN 'BUNDLE' THEN
                fixed_price_amount IS NOT NULL
                AND percent_off IS NULL AND amount_off IS NULL
        END
    )
);

CREATE INDEX ix_offers_deal ON offers (deal_id);
CREATE INDEX ix_offers_live ON offers (starts_at, ends_at) WHERE is_active;

CREATE TRIGGER trg_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------------- targets -----
-- What an offer applies to. Scopes are resolved at read time, so filing a new
-- product under a discounted category puts it on sale without anyone touching
-- the offer. `is_exclusion` rows are subtracted afterwards, which is how
-- "everything in Footwear except the Acme range" is expressed.
CREATE TABLE offer_targets (
    id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id uuid        NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    scope    varchar(16) NOT NULL
        CHECK (scope IN ('ALL', 'CATEGORY', 'BRAND', 'PRODUCT', 'VARIANT')),

    -- CATEGORY matches the whole subtree, not just direct children.
    category_id uuid REFERENCES categories(id)       ON DELETE CASCADE,
    brand       text,
    product_id  uuid REFERENCES products(id)         ON DELETE CASCADE,
    variant_id  uuid REFERENCES product_variants(id) ON DELETE CASCADE,

    is_exclusion boolean     NOT NULL DEFAULT false,
    -- hand-curated ordering, for when a merchandiser picks the products
    position     integer     NOT NULL DEFAULT 0,
    created_at   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_offer_targets_scope CHECK (
        CASE scope
            WHEN 'ALL'      THEN category_id IS NULL     AND brand IS NULL     AND product_id IS NULL     AND variant_id IS NULL
            WHEN 'CATEGORY' THEN category_id IS NOT NULL AND brand IS NULL     AND product_id IS NULL     AND variant_id IS NULL
            WHEN 'BRAND'    THEN category_id IS NULL     AND brand IS NOT NULL AND product_id IS NULL     AND variant_id IS NULL
            WHEN 'PRODUCT'  THEN category_id IS NULL     AND brand IS NULL     AND product_id IS NOT NULL AND variant_id IS NULL
            WHEN 'VARIANT'  THEN category_id IS NULL     AND brand IS NULL     AND product_id IS NULL     AND variant_id IS NOT NULL
        END
    )
);

CREATE INDEX ix_offer_targets_offer ON offer_targets (offer_id, position);

-- One row per (offer, thing, side). Partial uniques rather than a single
-- constraint over nullable columns, which would let duplicates through on any
-- Postgres without NULLS NOT DISTINCT.
CREATE UNIQUE INDEX ux_offer_targets_all      ON offer_targets (offer_id, is_exclusion)              WHERE scope = 'ALL';
CREATE UNIQUE INDEX ux_offer_targets_category ON offer_targets (offer_id, category_id, is_exclusion) WHERE scope = 'CATEGORY';
CREATE UNIQUE INDEX ux_offer_targets_brand    ON offer_targets (offer_id, brand, is_exclusion)       WHERE scope = 'BRAND';
CREATE UNIQUE INDEX ux_offer_targets_product  ON offer_targets (offer_id, product_id, is_exclusion)  WHERE scope = 'PRODUCT';
CREATE UNIQUE INDEX ux_offer_targets_variant  ON offer_targets (offer_id, variant_id, is_exclusion)  WHERE scope = 'VARIANT';

-- -------------------------------------------------------------- bundles -----
-- The components of a BUNDLE offer: "laptop + sleeve + mouse for $999". The
-- bundle price is the offer's fixed_price_amount; these rows say what has to be
-- in the cart to earn it. RESTRICT because deleting a variant a live bundle
-- promises would quietly change what the shopper was sold.
CREATE TABLE offer_bundle_items (
    offer_id   uuid    NOT NULL REFERENCES offers(id)           ON DELETE CASCADE,
    variant_id uuid    NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),

    PRIMARY KEY (offer_id, variant_id)
);

-- ============================================================================
-- READ MODELS
--
-- Pricing is resolved in the database rather than in each caller. The chat
-- agent, the storefront and the cart all have to agree on what a thing costs
-- right now; the moment that arithmetic is copied into a second language it
-- starts to disagree with itself.
-- ============================================================================

-- Every category paired with itself and its descendants, so an offer on a
-- parent reaches the products filed under its children. The depth cap is a
-- cycle guard: parent_id is not constrained to be acyclic, and a loop would
-- otherwise recurse until the query is killed.
CREATE VIEW category_tree AS
WITH RECURSIVE tree(ancestor_id, descendant_id, depth) AS (
    SELECT id, id, 0 FROM categories
    UNION ALL
    SELECT t.ancestor_id, c.id, t.depth + 1
    FROM   tree t
    JOIN   categories c ON c.parent_id = t.descendant_id
    WHERE  t.depth < 8
)
SELECT ancestor_id, descendant_id, depth FROM tree;

-- What a product is rated, and by how many people.
--
-- Derived rather than kept as a counter on `products`, for the same reason the
-- prices are: a stored average has to be recomputed on every insert, edit,
-- withdrawal and moderation decision, and the first one that gets missed is a
-- number nobody can explain afterwards.
--
-- Only PUBLISHED reviews count. A product with no reviews is absent here rather
-- than present with a zero, so a caller LEFT JOINs and gets null — which reads
-- as "unrated", not as "rated zero".
CREATE VIEW product_ratings AS
SELECT r.product_id,
       count(*)                                        AS review_count,
       round(avg(r.rating), 1)::numeric(2,1)           AS average_rating,
       count(*) FILTER (WHERE r.rating = 5)::integer   AS five_star,
       count(*) FILTER (WHERE r.rating = 4)::integer   AS four_star,
       count(*) FILTER (WHERE r.rating = 3)::integer   AS three_star,
       count(*) FILTER (WHERE r.rating = 2)::integer   AS two_star,
       count(*) FILTER (WHERE r.rating = 1)::integer   AS one_star,
       count(*) FILTER (WHERE r.is_verified_purchase)::integer AS verified_count
FROM   product_reviews r
WHERE  r.status = 'PUBLISHED'
GROUP  BY r.product_id;

-- Offer scopes expanded to the variants they actually cover, exclusions
-- already subtracted.
CREATE VIEW offer_variants AS
WITH matched AS (
    -- VARIANT scope names its variant outright
    SELECT t.offer_id, t.variant_id, t.is_exclusion
    FROM   offer_targets t
    WHERE  t.scope = 'VARIANT'

    UNION ALL

    -- every other scope selects products, and takes all their variants with it
    SELECT t.offer_id, v.id, t.is_exclusion
    FROM   offer_targets t
    JOIN   products p ON (
               t.scope = 'ALL'
            OR (t.scope = 'PRODUCT'  AND p.id = t.product_id)
            OR (t.scope = 'BRAND'    AND p.brand = t.brand)
            OR (t.scope = 'CATEGORY' AND p.category_id IN (
                    SELECT ct.descendant_id
                    FROM   category_tree ct
                    WHERE  ct.ancestor_id = t.category_id))
           )
    JOIN   product_variants v ON v.product_id = p.id
    WHERE  t.scope <> 'VARIANT'
)
SELECT DISTINCT i.offer_id, i.variant_id
FROM   matched i
WHERE  NOT i.is_exclusion
  AND  NOT EXISTS (
           SELECT 1
           FROM   matched e
           WHERE  e.offer_id   = i.offer_id
             AND  e.variant_id = i.variant_id
             AND  e.is_exclusion
       );

-- Offers that are live at this instant: switched on, inside their own window or
-- the one they inherit from their deal, under a deal that is itself running,
-- and not out of allocation.
CREATE VIEW active_offers AS
SELECT o.*,
       d.slug       AS deal_slug,
       d.title      AS deal_title,
       d.kind       AS deal_kind,
       d.badge_text AS deal_badge_text,
       COALESCE(o.ends_at, d.ends_at) AS effective_ends_at
FROM   offers o
LEFT   JOIN deals d ON d.id = o.deal_id
WHERE  o.is_active
  AND  (d.id IS NULL OR d.status = 'ACTIVE')
  AND  now() >= COALESCE(o.starts_at, d.starts_at, '-infinity'::timestamptz)
  AND  now() <  COALESCE(o.ends_at,   d.ends_at,   'infinity'::timestamptz)
  AND  (o.redemption_limit IS NULL OR o.redeemed_count < o.redemption_limit);

-- What one unit of each variant costs right now, and why.
--
-- Only per-unit offers reach the shelf: BUY_X_GET_Y and BUNDLE depend on what
-- else is in the basket, so they are resolved by the cart and deliberately
-- ignored here. Where several offers apply the shopper gets the cheapest, never
-- the sum of them; stacking, where it is allowed at all, is settled at cart
-- time where the quantities are known.
--
-- Every variant appears exactly once, on offer or not, so a price lookup is one
-- join and needs no COALESCE at the call site.
CREATE VIEW variant_effective_prices AS
WITH candidate AS (
    SELECT v.id  AS variant_id,
           ao.id AS offer_id,
           ao.deal_id,
           ao.priority,
           CASE ao.discount_type
               WHEN 'PERCENTAGE' THEN
                   GREATEST(v.price_amount - LEAST(
                       round(v.price_amount * ao.percent_off / 100, 4),
                       COALESCE(ao.max_discount_amount, v.price_amount)), 0)
               WHEN 'FIXED_AMOUNT' THEN
                   GREATEST(v.price_amount - ao.amount_off, 0)
               WHEN 'FIXED_PRICE' THEN
                   -- never let a mistyped "sale" price raise the price
                   LEAST(ao.fixed_price_amount, v.price_amount)
           END AS unit_price
    FROM   product_variants v
    JOIN   offer_variants ov ON ov.variant_id = v.id
    JOIN   active_offers  ao ON ao.id = ov.offer_id
    WHERE  ao.discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE')
      AND  ao.min_quantity = 1
      AND  (ao.discount_type = 'PERCENTAGE' OR ao.currency = v.currency)
),
best AS (
    SELECT DISTINCT ON (variant_id) variant_id, offer_id, deal_id, priority, unit_price
    FROM   candidate
    ORDER  BY variant_id, unit_price, priority DESC, offer_id
)
SELECT v.id                                                   AS variant_id,
       v.product_id,
       v.currency,
       v.price_amount                                         AS list_price_amount,
       -- Cast back to the money type: the arithmetic above widens these to an
       -- unconstrained numeric, and a price column that does not declare
       -- numeric(19,4) like every other one in the schema misleads whatever
       -- reads it.
       COALESCE(b.unit_price, v.price_amount)::numeric(19,4)  AS effective_price_amount,
       (v.price_amount - COALESCE(b.unit_price, v.price_amount))::numeric(19,4)
                                                              AS savings_amount,
       b.offer_id,
       b.deal_id,
       (b.offer_id IS NOT NULL)                               AS on_offer
FROM   product_variants v
LEFT   JOIN best b ON b.variant_id = v.id;

-- The deals page as one query: every buyable variant currently discounted under
-- a campaign, with the numbers a deal card actually renders — was/now, the
-- percentage, and how much of the allocation is left.
CREATE VIEW active_deal_items AS
SELECT d.id        AS deal_id,
       d.slug      AS deal_slug,
       d.title     AS deal_title,
       d.kind      AS deal_kind,
       d.badge_text,
       d.priority,
       d.is_featured,
       COALESCE(o.ends_at, d.ends_at) AS ends_at,

       p.id          AS product_id,
       p.slug        AS product_slug,
       p.name        AS product_name,
       p.brand,
       p.category_id,

       v.id  AS variant_id,
       v.sku,
       v.currency,

       ep.list_price_amount,
       ep.effective_price_amount,
       ep.savings_amount,
       (CASE WHEN ep.list_price_amount > 0
             THEN round(100 * ep.savings_amount / ep.list_price_amount)
             ELSE 0 END)::numeric(5,2) AS percent_off,

       o.id AS offer_id,
       o.redemption_limit,
       o.redeemed_count,
       -- null when the offer is unlimited: there is no "4 left" to show
       CASE WHEN o.redemption_limit IS NULL THEN NULL
            ELSE GREATEST(o.redemption_limit - o.redeemed_count, 0) END AS units_left
FROM   variant_effective_prices ep
JOIN   product_variants v ON v.id = ep.variant_id AND v.is_active
JOIN   products p         ON p.id = v.product_id  AND p.status = 'ACTIVE'
JOIN   offers o           ON o.id = ep.offer_id
JOIN   deals  d           ON d.id = o.deal_id
WHERE  ep.on_offer
  -- An offer that saves nothing is not a deal. A FIXED_PRICE entered above the
  -- list price is clamped rather than applied, and would otherwise surface here
  -- as a "0% off" card advertising the price the shopper could already pay.
  AND  ep.savings_amount > 0;
