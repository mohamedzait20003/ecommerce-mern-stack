// Libraries
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Containers
import PictureContainer from '../InnerContainers/PictureContainer';
import NameContainer from '../InnerContainers/NameContainer';
import DeleteAccount from '../InnerContainers/DeleteAccount';
import AccountsLink from '../InnerContainers/AccountsLink';

const ProfileSubContainer = () => {
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

export default ProfileSubContainer;