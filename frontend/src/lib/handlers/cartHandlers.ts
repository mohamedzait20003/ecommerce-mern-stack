import baseHandler from './baseHandler';

import type { ApiEnvelope } from '../models/genModels';
import type {
    AddToCartRequest,
    CartQuantityRequest,
    CartResponse,
} from '../models/cartModels';

const unwrap = (response: ApiEnvelope<CartResponse>): CartResponse => response.data;

/**
 * Every cart endpoint answers with the whole cart.
 *
 * So none of them need to invalidate and refetch: the response to "add this" is
 * already the new basket, and writing it straight into the cache saves a round
 * trip and removes the window where the badge and the page disagree.
 */
const writeThrough = async (
    _arg: unknown,
    {
        dispatch,
        queryFulfilled,
    }: { dispatch: (action: unknown) => unknown; queryFulfilled: Promise<{ data: CartResponse }> },
) => {
    try {
        const { data } = await queryFulfilled;
        dispatch(cartHandlers.util.upsertQueryData('getCart', undefined, data));
    } catch {
        // The mutation's own error state is what the caller renders; there is
        // nothing to write, and the cache keeps whatever it already had.
    }
};

export const cartHandlers = baseHandler.injectEndpoints({
    endpoints: (builder) => ({
        getCart: builder.query<CartResponse, void>({
            query: () => '/cart',
            transformResponse: unwrap,
            providesTags: ['Cart'],
        }),

        addToCart: builder.mutation<CartResponse, AddToCartRequest>({
            query: (body) => ({ url: '/cart/items', method: 'POST', body }),
            transformResponse: unwrap,
            onQueryStarted: writeThrough,
        }),

        /** Sets an absolute quantity. Zero removes the line, as the API defines it. */
        setCartQuantity: builder.mutation<CartResponse, CartQuantityRequest>({
            query: ({ variantId, quantity }) => ({
                url: `/cart/items/${variantId}`,
                method: 'PATCH',
                body: { quantity },
            }),
            transformResponse: unwrap,
            // Optimistic, because this one is driven by a stepper: waiting a
            // round trip to move a 1 to a 2 makes the button feel broken and
            // invites a second press. Rolled back if the server disagrees.
            onQueryStarted: async ({ variantId, quantity }, { dispatch, queryFulfilled }) => {
                const patch = dispatch(
                    cartHandlers.util.updateQueryData('getCart', undefined, (draft) => {
                        const line = draft.lines.find((item) => item.variantId === variantId);
                        if (!line) return;

                        const delta = quantity - line.quantity;
                        line.quantity = quantity;
                        line.lineTotal.amount = line.unitPrice.amount * quantity;
                        draft.itemCount += delta;
                        draft.subtotal.amount += line.unitPrice.amount * delta;
                    }),
                );

                try {
                    const { data } = await queryFulfilled;
                    dispatch(cartHandlers.util.upsertQueryData('getCart', undefined, data));
                } catch {
                    patch.undo();
                }
            },
        }),

        removeFromCart: builder.mutation<CartResponse, string>({
            query: (variantId) => ({ url: `/cart/items/${variantId}`, method: 'DELETE' }),
            transformResponse: unwrap,
            onQueryStarted: writeThrough,
        }),

        clearCart: builder.mutation<CartResponse, void>({
            query: () => ({ url: '/cart', method: 'DELETE' }),
            transformResponse: unwrap,
            onQueryStarted: writeThrough,
        }),
    }),
});

export const {
    useGetCartQuery,
    useAddToCartMutation,
    useSetCartQuantityMutation,
    useRemoveFromCartMutation,
    useClearCartMutation,
} = cartHandlers;

export default cartHandlers;
