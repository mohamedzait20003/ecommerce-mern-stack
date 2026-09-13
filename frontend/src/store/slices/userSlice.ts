import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import { sessionExpired } from '@/lib/handlers/baseHandler';
import { userHandlers } from '@/lib/handlers/userHandlers';

import type { Session } from '@/lib/auth/session';
import type { AuthenticatedUser, UserState } from '@/lib/models/userModels';

const {
    signIn,
    googleSignIn,
    refresh,
    signOut,
    verifyEmail,
    resetPassword,
    updatePicture,
} = userHandlers.endpoints;

const initialState: UserState = {
    id: null,
    publicUserId: null,
    role: null,
    isAuthenticated: false,
    isVerified: false,
    displayName: '',
    username: '',
    email: '',

    firstName: '',
    lastName: '',
    profilePicURL: undefined,
    faEnabled: false,
    gender: undefined,
    dateOfBirth: '',
    locale: 'en',
    timeZone: 'UTC',

    customerProfile: undefined,
};

export const userStateFromSession = (session: Session | null): UserState => session ? {
    ...initialState,
    role: session.role,
    publicUserId: session.publicUserId,
    isVerified: session.isVerified,
    isAuthenticated: true,
} : initialState;

const identify = (state: UserState, user: AuthenticatedUser) => {
    state.id = user.id;
    state.publicUserId = user.publicUserId;
    state.role = user.role;
    state.isAuthenticated = true;
    state.isVerified = user.verified;
    state.displayName = user.displayName;
    state.username = user.username;
    state.email = user.email;
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addMatcher(isAnyOf(signIn.matchFulfilled, googleSignIn.matchFulfilled, refresh.matchFulfilled),
                (state, action) => identify(state, action.payload),
            )
            .addMatcher(verifyEmail.matchFulfilled, (state) => {
                state.isVerified = true;
            })
            .addMatcher(
                isAnyOf(
                    signOut.matchFulfilled,
                    signOut.matchRejected,
                    resetPassword.matchFulfilled,
                    sessionExpired.match,
                ),
                () => initialState,
            )
            .addMatcher(updatePicture.matchFulfilled, (state, action) => {
                state.profilePicURL = action.payload;
            });
    },
});

export const selectUser = (state: { user: UserState }) => state.user;

export default userSlice.reducer;
