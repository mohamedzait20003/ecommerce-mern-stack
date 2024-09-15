// Libraries
import { createSlice } from "@reduxjs/toolkit";

// Inital State
const initialState = {
    user: null,
    Role: null,
    Authorized: false,
};

// Slice
export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setRole: (state, action) => {
            state.Role = action.payload;
        },
        setAuthorized: (state, action) => {
            state.Authorized = action.payload;
        },
    },
});

// Export Actions
export const { setUser, setRole, setAuthorized } = authSlice.actions;
export default authSlice.reducer;
