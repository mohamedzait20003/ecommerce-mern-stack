// Libraries
import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { toast } from 'react-toastify'
import axios from 'axios'

// Context
import Context from '../../../context/index';

// Common
import SummaryApi from '../../../common/index'

const DeleteAccount = ({ user }) => {
    // Dialog State
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setInputValue('');
    };

    // Delete Account Check
    const [inputValue, setInputValue] = useState('');

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
                <h3 className='text-xl font-mono font-bold'>Delete Your Account</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Box className="w-full flex flex-col items-start justify-center gap-6 mt-3">
                <Button variant="contained" color="error"  onClick={handleOpen}>Remove Account</Button>
            </Box>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{"Delete Account"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete your account?
                    </DialogContentText>
                    <TextField autoFocus label="Type Delete Account" type="text" fullWidth variant="standard" value={inputValue} onChange={(e) => setInputValue(e.target.value)} sx={{ mt: 2 }} />
                </DialogContent>
                <DialogActions>
                    <Box className="w-full flex flex-row items-center justify-between px-3">
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleRemoveAccount} color="error" disabled={inputValue !== 'Delete Account'}>Delete</Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default DeleteAccount