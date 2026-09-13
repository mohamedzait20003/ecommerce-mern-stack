import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
    FLUSH,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    REHYDRATE,
    persistReducer,
    type Storage,
} from 'redux-persist';

import baseHandler, { type ApiExtra } from '@/lib/handlers/baseHandler';

import cartReducer from './slices/cartSlice';
import genReducer from './slices/genSlice';
import userReducer from './slices/userSlice';


const storage: Storage = typeof window === 'undefined' ? {
    getItem: () => Promise.resolve(null),
    setItem: (_key, value) => Promise.resolve(value),
    removeItem: () => Promise.resolve(),
} : {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => {
        localStorage.setItem(key, value);
        return Promise.resolve(value);
    },
    removeItem: (key) => {
        localStorage.removeItem(key);
        return Promise.resolve();
    },
};

const persistedGenReducer = persistReducer({ key: 'gen', storage }, genReducer);

const rootReducer = combineReducers({
    gen: persistedGenReducer,
    user: userReducer,
    // Not persisted: an undo offer that survived a restart would be offering to
    // restore something from last week.
    cart: cartReducer,
    [baseHandler.reducerPath]: baseHandler.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export interface StoreOptions {
    preloadedState?: Partial<RootState>;
    cookie?: string;
}

export const makeStore = ({ preloadedState, cookie }: StoreOptions = {}) => configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        thunk: { extraArgument: { cookie } satisfies ApiExtra },
        serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
    }).concat(baseHandler.middleware),
});

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export default makeStore;
