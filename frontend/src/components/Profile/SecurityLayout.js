// Libraries
import React from 'react';
import { useSelector } from 'react-redux';

// Containers
import PassContainer from '../../containers/Profile/SecurityLayout/PassContainer';
import AccountsLink from '../../containers/Profile/SecurityLayout/AccountsLink';

const SecuritySubContainer = () => {
  // User State
  const user = useSelector(state => state?.auth?.user);

  return (
    <section className='w-full px-3'>
        <PassContainer user={user} />
        <AccountsLink user={user} />
    </section>
  )
}

export default SecuritySubContainer