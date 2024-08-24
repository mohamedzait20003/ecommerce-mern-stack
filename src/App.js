// Libraries
import React, { useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import { useDispatch } from 'react-redux';

// Styles
import 'react-toastify/dist/ReactToastify.css';

// Components
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';

// Context
import Context from './context/index';
import { setUser } from './stores/slices/userSlice';

// Summary Api
import SummaryApi from './common/index';

function App() {
  const dispatch = useDispatch();
  
  const fetchUserDetails = useCallback(async() => {
    try {
      const response = await axios({
        url: SummaryApi.current_user.url,
        method: SummaryApi.current_user.method,
        withCredentials: true
      });
  
      const response_data = response.data;
      console.log("User Details:", response_data);
      
      if(response_data.success){
        dispatch(setUser(response_data.data));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  },[dispatch]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);
  
  return (
    <Context.Provider value={{ fetchUserDetails }}>
      <ToastContainer />
      <Header />
      <main className='min-h-[calc(100vh-110px)] flex flex-col'>
        <Outlet />
      </main>
      <Footer />
    </Context.Provider>
  );
}

export default App;
