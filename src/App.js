// Libraries
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';

// API
import SummaryApi from './common/index';

function App() {
  const fetchUserDetails = async () => {
    const response = await fetch(SummaryApi.current_user.url, {
      method: SummaryApi.current_user.method,
      credentials: 'include',
    });

    const dataAPI = await response.json();
    console.log("dataAPI", response);
  }

  useEffect(() => {
    fetchUserDetails();
  }, []);

  return (
    <>
      <ToastContainer />
      <Header />
      <main className='lg:min-h-[calc(100vh-100px)] sm:min-h-[calc(90vh-100px)] min-h-[calc(71vh-100px)]'>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default App;
