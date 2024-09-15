// Libraries
import { configureStore } from "@reduxjs/toolkit";

// Slices
import authReducer from "./slices/authSlice";
import orderReducer from "./slices/ordersSlice";

// Store
const store = configureStore({
    reducer: {
        auth: authReducer,
        order: orderReducer,
    },
});

export default store;