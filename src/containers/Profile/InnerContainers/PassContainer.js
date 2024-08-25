// Libraries
import React, {useState, useEffect, useCallback, useContext} from 'react';
import { Box, TextField, Button, Typography, Grid } from '@mui/material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Context
import Context from '../../../context/index';

// Common
import SummaryApi from '../../../common/index';

// Icons
import { FaTimes } from 'react-icons/fa';
import { BsCheck2All } from 'react-icons/bs';

const PassContainer = () => {
    // User Data
    const userState = useSelector(state => state?.user?.user);
    const [user, setUser] = useState(userState);
    useEffect(() => {
        setUser(userState);
    }, [userState]);

    // Password Change Data
    const [PassInput, setPassInput] = useState(false);
    const [Pass, setPass] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordCriteria, setPasswordCriteria] = useState({
        uCase: false,
        num: false,
        sChar: false,
        passLength: false,
        identicality: false
    });

    // Data Handlers
    const setPassState = (e) => {
        const { name, value } = e.target;
        setPass({
            ...Pass,
            [name]: value
        });
        if (!PassInput) {
            setPassInput(true);
        }
    }
    const resetPassState = () => {
        setPass({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPassInput(false);
    };
    const validatePassword = useCallback(() => {
        const { newPassword, confirmPassword } = Pass;
        
        setPasswordCriteria({
            uCase: /[A-Z]/.test(newPassword),
            num: /\d/.test(newPassword),
            sChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
            passLength: newPassword.length >= 8,
            identicality: newPassword === confirmPassword
        });
    }, [Pass]);

    useEffect(() => {
        if (PassInput) {
            validatePassword();
        }
    }, [Pass.newPassword, Pass.confirmPassword, validatePassword, PassInput]);

    // Context Handler
    const { fetchUserDetails } = useContext(Context);

    // Submit Handler
    const handlePasswordChange = async(e) => {
        e.preventDefault();

        const response = await axios({
            url: SummaryApi.ChangePassword.url,
            method: SummaryApi.ChangePassword.method,
            data: JSON.stringify({
                Id: user?._id,
                Oldpass: Pass.oldPassword,
                password: Pass.newPassword
            }),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.data.success) {
            console.log(response.data.message);
            toast.success(response.data.message);
            resetPassState();
            fetchUserDetails();
        }
    }

    return (
        <Box className="flex flex-col px-2 py-3 gap-6 mt-3">
            <Box className='w-fit flex flex-col gap-1'>
                <h3 className='text-xl font-mono font-bold'>Password</h3>
                <hr className='w-3/4 border-1 border-black' />
            </Box>
            <Box className="w-full flex flex-col gap-4">
                <TextField label="Old Password" type="password" name='oldPassword' variant="outlined" fullWidth value={Pass.oldPassword} onChange={setPassState} />
                <TextField label="Password" type="password" name='newPassword' variant="outlined" fullWidth value={Pass.newPassword} onChange={setPassState} />
                <TextField label="Confirm Password" type="password" name='confirmPassword' variant="outlined" fullWidth value={Pass.confirmPassword} onChange={setPassState} />
            </Box>
            {PassInput && (
                <Box className="w-full flex p-2 mt-4 mb-4 rounded-md">
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="body2" className={`flex flex-row items-center gap-3 ${passwordCriteria.uCase ? 'text-green-700' : 'text-red-900'}`}>
                                {passwordCriteria.uCase ? <BsCheck2All /> : <FaTimes />} Must contain an uppercase letter
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" className={`flex flex-row items-center gap-3 ${passwordCriteria.num ? 'text-green-700' : 'text-red-900'}`}>
                                {passwordCriteria.num ? <BsCheck2All /> : <FaTimes />} Must contain a number
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" className={`flex flex-row items-center gap-3 ${passwordCriteria.sChar ? 'text-green-700' : 'text-red-900'}`}>
                                {passwordCriteria.sChar ? <BsCheck2All /> : <FaTimes />} Must contain a special character
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" className={`flex flex-row items-center gap-3 ${passwordCriteria.passLength ? 'text-green-700' : 'text-red-900'}`}>
                                {passwordCriteria.passLength ? <BsCheck2All /> : <FaTimes />} Must be at least 8 characters long
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" className={`flex flex-row items-center gap-3 ${passwordCriteria.identicality ? 'text-green-700' : 'text-red-900'}`}>
                                {passwordCriteria.identicality ? <BsCheck2All /> : <FaTimes />} Passwords must match
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            )}
            <Button variant="contained" color="primary" className="w-1/5 flex place-self-end mt-2" onClick={handlePasswordChange}>Save Changes</Button>
        </Box>
    )
}

export default PassContainer