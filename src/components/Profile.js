// Libraries
import React from 'react'

// Containers
import PictureContainer from '../containers/Profile/PictureContainer';
import NameContainer from '../containers/Profile/NameContainer';
import PassContainer from '../containers/Profile/PassContainer';
import PhonesContainer from '../containers/Profile/PhonesContainer';

const Profile = ({ user }) => {
    return (
        <section className='w-full px-3'>
            <PictureContainer />
            <NameContainer />
            <PassContainer />
            <PhonesContainer />
        </section>
    )
}

export default Profile