// Libraries
import { createSlice } from "@reduxjs/toolkit";

// Inital State
const initialState = {
    user: null,
};

// Slice
export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            console.log("User Details:", action.payload);
            state.user = action.payload;
        },
    },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
