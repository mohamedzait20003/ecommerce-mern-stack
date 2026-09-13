import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { hydrateRoot } from 'react-dom/client';
import { StrictMode, startTransition } from 'react';
import { setupListeners } from '@reduxjs/toolkit/query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RouterProvider, createBrowserRouter, type HydrationState } from 'react-router-dom';

import { routes } from './routes';
import { makeStore, type RootState } from './store';

declare global {
  interface Window {
    __PRELOADED_STATE__?: Partial<RootState>;
    __staticRouterHydrationData?: HydrationState;
  }
}

const preloadedState = window.__PRELOADED_STATE__;
delete window.__PRELOADED_STATE__;

const store = makeStore({ preloadedState });

// Rehydrates `gen` from localStorage. No PersistGate: blocking the first paint
// on an async read would undo the point of the pre-paint script, and the only
// persisted value is the theme, which is already on screen by then.
persistStore(store);

// Refetch cached queries when the tab comes back or the network returns.
setupListeners(store.dispatch);

const router = createBrowserRouter(routes, {
  hydrationData: window.__staticRouterHydrationData,
});

startTransition(() => {
  hydrateRoot(
    document.getElementById('root')!,
    <StrictMode>
      <Provider store={store}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <RouterProvider router={router} />
        </GoogleOAuthProvider>
      </Provider>
    </StrictMode>
  );
});
