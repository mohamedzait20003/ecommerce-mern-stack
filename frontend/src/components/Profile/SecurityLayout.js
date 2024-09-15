// Libraries
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Containers
import PassContainer from '../../containers/Profile/SecurityLayout/PassContainer';

const SecuritySubContainer = () => {
  // User State
  const userState = useSelector(state => state?.auth?.user);
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