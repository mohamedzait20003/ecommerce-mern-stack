// Libraries
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Containers
import PhonesContainer from '../InnerContainers/PhonesContainer';

const ContactSubContainer = () => {
    const userState = useSelector(state => state?.user?.user);
    const [user, setUser] = useState(userState);

    useEffect(() => {
        setUser(userState);
    }, [userState]);


    return (
        <section className='w-full px-3'>
            <PhonesContainer user={user} />
        </section>
    )
}

export default ContactSubContainer