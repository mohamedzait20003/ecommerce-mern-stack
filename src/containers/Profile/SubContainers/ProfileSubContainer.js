// Libraries
import React from 'react'

// Containers
import PictureContainer from '../InnerContainers/PictureContainer';
import NameContainer from '../InnerContainers/NameContainer';
import PhonesContainer from '../InnerContainers/PhonesContainer';

const ProfileSubContainer = () => {
  return (
    <section className='w-full px-3'>
        <PictureContainer />
        <NameContainer />
        <PhonesContainer />
    </section>
  )
}

export default ProfileSubContainer