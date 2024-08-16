// Libraries
import { configureStore } from "@reduxjs/toolkit";

// Slices
import userReducer from "./slices/userSlice";

// Store
const store = configureStore({
    reducer: {
        user: userReducer,
    },
});

export default store;