// Libraries
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button } from '@mui/material'

const PassContainer = () => {
    // Navigation
    const navigate = useNavigate()

    const handleClick = () => {
        navigate('/password-change')
    }

    return (
        <Box className="flex flex-col px-2 py-3 gap-6 mt-3">
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Password</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Button variant="contained" color="primary" className="w-1/5 flex place-self-end mt-2" onClick={handleClick}>Change Password</Button>
        </Box>
    )
}

export default PassContainer