// Libraries
import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import { toast } from 'react-toastify'
import axios from 'axios'

// Context
import Context from '../../../context/index';

// Common
import SummaryApi from '../../../common/index'

const DeleteAccount = ({ user }) => {
    // Navigate
    const navigate = useNavigate();

    // Context Handler
    const { fetchUserDetails } = useContext(Context);

    const handleRemoveAccount = async (e) => {
        e.preventDefault();
        const response = await axios({
            url: SummaryApi.DeleteAccount.url,
            method: SummaryApi.DeleteAccount.method,
            data: JSON.stringify({
                Id: user?._id
            }),
            headers: {
                'Content-Type': 'application/json'
            },

        });

        if (response.data.success) {
            toast.success(response.data.message);
            fetchUserDetails();
            navigate('/');
        } else {
            toast.error(response.data.message);
        }
    }

    return (
        <Box className="flex flex-col px-2 py-3 gap-6 mt-3">
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Delete Account</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            
            <Box className="w-full flex flex-col items-start justify-center gap-6 mt-3">
                <Typography>
                    Once you delete your account, there is no going back. Please be certain.
                </Typography>
                <Button variant="contained" color="error"  onClick={handleRemoveAccount}>Remove Account</Button>
            </Box>
        </Box>
    )
}

export default DeleteAccount