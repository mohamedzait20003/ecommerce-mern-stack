// Libraries
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Containers
import PassContainer from '../InnerContainers/PassContainer';

const SecuritySubContainer = () => {
  // User State
  const userState = useSelector(state => state?.user?.user);
  const [user, setUser] = useState(userState);

  useEffect(() => {
      setUser(userState);
  }, [userState]);

  return (
    <section className='w-full px-3'>
        <PassContainer user={user} />
    </section>
  )
}

export default SecuritySubContainer