// Libraries
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

// Material-UI
import { TextField, Button, Container, Box, Typography, Grid, FormControlLabel, Switch } from '@mui/material';

// Images
import LoginGIF from '../assets/Images/Signin/Login.gif';

// Context
import Context from '../context/index';

// API
import SummaryApi from '../common/index';

const Login = () => {

    // Form data
    const [role, setRole] = useState('User');
    const [data, setData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target
        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    };

    const handleRole = () => {
        setRole((prevRole) => (prevRole === 'User' ? 'Admin' : 'User'));
    };

    const navigate = useNavigate();
    const { fetchUserDetails } = useContext(Context);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await axios({
            url: SummaryApi.Login.url,
            method: SummaryApi.Login.method,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            withCredentials: true
        });
        
        const DataAPI = response.data;
        if(DataAPI.success){
            toast.success(DataAPI.message);
            navigate('/');
            fetchUserDetails();
        }
        
        if(DataAPI.error){
            toast.error(DataAPI.message);
        }
    };

    return (
        <section id='login' className='mt-10 mb-10'>
            <Container maxWidth="sm" className='p-4'>
                <Box className='w-full max-w-md flex flex-col items-center bg-white shadow-2xl px-8 py-5 mx-auto rounded-t-md'>
                    <Box className='flex flex-row items-center justify-between mx-auto'>
                        <img src={LoginGIF} alt="Login GIF" />
                    </Box>
                    <form className='w-full grid gap-8 pt-6' onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField variant='outlined' fullWidth name='email' label='Email' type='email' placeholder='example@gmail.com' onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField variant='outlined' fullWidth name='password' label="Password" type='password' placeholder='Enter your password' onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} className='flex justify-center'>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={role === 'Admin'}
                                            onChange={handleRole}
                                            name="role"
                                            color="primary"
                                        />
                                    }
                                    label={role === 'Admin' ? 'Admin' : 'User'}
                                />
                            </Grid>
                        </Grid>
                        <Box className='w-full flex flex-col'>
                            <Link className='block w-fit place-self-end mt-3 hover:text-red-800 hover:underline' to={"forgot-password"}>
                                Forgot password?
                            </Link>
                        </Box>
                        <Button type="submit" fullWidth variant="contained" color="primary" className='mt-4 px-5 py-3 text-2xl rounded-full hover:scale-105 transition-all'>
                            Login
                        </Button>
                    </form>
                    <Box className='place-self-start mt-6'>
                        <Typography variant="body1" className='text-black'>
                            Don&apos;t have an account? 
                            <Link to={"/sign-up"} className='ml-2 hover:underline hover:text-blue-800'>
                                Sign up
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </section>
    )
}

export default Login