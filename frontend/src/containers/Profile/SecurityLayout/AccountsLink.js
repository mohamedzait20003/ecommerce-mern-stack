// Libraries
import React, { useState, useEffect } from 'react'
import { Box, Button, TextField, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText } from '@mui/material'

// Icons
import { FcGoogle } from "react-icons/fc";
import { MdOutlineDoneOutline } from "react-icons/md";
import { FaFacebookSquare } from "react-icons/fa";

const AccountsLink = ({ user }) => {
    // Auth State
    const [LinkCheck, setLinkCheck] = useState(null);
    useEffect(() => {
        setLinkCheck(user?.LinkCheck);
    }, [user]);

    // Dialog State
    const [open, setOpen] = useState(false);
    const [unlink, setUnlink] = useState('');
    const [unlinkConfirm, setUnlinkConfirm] = useState('');
    const openDialog = (e) => {
        e.preventDefault();
        setOpen(true);
        setUnlink(e.target.name);
    }

    // Google Link Functions
    const handleGoogleLink = async(e) => {
        e.preventDefault();
        window.open(`http://localhost:8080/api/link-google`, '_self');
    }
    const handleGoogleUnlink = async(e) => {
        e.preventDefault();
    }

    // Facebook Link Functions
    const handleFacebookLink = async(e) => {
        e.preventDefault();
    }

    return (
        <Box className="flex flex-col px-2 py-3 gap-6 mt-5">
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Link Your Account</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Box className='flex flex-row items-center justify-evenly mt-4'>
                {LinkCheck?.google ? (
                    <Button className='flex gap-2' onClick={openDialog} sx={{ px: 3, py:2, border: '2px solid black', borderRadius: '10px', backgroundColor: '#d2f1e2', '&:hover': { backgroundColor: '#eabfbf'}  }}>
                        <MdOutlineDoneOutline size={24} className='text-4xl' />
                        <h3 className='text-xl font-mono font-bold text-black'>
                            Linked to Google
                        </h3>
                    </Button>
                ) : (
                    <Button className='flex gap-2' onClick={handleGoogleLink} sx={{ px: 3, py:2, border: '2px solid black', borderRadius: '10px' }}>
                        <FcGoogle size={24} className='text-4xl' />
                        <h3 className='text-xl font-mono font-bold text-black'>
                            Link to Google
                        </h3>
                    </Button>
                )}
                <Button className='flex gap-2' onClick={handleFacebookLink} sx={{ px: 3, py:2, border: '2px solid black', borderRadius: '10px' }}>
                    <FaFacebookSquare className='text-4xl text-blue-600' />
                    <h3 className='text-xl font-mono font-bold text-black'>
                        Link to Facebook
                    </h3>
                </Button>
            </Box>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Unlink Account</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to unlink your {unlink} account?
                    </DialogContentText>
                    <TextField autoFocus label="Type Unlink Account" type="text" fullWidth variant="standard" value={unlinkConfirm} onChange={(e) => setUnlinkConfirm(e.target.value)} sx={{ mt: 2 }} />
                </DialogContent>
                <DialogActions>
                    <Box className="w-full flex flex-row items-center justify-between px-3">
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleGoogleUnlink} color='error' disabled={unlinkConfirm !== 'Unlink Account'}>Unlink</Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default AccountsLink