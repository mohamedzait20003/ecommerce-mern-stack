// Libraries
import React from 'react';
import { useSelector } from 'react-redux';

// Containers
import PictureContainer from '../../containers/Profile/ProfileLayout/PictureContainer';
import NameContainer from '../../containers/Profile/ProfileLayout/NameContainer';
import DeleteAccount from '../../containers/Profile/ProfileLayout/DeleteAccount';

const ProfileLayout = () => {
  // User State
  const user = useSelector(state => state?.auth?.user);

  return (
    <section className='w-full px-3'>
      <PictureContainer user={user} />
      <NameContainer user={user} />
      <DeleteAccount user={user} />
    </section>
  );
};

export default ProfileLayout;