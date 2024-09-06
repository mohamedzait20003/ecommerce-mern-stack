// Libraries
import { configureStore } from "@reduxjs/toolkit";

// Slices
import userReducer from "./slices/userSlice";
import orderReducer from "./slices/ordersSlice";

// Store
const store = configureStore({
    reducer: {
        user: userReducer,
        order: orderReducer,
    },
});

export default store;