// Libraries
import React, {useState, useEffect} from 'react'
import { Box, Button } from '@mui/material'
import { useSelector } from 'react-redux';

// Components
import PhoneContainer from './PhoneContainer';

import { IoAddCircle } from "react-icons/io5";

const PhonesContainer = () => {
     // User Data
     const userState = useSelector(state => state?.user?.user);
     const [user, setUser] = useState(userState);
     useEffect(() => {
         setUser(userState);
     }, [userState]);

    return (
        <Box className="flex flex-col px-2 py-3 gap-6 mt-3">
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Phone</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Box className="flex justify-end">
                <Button variant="contained" color="primary"><IoAddCircle className="mr-2" />Add Phone Number</Button>

            </Box>
            <Box className="flex flex-col mt-4 py-3">
                {user?.phoneNumbers?.length > 0 ? (
                    user.phoneNumbers.map((phone, index) => (
                        <PhoneContainer key={index} phone={phone} />
                    ))
                ) : (
                    <div className="flex items-center justify-center">
                        You haven't Added any Phone Numbers.
                    </div>
                )}
            </Box>
        </Box>
    )
}

export default PhonesContainer