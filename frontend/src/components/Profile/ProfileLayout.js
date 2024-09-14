// Libraries
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Containers
import PictureContainer from '../../containers/Profile/PictureContainer';
import NameContainer from '../../containers/Profile/NameContainer';
import DeleteAccount from '../../containers/Profile/DeleteAccount';
import AccountsLink from '../../containers/Profile/AccountsLink';

const ProfileLayout = () => {
  // User State
  const userState = useSelector(state => state?.user?.user);
  const [user, setUser] = useState(userState);

  useEffect(() => {
      setUser(userState);
  }, [userState]);

  return (
    <section className='w-full px-3'>
      <PictureContainer user={user} />
      <NameContainer user={user} />
      <DeleteAccount user={user} />
      <AccountsLink user={user} />
    </section>
  );
};

export default ProfileLayout;