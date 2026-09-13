import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CartUiState, RemovedLine } from '@/lib/models/cartModels';

const initialState: CartUiState = {
    lastRemoved: null,
    lastAdded: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        /** A line left the basket. Holds enough to add it back at its quantity. */
        lineRemoved(state, action: PayloadAction<RemovedLine>) {
            state.lastRemoved = action.payload;
        },

        /** The undo was taken, dismissed, or has gone stale. */
        removalCleared(state) {
            state.lastRemoved = null;
        },

        /** A variant went in, so a tile can acknowledge it. */
        lineAdded(state, action: PayloadAction<string>) {
            state.lastAdded = action.payload;
            // Adding something back is the end of the removal it undid.
            if (state.lastRemoved?.variantId === action.payload) {
                state.lastRemoved = null;
            }
        },

        additionAcknowledged(state) {
            state.lastAdded = null;
        },

        /** Signing out must not leave the next account holding an undo offer. */
        cartUiReset() {
            return initialState;
        },
    },
});

export const {
    lineRemoved,
    removalCleared,
    lineAdded,
    additionAcknowledged,
    cartUiReset,
} = cartSlice.actions;

export const selectLastRemoved = (state: { cart: CartUiState }) => state.cart.lastRemoved;
export const selectLastAdded = (state: { cart: CartUiState }) => state.cart.lastAdded;

export default cartSlice.reducer;
