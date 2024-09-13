// Libraries
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';

// Context Provider
import { ContextProvider } from './context';

// Files
import reportWebVitals from './reportWebVitals';
import './index.css';
import router from './routes';
import store from './stores/store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ContextProvider>
        <RouterProvider router={router} />
      </ContextProvider>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
