import type { Money } from './catalogModels';

/**
 * The cart contract, mirroring `com.minglemart.modules.cart.dtos`.
 *
 * Field for field with `CartResponse`, including the two prices. `unitPrice` is
 * what the line was added at and what the subtotal is built from; `currentPrice`
 * is what the catalogue says today, and is null once a variant has been
 * withdrawn. They differ when a price moved under a basket that was left open,
 * which is what `hasPriceDrift` flags — the server does not silently reprice.
 */

/** One line, as `CartResponse.Line` serialises it. */
export interface CartLineDto {
    variantId: string;
    /** Null when the variant no longer resolves in the catalogue. */
    sku: string | null;
    name: string;
    /**
     * The variant's own artwork, falling back to the product's lead image on
     * the server. Null when neither exists — the tile draws a glyph rather than
     * a broken image.
     */
    imageUrl: string | null;
    quantity: number;
    /** The price this line was added at. Authoritative for the subtotal. */
    unitPrice: Money;
    /** Today's catalogue price, or null if the variant is gone. */
    currentPrice: Money | null;
    lineTotal: Money;
    /** The variant is inactive or missing: it cannot be checked out. */
    unavailable: boolean;
}

export interface CartResponse {
    /** Null when the shopper has never had a cart. */
    cartId: string | null;
    lines: CartLineDto[];
    /** Units, not lines: two of one thing counts twice. */
    itemCount: number;
    subtotal: Money;
    /** True when any line's catalogue price has moved since it was added. */
    hasPriceDrift: boolean;
}

/** `POST /api/cart/items`. */
export interface AddToCartRequest {
    variantId: string;
    /** 1-99, matching the server's own bounds. */
    quantity: number;
}

/** `PATCH /api/cart/items/{variantId}`. Zero removes the line. */
export interface CartQuantityRequest {
    variantId: string;
    quantity: number;
}

/** The server's cap. The stepper stops here rather than being refused. */
export const MAX_QUANTITY = 99;

/** How much a line's price has moved since it was added. Zero when unknown. */
export const priceDelta = (line: CartLineDto): number =>
    line.currentPrice ? line.currentPrice.amount - line.unitPrice.amount : 0;

/** True when the catalogue disagrees with what this line is being charged. */
export const priceChanged = (line: CartLineDto): boolean => priceDelta(line) !== 0;

// -------------------------------------------------------------- client ---

/**
 * A line lifted out of the basket, kept only long enough to put it back.
 *
 * Carries its own quantity so undo restores what was there rather than one of
 * it, and its name so the offer can say what it is about after the line itself
 * has gone from the cache.
 */
export interface RemovedLine {
    variantId: string;
    name: string;
    quantity: number;
}

/** Cart state the server has no opinion about. Never persisted. */
export interface CartUiState {
    lastRemoved: RemovedLine | null;
    /** The variant most recently added, for a tile to acknowledge. */
    lastAdded: string | null;
}
