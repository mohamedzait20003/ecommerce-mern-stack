// Libraries
import { createSlice } from "@reduxjs/toolkit";

// Inital State
const initialState = {
    items: [],
};

// Slice
export const cartSlice = createSlice({
    name: "order",
    initialState,
    reducers: {
        setCart: (state, action) => {
            state.items = action.payload;
        },
    },
});

export const { setCart } = cartSlice.actions;
export default cartSlice.reducer;