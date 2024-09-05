// Libraries
import React from 'react';

// Containers
import PictureContainer from '../InnerContainers/PictureContainer';
import NameContainer from '../InnerContainers/NameContainer';
import DeleteAccount from '../InnerContainers/DeleteAccount';

// Common
import userData from '../../../common/UserData';

const ProfileSubContainer = () => {
  // User Data
  const user = userData();

  return (
    <section className='w-full px-3'>
      <PictureContainer user={user} />
      <NameContainer user={user} />
      <DeleteAccount user={user} />
    </section>
  );
};

export default ProfileSubContainer;