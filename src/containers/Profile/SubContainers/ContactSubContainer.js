// Libraries
import React from 'react'

// Containers
import PhonesContainer from '../InnerContainers/PhonesContainer';

// Common
import userData from '../../../common/UserData';

const ContactSubContainer = () => {
    // User Data
    const user = userData();

    return (
        <section className='w-full px-3'>
            <PhonesContainer user={user} />
        </section>
    )
}

export default ContactSubContainer