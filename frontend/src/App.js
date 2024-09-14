// Libraries
import React, { useEffect, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Styles
import 'react-toastify/dist/ReactToastify.css';

// Components
import './App.css';
import Header from './components/User/Header';
import Footer from './components/User/Footer';

// Context
import Context from './context/index';

function App() {
  const { fetchUserDetails } = useContext(Context);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);
  
  return (
    <>
      <ToastContainer />
      <Header />
      <main className='min-h-[calc(100vh-110px)] flex flex-col'>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default App;