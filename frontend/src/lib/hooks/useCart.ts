import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';

import {
    useAddToCartMutation,
    useGetCartQuery,
    useRemoveFromCartMutation,
    useSetCartQuantityMutation,
} from '@/lib/handlers/cartHandlers';
import { MAX_QUANTITY, type CartResponse } from '@/lib/models/cartModels';
import { useUser } from '@/lib/hooks/useUser';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    lineAdded,
    lineRemoved,
    removalCleared,
    selectLastRemoved,
} from '@/store/slices/cartSlice';

import type { ApiError } from '@/lib/utils/apiError';
import type { Money } from '@/lib/models/catalogModels';

/** Orders over this ship free. The basket shows how far away you are. */
export const FREE_SHIPPING_THRESHOLD = 50;
export const FLAT_SHIPPING = 4.95;

/** Rounds to cents. Float arithmetic on prices otherwise shows 48.29999999. */
const cents = (value: number) => Math.round(value * 100) / 100;

const EMPTY: CartResponse = {
    cartId: null,
    lines: [],
    itemCount: 0,
    subtotal: { amount: 0, currency: 'USD' },
    hasPriceDrift: false,
};

export interface CartTotals {
    itemCount: number;
    subtotal: Money;
    shipping: Money;
    total: Money;
    /** What is still needed to ship free. Zero once the threshold is met. */
    toFreeShipping: Money;
    freeShippingPercent: number;
}

/**
 * The basket.
 *
 * The server owns it: every mutation answers with the whole cart, and the
 * handlers write that answer straight into the query cache, so this hook is a
 * thin reading of one cache entry rather than a second copy of the truth. Two
 * components calling it see the same basket, which a `useState` cart could
 * never promise.
 *
 * Shipping is worked out here because it is a rule about *this* storefront
 * rather than a fact about the cart, and the cart endpoint does not quote it.
 * Swap it for the server's figure the moment checkout starts returning one.
 */
export function useCart() {
    const { isAuthenticated } = useUser();

    // A guest has no cart, and asking for one is a guaranteed 401 that would
    // trip the refresh-and-retry path on every page they visit.
    const { data, isLoading, isFetching, error } = useGetCartQuery(undefined, {
        skip: !isAuthenticated,
    });

    const [addToCart, addState] = useAddToCartMutation();
    const [setQuantityMutation, quantityState] = useSetCartQuantityMutation();
    const [removeMutation] = useRemoveFromCartMutation();

    const cart = data ?? EMPTY;

    // The undo offer lives in the store, not here: this hook has six callers on
    // a given page, and per-instance state meant the tile that removed a line
    // and the page that would offer the undo never saw each other's copy.
    const dispatch = useAppDispatch();
    const removed = useAppSelector(selectLastRemoved);

    const totals: CartTotals = useMemo(() => {
        const subtotal = cents(cart.subtotal.amount);
        const currency = cart.subtotal.currency;

        // An empty basket has no shipping to quote; a full one either clears
        // the threshold or does not.
        const shipping =
            cart.itemCount === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

        return {
            itemCount: cart.itemCount,
            subtotal: { amount: subtotal, currency },
            shipping: { amount: shipping, currency },
            total: { amount: cents(subtotal + shipping), currency },
            toFreeShipping: {
                amount: cents(Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)),
                currency,
            },
            freeShippingPercent: Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100),
        };
    }, [cart.subtotal.amount, cart.subtotal.currency, cart.itemCount]);

    const add = useCallback(
        async (variantId: string, quantity = 1) => {
            try {
                await addToCart({ variantId, quantity }).unwrap();
                dispatch(lineAdded(variantId));
                toast.success('Added to your basket.');
                return true;
            } catch (err) {
                console.error('Add to cart failed:', err);
                toast.error('We could not add that. Please try again.');
                return false;
            }
        },
        [addToCart, dispatch],
    );

    const setQuantity = useCallback(
        async (variantId: string, quantity: number) => {
            const clamped = Math.max(1, Math.min(MAX_QUANTITY, quantity));

            try {
                await setQuantityMutation({ variantId, quantity: clamped }).unwrap();
            } catch (err) {
                console.error('Cart update failed:', err);
                toast.error('We could not change that quantity.');
            }
        },
        [setQuantityMutation],
    );

    const remove = useCallback(
        async (variantId: string) => {
            const line = cart.lines.find((item) => item.variantId === variantId);

            try {
                await removeMutation(variantId).unwrap();
                // Only offered once the removal actually happened, so "Undo"
                // never appears over a line that is still in the basket.
                if (line) {
                    dispatch(
                        lineRemoved({
                            variantId,
                            name: line.name,
                            quantity: line.quantity,
                        }),
                    );
                }
            } catch (err) {
                console.error('Cart removal failed:', err);
                toast.error('We could not remove that. Please try again.');
            }
        },
        [cart.lines, removeMutation, dispatch],
    );

    /** Puts the last removed line back, at the quantity it had. */
    const undoRemove = useCallback(async () => {
        if (!removed) return;

        // Cleared first: the offer is spent whether or not the request lands,
        // and leaving it up invites a second click that adds a second copy.
        dispatch(removalCleared());

        try {
            await addToCart({
                variantId: removed.variantId,
                quantity: removed.quantity,
            }).unwrap();
        } catch (err) {
            console.error('Undo failed:', err);
            toast.error('We could not put that back. Try adding it again.');
        }
    }, [removed, addToCart, dispatch]);

    const dismissUndo = useCallback(() => dispatch(removalCleared()), [dispatch]);

    return {
        lines: cart.lines,
        cartId: cart.cartId,
        hasPriceDrift: cart.hasPriceDrift,
        totals,
        removed,
        isLoading: isLoading && isAuthenticated,
        isFetching,
        error: error as ApiError,
        /** True while any write is in flight, for disabling a checkout button. */
        isMutating: addState.isLoading || quantityState.isLoading,
        add,
        setQuantity,
        remove,
        undoRemove,
        dismissUndo,
    };
}

export type CartState = ReturnType<typeof useCart>;
