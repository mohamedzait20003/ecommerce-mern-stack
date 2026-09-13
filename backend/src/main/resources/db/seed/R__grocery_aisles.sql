-- ============================================================================
-- Repeatable seed: the grocery half of the catalogue.
--
-- The DummyJSON data in R__demo_catalogue gives us a working shop, but it is a
-- general-merchandise shop: phones, watches, trainers. None of it is sold by
-- weight, which means none of the machinery this store is actually built around
-- ever runs in development — no catch weight, no scale, no authorisation
-- headroom, no unit price on the shelf edge. Every one of those paths would go
-- to production having only ever been exercised by a test.
--
-- So this file adds the aisles a grocer has, and stocks them with all three
-- shapes a basket comes in:
--
--   sell EACH  / price EACH    a tin of chopped tomatoes
--   sell EACH  / price WEIGHT  a whole chicken, 3.5-4.5 lb  (catch weight)
--   sell WEIGHT/ price WEIGHT  sliced ham from the counter
--
-- Separate from the demo file rather than appended to it, so the two resets
-- cannot tread on each other. Both are repeatable; this one runs second.
--
-- Deliberately no product_images rows: there is no image set for these that
-- has been checked, and a seed full of 404s is worse than a seed with none.
--
-- DEVELOPMENT ONLY, same as its sibling. See application.properties.
-- ============================================================================

-- --------------------------------------------------------------- reset -----
-- Products hold a RESTRICT reference to categories, so they go first. Deleting
-- a product cascades to its variants, and a variant to its inventory row.
DELETE FROM products WHERE category_id IN (
    SELECT id FROM categories WHERE slug IN (
        'produce', 'meat-seafood', 'dairy-eggs', 'bakery', 'deli', 'frozen',
        'pantry', 'beverages', 'snacks', 'breakfast', 'household', 'beer-wine'
    )
);
DELETE FROM categories WHERE slug IN (
    'produce', 'meat-seafood', 'dairy-eggs', 'bakery', 'deli', 'frozen',
    'pantry', 'beverages', 'snacks', 'breakfast', 'household', 'beer-wine'
);

-- ------------------------------------------------------------- aisles ------
INSERT INTO categories (slug, name, description, position, is_active) VALUES
  ('produce',      'Fresh Produce',    'Fruit and vegetables, loose and packed.',            12, true),
  ('meat-seafood', 'Meat & Seafood',   'The butcher and fish counters.',                     13, true),
  ('dairy-eggs',   'Dairy & Eggs',     'Milk, butter, cheese and the egg shelf.',            14, true),
  ('bakery',       'Bakery',           'Baked this morning, gone by this evening.',          15, true),
  ('deli',         'Deli',             'Sliced to order at the counter.',                    16, true),
  ('frozen',       'Frozen Foods',     'Everything behind the glass doors.',                 17, true),
  ('pantry',       'Pantry',           'Tins, jars, pasta, oil and the rest of the shelf.',  18, true),
  ('beverages',    'Beverages',        'Soft drinks, juice, coffee and tea.',                19, true),
  ('snacks',       'Snacks',           'Crisps, biscuits and the confectionery aisle.',      20, true),
  ('breakfast',    'Breakfast',        'Cereal, spreads and the first meal of the day.',     21, true),
  ('household',    'Household',        'Cleaning, laundry and paper goods.',                 22, true),
  ('beer-wine',    'Beer & Wine',      'Sold only to adults, and checked at the door.',      23, true);

-- ----------------------------------------------------------- products ------
-- tax_rate: food is zero-rated here; household goods and alcohol are not.
-- storage_type decides what happens to a picked order that is later abandoned —
-- ambient goes back on the shelf, chilled and frozen are written off.
INSERT INTO products (category_id, slug, name, description, brand, status,
                      tax_rate, storage_type, is_age_restricted, min_age)
SELECT c.id, t.slug, t.name, t.descr, t.brand, 'ACTIVE',
       t.tax::numeric(5,2), t.storage, t.age_restricted, t.min_age::smallint
FROM (VALUES
  -- produce
  ('produce','bananas-loose',        'Bananas, loose',            'Sold by the pound, ripened on the way in.',            'Market Row',   0,    'AMBIENT', false, NULL),
  ('produce','gala-apples-loose',    'Gala Apples, loose',        'Crisp and sweet. Priced by the pound.',                'Market Row',   0,    'AMBIENT', false, NULL),
  ('produce','avocados-ripe',        'Ripe Avocados',             'Ready to eat today. Sold singly.',                     'Market Row',   0,    'CHILLED', false, NULL),
  ('produce','baby-spinach-bag',     'Baby Spinach',              'Washed and ready. 5 oz bag.',                          'Market Row',   0,    'CHILLED', false, NULL),
  -- meat & seafood
  ('meat-seafood','beef-mince-lean', 'Lean Beef Mince',           'Ground fresh daily. Priced by the pound.',             'Butcher''s Bench', 0, 'CHILLED', false, NULL),
  ('meat-seafood','chicken-breast',  'Chicken Breast Fillets',    'Boneless and skinless. Priced by the pound.',          'Butcher''s Bench', 0, 'CHILLED', false, NULL),
  ('meat-seafood','whole-chicken',   'Whole Chicken',             'Free range, 3.5 to 4.5 lb. Priced by the pound.',      'Butcher''s Bench', 0, 'CHILLED', false, NULL),
  ('meat-seafood','salmon-fillet',   'Salmon Fillet',             'Skin on, pin-boned. Priced by the pound.',             'Harbour Catch',    0, 'CHILLED', false, NULL),
  -- dairy & eggs
  ('dairy-eggs','whole-milk-gallon', 'Whole Milk',                'One gallon, from a dairy two counties over.',          'Cedar Creek',  0,    'CHILLED', false, NULL),
  ('dairy-eggs','large-eggs-dozen',  'Large Eggs',                'A dozen, cage free.',                                  'Cedar Creek',  0,    'CHILLED', false, NULL),
  ('dairy-eggs','salted-butter',     'Salted Butter',             'Churned in small batches. 8 oz block.',                'Cedar Creek',  0,    'CHILLED', false, NULL),
  ('dairy-eggs','greek-yoghurt',     'Greek Yoghurt, Plain',      'Strained thick. 32 oz tub.',                           'Cedar Creek',  0,    'CHILLED', false, NULL),
  -- bakery
  ('bakery','sourdough-loaf',        'Sourdough Loaf',            'Baked this morning, and it will not keep.',            'Corner Oven',  0,    'AMBIENT', false, NULL),
  ('bakery','butter-croissants',     'Butter Croissants',         'Four to a bag.',                                       'Corner Oven',  0,    'AMBIENT', false, NULL),
  ('bakery','seeded-bagels',         'Seeded Bagels',             'Six to a bag, boiled then baked.',                     'Corner Oven',  0,    'AMBIENT', false, NULL),
  ('bakery','chocolate-cake',        'Chocolate Fudge Cake',      'Eight inches. Serves however many you say it does.',   'Corner Oven',  0,    'AMBIENT', false, NULL),
  -- deli
  ('deli','sliced-turkey-breast',    'Turkey Breast, sliced',     'Cut to order at the counter. Priced by the pound.',    'Counter Cut',  0,    'CHILLED', false, NULL),
  ('deli','honey-roast-ham',         'Honey Roast Ham, sliced',   'Cut to order. Priced by the pound.',                   'Counter Cut',  0,    'CHILLED', false, NULL),
  ('deli','mature-cheddar',          'Mature Cheddar',            'Cut from the block. Priced by the pound.',             'Counter Cut',  0,    'CHILLED', false, NULL),
  ('deli','mixed-olives',            'Mixed Olives',              'From the olive bar. Priced by the pound.',             'Counter Cut',  0,    'CHILLED', false, NULL),
  -- frozen
  ('frozen','garden-peas-frozen',    'Garden Peas',               'Frozen within hours of picking. 16 oz.',               'Frostline',    0,    'FROZEN',  false, NULL),
  ('frozen','vanilla-ice-cream',     'Vanilla Bean Ice Cream',    'One pint, and no apologies about it.',                 'Frostline',    0,    'FROZEN',  false, NULL),
  ('frozen','margherita-pizza',      'Margherita Pizza',          'Stone baked. 12 inch.',                                'Frostline',    0,    'FROZEN',  false, NULL),
  ('frozen','mixed-berries-frozen',  'Mixed Berries',             'Strawberry, raspberry, blackberry. 12 oz.',            'Frostline',    0,    'FROZEN',  false, NULL),
  -- pantry
  ('pantry','chopped-tomatoes-tin',  'Chopped Tomatoes',          'A tin that earns its shelf space. 14.5 oz.',           'Pantry Line',  0,    'AMBIENT', false, NULL),
  ('pantry','spaghetti-dry',         'Spaghetti',                 'Bronze cut, slow dried. 16 oz.',                       'Pantry Line',  0,    'AMBIENT', false, NULL),
  ('pantry','olive-oil-extra-virgin','Extra Virgin Olive Oil',    'First cold press. 16.9 fl oz.',                        'Pantry Line',  0,    'AMBIENT', false, NULL),
  ('pantry','basmati-rice',          'Basmati Rice',              'Aged twelve months. 32 oz.',                           'Pantry Line',  0,    'AMBIENT', false, NULL),
  -- beverages
  ('beverages','orange-juice-carton','Orange Juice',              'Not from concentrate. 52 fl oz.',                      'Grove & Vine', 0,    'CHILLED', false, NULL),
  ('beverages','sparkling-water-12', 'Sparkling Water',           'Twelve cans, no sugar, no argument.',                  'Grove & Vine', 0,    'AMBIENT', false, NULL),
  ('beverages','ground-coffee',      'Ground Coffee, Medium',     'Whole bean ground for filter. 12 oz.',                 'Ninth Street', 0,    'AMBIENT', false, NULL),
  ('beverages','english-breakfast',  'English Breakfast Tea',     'Eighty bags. Enough for a fortnight.',                 'Ninth Street', 0,    'AMBIENT', false, NULL),
  -- snacks
  ('snacks','sea-salt-crisps',       'Sea Salt Crisps',           'Hand cooked. 5 oz bag.',                               'Two Fields',   0,    'AMBIENT', false, NULL),
  ('snacks','dark-chocolate-70',     'Dark Chocolate, 70%',       'Single origin. 3.5 oz bar.',                           'Two Fields',   0,    'AMBIENT', false, NULL),
  ('snacks','salted-peanuts',        'Salted Peanuts',            'Dry roasted. 10 oz.',                                  'Two Fields',   0,    'AMBIENT', false, NULL),
  ('snacks','oat-biscuits',          'Oat Biscuits',              'The kind that goes with cheese. 7 oz.',                'Two Fields',   0,    'AMBIENT', false, NULL),
  -- breakfast
  ('breakfast','porridge-oats',      'Porridge Oats',             'Rolled, not instant. 32 oz.',                          'Mill House',   0,    'AMBIENT', false, NULL),
  ('breakfast','corn-flakes',        'Corn Flakes',               'The original. 18 oz box.',                             'Mill House',   0,    'AMBIENT', false, NULL),
  ('breakfast','strawberry-jam',     'Strawberry Jam',            'Set with fruit, not pectin. 12 oz jar.',               'Mill House',   0,    'AMBIENT', false, NULL),
  ('breakfast','peanut-butter',      'Peanut Butter, Smooth',     'Two ingredients. 16 oz jar.',                          'Mill House',   0,    'AMBIENT', false, NULL),
  -- household
  ('household','washing-up-liquid',  'Washing Up Liquid',         'Concentrated. 25 fl oz.',                              'Kept House',   8.25, 'AMBIENT', false, NULL),
  ('household','kitchen-roll-2',     'Kitchen Roll',              'Two rolls, and they are the big ones.',                'Kept House',   8.25, 'AMBIENT', false, NULL),
  ('household','laundry-detergent',  'Laundry Detergent',         'Thirty two washes. 50 fl oz.',                         'Kept House',   8.25, 'AMBIENT', false, NULL),
  ('household','bin-liners-30',      'Bin Liners',                'Thirty, drawstring, 13 gallon.',                       'Kept House',   8.25, 'AMBIENT', false, NULL),
  -- beer & wine
  ('beer-wine','pale-ale-6pack',     'Pale Ale',                  'Six bottles. Checked at the door.',                    'Harbour Brew', 8.25, 'AMBIENT', true,  21),
  ('beer-wine','lager-12pack',       'Lager',                     'Twelve cans. Checked at the door.',                    'Harbour Brew', 8.25, 'AMBIENT', true,  21),
  ('beer-wine','red-wine-rioja',     'Rioja Reserva',             'One bottle. Checked at the door.',                     'Cellar Row',   8.25, 'AMBIENT', true,  21),
  ('beer-wine','white-wine-sauv',    'Sauvignon Blanc',           'One bottle. Checked at the door.',                     'Cellar Row',   8.25, 'AMBIENT', true,  21)
) AS t(cat_slug, slug, name, descr, brand, tax, storage, age_restricted, min_age)
JOIN categories c ON c.slug = t.cat_slug;

-- ----------------------------------------------------------- variants ------
-- price_amount is per SELLING UNIT: per item where price_by is EACH, per
-- price_unit where it is WEIGHT.
--
-- Counter items carry a pick tolerance, because the shopper names the weight
-- and the only open question is how far over it the slicer may land. Catch
-- weight items carry a band instead, because the shopper names a piece and the
-- weight is whatever that piece turns out to be. Both feed the same two numbers
-- downstream: what the card is authorised for, and what the capture is capped
-- at.
INSERT INTO product_variants (product_id, sku, name, price_amount, sell_by, price_by,
                              price_unit, min_weight, max_weight, pick_tolerance_pct,
                              weight_grams, net_content, net_content_unit,
                              is_default, is_active)
SELECT p.id, t.sku, t.vname, t.price::numeric(19,4), t.sell_by, t.price_by,
       t.price_unit::varchar(4), t.min_w::numeric(12,3), t.max_w::numeric(12,3),
       t.tol::numeric(5,2),
       t.grams::integer, t.net::numeric(12,3), t.net_unit::varchar(6), true, true
FROM (VALUES
  -- sold and priced by weight: the counter and the loose produce bins
  ('bananas-loose',        'GRO-PRD-001','Per lb',            0.62,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('gala-apples-loose',    'GRO-PRD-002','Per lb',            1.98,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('beef-mince-lean',      'GRO-MTS-001','Per lb',            6.99,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('chicken-breast',       'GRO-MTS-002','Per lb',            5.49,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('salmon-fillet',        'GRO-MTS-004','Per lb',           12.99,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('sliced-turkey-breast', 'GRO-DLI-001','Sliced, per lb',    9.49,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('honey-roast-ham',      'GRO-DLI-002','Sliced, per lb',    8.99,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('mature-cheddar',       'GRO-DLI-003','Cut, per lb',       7.99,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  ('mixed-olives',         'GRO-DLI-004','Per lb',            6.49,'WEIGHT','WEIGHT','LB', NULL,  NULL,   10,   NULL, NULL, NULL),
  -- counted by the piece, priced by weight: catch weight
  ('whole-chicken',        'GRO-MTS-003','3.5-4.5 lb bird',   2.49,'EACH',  'WEIGHT','LB',  3.5,   4.5, NULL,  1810, NULL, NULL),
  -- counted and priced by the piece
  ('avocados-ripe',        'GRO-PRD-003','Each',              1.25,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  200, NULL, NULL),
  ('baby-spinach-bag',     'GRO-PRD-004','5 oz bag',          3.49,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  142,    5, 'OZ'),
  ('whole-milk-gallon',    'GRO-DRY-001','1 gallon',          4.29,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 3900,  128, 'FLOZ'),
  ('large-eggs-dozen',     'GRO-DRY-002','Dozen',             4.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  700,   12, 'CT'),
  ('salted-butter',        'GRO-DRY-003','8 oz block',        3.79,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  227,    8, 'OZ'),
  ('greek-yoghurt',        'GRO-DRY-004','32 oz tub',         5.49,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  907,   32, 'OZ'),
  ('sourdough-loaf',       'GRO-BAK-001','800 g loaf',        4.50,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  800,  800, 'G'),
  ('butter-croissants',    'GRO-BAK-002','Four',              4.25,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  240,    4, 'CT'),
  ('seeded-bagels',        'GRO-BAK-003','Six',               3.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  510,    6, 'CT'),
  ('chocolate-cake',       'GRO-BAK-004','8 inch',           16.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 1100, NULL, NULL),
  ('garden-peas-frozen',   'GRO-FRZ-001','16 oz',             2.29,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  454,   16, 'OZ'),
  ('vanilla-ice-cream',    'GRO-FRZ-002','1 pint',            5.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  473,   16, 'FLOZ'),
  ('margherita-pizza',     'GRO-FRZ-003','12 inch',           6.49,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  420, NULL, NULL),
  ('mixed-berries-frozen', 'GRO-FRZ-004','12 oz',             4.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  340,   12, 'OZ'),
  ('chopped-tomatoes-tin', 'GRO-PAN-001','14.5 oz tin',       1.19,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  411, 14.5, 'OZ'),
  ('spaghetti-dry',        'GRO-PAN-002','16 oz',             2.49,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  454,   16, 'OZ'),
  ('olive-oil-extra-virgin','GRO-PAN-003','16.9 fl oz',       9.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  550, 16.9, 'FLOZ'),
  ('basmati-rice',         'GRO-PAN-004','32 oz',             5.79,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  907,   32, 'OZ'),
  ('orange-juice-carton',  'GRO-BEV-001','52 fl oz',          4.79,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 1600,   52, 'FLOZ'),
  ('sparkling-water-12',   'GRO-BEV-002','12 cans',           5.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 4260,   12, 'CT'),
  ('ground-coffee',        'GRO-BEV-003','12 oz',            11.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  340,   12, 'OZ'),
  ('english-breakfast',    'GRO-BEV-004','80 bags',           4.49,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  250,   80, 'CT'),
  ('sea-salt-crisps',      'GRO-SNK-001','5 oz bag',          3.29,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  142,    5, 'OZ'),
  ('dark-chocolate-70',    'GRO-SNK-002','3.5 oz bar',        3.49,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  100,  3.5, 'OZ'),
  ('salted-peanuts',       'GRO-SNK-003','10 oz',             3.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  284,   10, 'OZ'),
  ('oat-biscuits',         'GRO-SNK-004','7 oz',              2.79,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  200,    7, 'OZ'),
  ('porridge-oats',        'GRO-BRK-001','32 oz',             4.29,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  907,   32, 'OZ'),
  ('corn-flakes',          'GRO-BRK-002','18 oz box',         4.19,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  510,   18, 'OZ'),
  ('strawberry-jam',       'GRO-BRK-003','12 oz jar',         3.89,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  340,   12, 'OZ'),
  ('peanut-butter',        'GRO-BRK-004','16 oz jar',         4.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  454,   16, 'OZ'),
  ('washing-up-liquid',    'GRO-HSE-001','25 fl oz',          3.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  760,   25, 'FLOZ'),
  ('kitchen-roll-2',       'GRO-HSE-002','2 rolls',           4.49,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  600,    2, 'CT'),
  ('laundry-detergent',    'GRO-HSE-003','50 fl oz',         12.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 1550,   50, 'FLOZ'),
  ('bin-liners-30',        'GRO-HSE-004','30 liners',         6.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL,  550,   30, 'CT'),
  ('pale-ale-6pack',       'GRO-ALC-001','6 x 12 fl oz',     10.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 3400,    6, 'CT'),
  ('lager-12pack',         'GRO-ALC-002','12 x 12 fl oz',    15.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 6200,   12, 'CT'),
  ('red-wine-rioja',       'GRO-ALC-003','750 ml',           18.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 1200,  750, 'ML'),
  ('white-wine-sauv',      'GRO-ALC-004','750 ml',           14.99,'EACH',  'EACH',  NULL, NULL, NULL, NULL, 1200,  750, 'ML')
) AS t(prod_slug, sku, vname, price, sell_by, price_by, price_unit, min_w, max_w, tol, grams, net, net_unit)
JOIN products p ON p.slug = t.prod_slug;

-- ---------------------------------------------------------- inventory ------
-- Weight-priced lines hold a fractional quantity in their price unit; counted
-- lines hold whole units. Deterministic rather than random, so a reseeded
-- database is the same database.
INSERT INTO inventory_items (variant_id, quantity_on_hand, reorder_level)
SELECT v.id,
       CASE WHEN v.price_by = 'WEIGHT'
            THEN (40 + (length(v.sku) % 5) * 7)::numeric + 0.400
            ELSE (60 + (length(v.sku) % 7) * 13)::numeric
       END,
       CASE WHEN v.price_by = 'WEIGHT' THEN 10 ELSE 24 END
FROM   product_variants v
JOIN   products   p ON p.id = v.product_id
JOIN   categories c ON c.id = p.category_id
WHERE  c.slug IN ('produce', 'meat-seafood', 'dairy-eggs', 'bakery', 'deli',
                  'frozen', 'pantry', 'beverages', 'snacks', 'breakfast',
                  'household', 'beer-wine')
ON CONFLICT (variant_id) DO UPDATE
   SET quantity_on_hand = EXCLUDED.quantity_on_hand,
       reorder_level    = EXCLUDED.reorder_level;
