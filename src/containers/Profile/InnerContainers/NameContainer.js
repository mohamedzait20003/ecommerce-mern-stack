// Libraries
import React, { useState, useEffect, useContext } from 'react'
import { Box, TextField, Button, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Context
import Context from '../../../context/index';

// Common
import SummaryApi from '../../../common/index';

const NameContainer = () => {
    // User Data
    const userState = useSelector(state => state?.user?.user);
    const [user, setUser] = useState(userState);

    useEffect(() => {
        setUser(userState);
    }, [userState]);

    // New Username
    const [newUsername, setnewUsername] = useState('');

    // Context Handler
    const { fetchUserDetails } = useContext(Context);

    // Submit Handler
    const handleUsernameChange = async(e) => {
        e.preventDefault();
        const response = await axios({
            url: SummaryApi.ChangeUsername.url,
            method: SummaryApi.ChangeUsername.method,
            data: JSON.stringify({
                Id: user?._id,                
                username: newUsername
            }),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.data.success) {
            toast.success(response.data.message);
            setnewUsername('');
            fetchUserDetails();
        } else {
            toast.error(response.data.message);
        }
    }

    return (
            <Box className="flex flex-col px-2 py-3 gap-6 mt-3">
                <Box className='w-fit flex flex-col gap-1'>
                    <h3 className='text-xl font-mono font-bold'>User Name</h3>
                    <hr className='w-3/4 border-1 border-black' />
                </Box>
                <Typography variant="body1" className='text-lg'>{user?.username || 'No username available'}</Typography>
                <Box className="w-full flex justify-between">
                    <TextField label="Enter New User Name" variant="outlined" style={{ flexGrow: 1, marginRight: '16px' }} value={newUsername} onChange={(e) => setnewUsername(e.target.value)} />
                    <Button variant="contained" color="primary"  onClick={handleUsernameChange}>Save Changes</Button>
                </Box>
            </Box>
        )
}

export default NameContainer