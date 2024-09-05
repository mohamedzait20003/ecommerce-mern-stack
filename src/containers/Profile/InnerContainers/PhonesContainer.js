// Libraries
import React, {useState, useEffect} from 'react'
import { Box } from '@mui/material'

// Components
import PhoneContainer from './PhoneContainer';
import AddPhoneContainer from './AddPhoneContainer';

const PhonesContainer = ({ user }) => {
    // User Data
    const [phones, setPhones] = useState([]);
    useEffect(() => {
        setPhones(user?.phoneNumbers || []);
    }, [user]);

    const renderPhoneNumbers = () => {
        if (phones.length > 0) {
            return phones.map((phone, index) => (
                <PhoneContainer key={index} phone={phone} />
            ));
        } else {
            return (
                <div className="flex items-center justify-center">
                    You haven't Added any Phone Numbers.
                </div>
            );
        }
    };

    return (
        <Box className="flex flex-col px-2 py-3 gap-6 mt-3">
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Phone</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <AddPhoneContainer />
            <Box className="flex flex-col mt-4 py-3">
                {renderPhoneNumbers()}
            </Box>
        </Box>
    )
}

export default PhonesContainer