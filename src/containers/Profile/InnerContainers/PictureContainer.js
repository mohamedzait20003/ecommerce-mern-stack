// Librairies
import React, {useState, useEffect} from 'react'
import { useSelector } from 'react-redux';
import { Box, Button, Avatar } from '@mui/material'

// Icons
import { FaUser } from 'react-icons/fa';

const PictureContainer = () => {
    // User Data
    const userState = useSelector(state => state?.user?.user);
    const [user, setUser] = useState(userState);

    useEffect(() => {
        setUser(userState);
    }, [userState]);

    return (
        <Box className='flex flex-col px-2 py-3 gap-6'>
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Profile Image</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Box className="w-full flex justify-between mt-4">
                <Box>
                    {user?.profilePic ? (
                        <Avatar src={user?.profilePic} alt="Profile" sx={{ width: 80, height: 80 }} />
                        ) : (
                        <FaUser className='w-20 h-20' />
                    )}
                </Box>
                <Box className="flex flex-col gap-4">
                    <Button variant="contained" component="label">
                        Upload File
                        <input type="file" hidden />
                    </Button>
                    <Button variant="contained" color="primary">
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default PictureContainer