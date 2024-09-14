// Librairies
import React, { useState, useEffect, useContext } from 'react'
import { Box, Button, Avatar } from '@mui/material'
import { toast } from 'react-toastify';
import axios from 'axios';

// Helpers
import imagetobase64 from '../../helpers/imagetobase64';

// Context
import Context from '../../context/index';

// Common
import SummaryApi from '../../common/index';

// Icons
import { FaUser } from 'react-icons/fa';

const PictureContainer = ({ user }) => {
    // Profile Pic
    const [profilePic, setProfilePic] = useState('');
    useEffect(() => {
        setProfilePic(user?.profilePic || '');
    }, [user]);

    const handleUploadPic = async (e) => {
        const file = e.target.files[0];
        const imagePic = await imagetobase64(file);
        setProfilePic(imagePic);
    };

    // Context Handler
    const { fetchUserDetails } = useContext(Context);

    const handleUpdatePic = async (e) => {
        e.preventDefault();
        const response = await axios({
            url: SummaryApi.ChangeProfilePic.url,
            method: SummaryApi.ChangeProfilePic.method,
            data: JSON.stringify({
                Id: user?._id,                
                profilePic: profilePic
            }),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.data.success) {
            toast.success(response.data.message);
            fetchUserDetails();
        } else {
            toast.error(response.data.message);
        }
    };

    const handleRemovePic = async (e) => {
        e.preventDefault();
        const response = await axios({
            url: SummaryApi.RemoveProfilePic.url,
            method: SummaryApi.RemoveProfilePic.method,
            data: JSON.stringify({
                Id: user?._id,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.data.success) {
            toast.success(response.data.message);
            fetchUserDetails();
        } else {
            toast.error(response.data.message);
        }
    }

    return (
        <Box className='flex flex-col px-2 py-3 gap-6'>
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Profile Image</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Box className="w-full flex justify-between mt-4">
                <Box>
                    {profilePic ? (
                        <Avatar src={profilePic} alt="Profile" sx={{ width: 80, height: 80 }} />
                    ) : (
                        <FaUser className='w-20 h-20' />
                    )}
                </Box>
                <Box className="flex flex-col gap-4">
                    <Button variant="contained" color="secondary" onClick={handleRemovePic}>
                        Remove
                    </Button>
                    <Box className="flex flex-row gap-6">
                        <Button variant="contained" component="label">
                            Upload File
                            <input type="file" hidden onChange={handleUploadPic} />
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleUpdatePic}>
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default PictureContainer