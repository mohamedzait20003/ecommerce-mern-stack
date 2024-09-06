// Libraries
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Components
import Starter from '../components/Starter';
import Admin from '../components/Admin';
import User from '../components/User';

const Home = () => {
  // User Data
  const userState = useSelector(state => state?.user?.user);
  const [user, setUser] = useState(userState);

  useEffect(() => {
    setUser(userState);
  }, [userState]);

  return (
    <>
      {user?.Role === 'Admin' ? (
        <Admin />
      ) : user?.Role === 'User' ? (
        <User />
      ) : (
        <Starter />
      )}
    </>
  );
};

export default Home;