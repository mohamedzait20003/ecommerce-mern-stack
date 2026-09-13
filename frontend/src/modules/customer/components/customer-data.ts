import type { Money } from "@/lib/models/catalogModels"

/**
 * The order book, as local fixtures.
 *
 * The cart now comes from `/api/cart`; orders have no endpoint yet. Rather than
 * render an empty state and call the page done, these seed the screen with the
 * shape the API will return, so the layout, the sums and the states are real
 * work when it lands. Replace with a `useOrders()` hook over RTK Query and the
 * components above should not need to change.
 *
 * Field names deliberately mirror `catalogModels`: `Money` with its currency,
 * `slug` and `categorySlug` for links and fallback artwork, `listPrice`
 * alongside `price` so a saving is a comparison rather than a flag.
 */

const usd = (amount: number): Money => ({ amount, currency: "USD" })

// ---------------------------------------------------------------- orders ---

/**
 * Where an order has got to.
 *
 * `CANCELLED` and `RETURNED` are endings rather than steps, which is why the
 * timeline treats them separately from the four that run in sequence.
 */
export type OrderStatus =
    | "PLACED"
    | "PACKED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURNED"

export interface OrderLine {
    variantId: string
    slug: string
    name: string
    categorySlug: string
    imageUrl: string | null
    quantity: number
    price: Money
}

export interface Order {
    id: string
    /** What a shopper quotes to support. Short, and unique on its own. */
    reference: string
    placedAt: string
    status: OrderStatus
    total: Money
    items: OrderLine[]
    /** ISO date the carrier is currently promising. Null once it has arrived. */
    expectedAt: string | null
    trackingCode: string | null
    seller: string
}

export const ORDERS: Order[] = [
    {
        id: "ord-4821",
        reference: "MM-4821",
        placedAt: "2026-09-02",
        status: "SHIPPED",
        total: usd(211.3),
        expectedAt: "2026-09-06",
        trackingCode: "TR884213906GB",
        seller: "Aurora Audio",
        items: [
            {
                variantId: "aurora-studio-headphones",
                slug: "aurora-studio-headphones",
                name: "Aurora Studio Headphones",
                categorySlug: "electronics",
                imageUrl: null,
                quantity: 1,
                price: usd(129),
            },
            {
                variantId: "trailhead-water-bottle",
                slug: "trailhead-water-bottle",
                name: "Trailhead Water Bottle",
                categorySlug: "sports",
                imageUrl: null,
                quantity: 2,
                price: usd(22),
            },
        ],
    },
    {
        id: "ord-4790",
        reference: "MM-4790",
        placedAt: "2026-08-28",
        status: "PACKED",
        total: usd(94.5),
        expectedAt: "2026-09-08",
        trackingCode: null,
        seller: "Drift Outdoors",
        items: [
            {
                variantId: "drift-trail-runners",
                slug: "drift-trail-runners",
                name: "Drift Trail Runners",
                categorySlug: "sports",
                imageUrl: null,
                quantity: 1,
                price: usd(94.5),
            },
        ],
    },
    {
        id: "ord-4655",
        reference: "MM-4655",
        placedAt: "2026-08-14",
        status: "DELIVERED",
        total: usd(147),
        expectedAt: null,
        trackingCode: "TR773190455GB",
        seller: "Halo Studio",
        items: [
            {
                variantId: "halo-warm-desk-lamp",
                slug: "halo-warm-desk-lamp",
                name: "Halo Warm Desk Lamp",
                categorySlug: "home-living",
                imageUrl: null,
                quantity: 1,
                price: usd(62),
            },
            {
                variantId: "ember-ceramic-vase",
                slug: "ember-ceramic-vase",
                name: "Ember Ceramic Vase",
                categorySlug: "home-living",
                imageUrl: null,
                quantity: 1,
                price: usd(34),
            },
            {
                variantId: "linen-throw-blanket",
                slug: "linen-throw-blanket",
                name: "Linen Throw Blanket",
                categorySlug: "home-living",
                imageUrl: null,
                quantity: 1,
                price: usd(51),
            },
        ],
    },
    {
        id: "ord-4512",
        reference: "MM-4512",
        placedAt: "2026-07-30",
        status: "DELIVERED",
        total: usd(28.5),
        expectedAt: null,
        trackingCode: "TR661204773GB",
        seller: "Botanica",
        items: [
            {
                variantId: "botanical-day-serum",
                slug: "botanical-day-serum",
                name: "Botanical Day Serum",
                categorySlug: "beauty",
                imageUrl: null,
                quantity: 1,
                price: usd(28.5),
            },
        ],
    },
    {
        id: "ord-4408",
        reference: "MM-4408",
        placedAt: "2026-07-11",
        status: "RETURNED",
        total: usd(54),
        expectedAt: null,
        trackingCode: null,
        seller: "Nomad Supply",
        items: [
            {
                variantId: "nomad-clip-watch",
                slug: "nomad-clip-watch",
                name: "Nomad Clip Watch",
                categorySlug: "fashion",
                imageUrl: null,
                quantity: 1,
                price: usd(54),
            },
        ],
    },
]

// ----------------------------------------------------------------- rules ---

/** One date format for the whole shell, so two screens cannot disagree. */
export const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
