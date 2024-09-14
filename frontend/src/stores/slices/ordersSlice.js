// Libraries
import { createSlice } from "@reduxjs/toolkit";

// Inital State
const initialState = {
    orders: [],
};

// Slice
export const ordersSlice = createSlice({
    name: "order",
    initialState,
    reducers: {
        setOrders: (state, action) => {
            state.orders = action.payload;
        },
    },
});

export const { setOrders } = ordersSlice.actions;
export default ordersSlice.reducer;