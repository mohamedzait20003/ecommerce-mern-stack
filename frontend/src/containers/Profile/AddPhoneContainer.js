// Libraries
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import OtpInput from 'react-otp-input';

// Styles
import 'react-phone-input-2/lib/style.css';

// Icons
import { IoAddCircle, IoClose } from "react-icons/io5";

const AddPhoneContainer = () => {
    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [stage, setStage] = useState(1);

    // Data
    const [phone, setPhone] = useState(null);
    const [otp, setOtp] = useState(null);

    // Dialog Handlers
    const handleOpen = () => {
        console.log("Opening dialog");
        setDialogOpen(true);
    };
    const handleClose = () => {
        console.log("Closing dialog");
        setDialogOpen(false);
        setPhone(null);
        setOtp(null);
        setStage(1);
    };

    return (
        <>
            <Box className="flex justify-end">
                <Button variant="contained" color="primary" onClick={handleOpen}>
                    <IoAddCircle className="mr-2" />Add Phone Number
                </Button>
            </Box>
            <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth >
            <DialogTitle>
                    <IconButton aria-label="close" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8,  color: (theme) => theme.palette.grey[500] }} >
                        <IoClose />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" className='text-left'>
                        {stage === 1 ? 'Enter your Phone Number' : 'Enter the OTP'}
                    </Typography>
                    <Box className='w-full flex items-center justify-center mt-8'>
                        {stage === 1 ? (
                            <PhoneInput country={'eg'} value={phone} onChange={setPhone} inputStyle={{ width: '100%' }} />
                        ) : (
                            <OtpInput 
                                value={otp} 
                                onChange={setOtp} 
                                numInputs={6} 
                                separator={<span>-</span>} 
                                inputStyle={{ width: '2rem', height: '2rem', margin: '0 0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.3)' }} 
                                renderInput={(props) => <input {...props} />}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Box className='w-full flex flex-row items-center justify-between'>
                        <Box>
                            {stage === 1 ? (
                                <Button variant="contained" color="secondary" onClick={handleClose}>
                                    Cancel
                                </Button>
                            ) : (
                                <Button variant="contained" color="secondary" onClick={() => setStage(1)}>
                                    Back
                                </Button>
                            )}
                        </Box>
                        <Box>
                            {stage === 1 ? (
                                <Button variant="contained" color="primary" onClick={() => setStage(2)}>
                                    Next
                                </Button>
                            ) : (
                                <Button variant="contained" color="primary">
                                    Add
                                </Button>
                            )}
                        </Box>
                    </Box>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AddPhoneContainer;