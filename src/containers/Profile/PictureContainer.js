// Librairies
import React from 'react'
import { Box, Button } from '@mui/material'

const PictureContainer = () => {
    return (
        <Box className='flex flex-col px-2 py-3 gap-6'>
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Profile Image</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Box className="w-full flex justify-between">
                <Button variant="contained" component="label">
                    Upload File
                    <input type="file" hidden />
                </Button>
                <Button variant="contained" color="primary">
                    Save Changes
                </Button>
            </Box>
        </Box>
    )
}

export default PictureContainer