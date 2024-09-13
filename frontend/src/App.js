// Libraries
import React, { useEffect, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Styles
import 'react-toastify/dist/ReactToastify.css';

// Components
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';

// Context
import Context, { ContextProvider } from './context/index';

function App() {
  const { fetchUserDetails } = useContext(Context);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);
  
  return (
    <ContextProvider>
      <ToastContainer />
      <Header />
      <main className='min-h-[calc(100vh-110px)] flex flex-col'>
        <Outlet />
      </main>
      <Footer />
    </ContextProvider>
  );
}

export default App;
