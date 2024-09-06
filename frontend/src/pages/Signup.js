// Libraries
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

// Material-UI
import { TextField, Button, Container, Box, Typography, Avatar, Grid } from '@mui/material';

// Helpers
import imagetobase64 from '../helpers/imagetobase64';

// Icons
import { FaUserPlus, FaTimes } from 'react-icons/fa';
import { BsCheck2All } from 'react-icons/bs';

// API
import SummaryApi from '../common/index';

const Signup = () => {
  // Navigation
  const navigate = useNavigate();

  // Form data
  const [InputStart, setInputStart] = useState(false);
  const [data, setData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePic: '',
  });

  // Password criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    uCase: false,
    num: false,
    sChar: false,
    passLength: false,
    identicality: false
  });

  // Form handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (!InputStart) {
        setInputStart(true);
    }
  };

  // Password validation
  const validatePassword = useCallback(() => {
    const { password, confirmPassword } = data;

    setPasswordCriteria({
      uCase: /[A-Z]/.test(password),
      num: /\d/.test(password),
      sChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passLength: password.length >= 8,
      identicality: password === confirmPassword
    });
  },[data]);

  useEffect(() => {
    if (InputStart) {
        validatePassword();
    }
  }, [data.password, data.confirmPassword, validatePassword, InputStart]);
  

  // Image handling
  const handleUploadPic = async (e) => {
    const file = e.target.files[0];
    const imagePic = await imagetobase64(file);
    setData((prev) => ({
      ...prev,
      profilePic: imagePic,
    }));
  };

  // Form Submit handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordCriteria.uCase && passwordCriteria.num && passwordCriteria.sChar && passwordCriteria.passLength && passwordCriteria.identicality) {
      try {
        const response = await axios({
          url: SummaryApi.SignUp.url,
          method: SummaryApi.SignUp.method,
          headers: {
            'Content-Type': 'application/json',
          },
          data: JSON.stringify(data),
        });

        const dataApi = response.data;

        if (dataApi.success) {
          toast.success(dataApi.message);
          navigate('/login');
        }
      } catch (err) {
        toast.error('Error during sign up');
      }
    } else {
        if (!passwordCriteria.uCase) {
            toast.error('Password must contain an uppercase letter');
        } else if (!passwordCriteria.num) {
            toast.error('Password must contain a number');
        }
        else if (!passwordCriteria.sChar) {
            toast.error('Password must contain a special character');
        }
        else if (!passwordCriteria.passLength) {
            toast.error('Password must be at least 8 characters long');
        }
        else if (!passwordCriteria.identicality) {
            toast.error('Passwords must match');
        }
    }
  };

  return (
    <section id="signup" className="mt-10 mb-10">
      <Container component="main" maxWidth="xs">
        <Box className="flex flex-col items-center mt-10 mb-10 p-4 shadow-md rounded-lg bg-white">
          <Box className="flex justify-center items-center gap-2 w-full h-20">
            <label htmlFor="fileInput" className="cursor-pointer">
              {data.profilePic ? (
                <Avatar src={data.profilePic} alt="Profile" className="w-20 h-20" />
              ) : (
                <FaUserPlus className="w-20 h-20" />
              )}
            </label>
            <input type="file" id="fileInput" className="hidden" onChange={handleUploadPic} />
          </Box>
          <form onSubmit={handleSubmit} className="w-full mt-8">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField variant="outlined" fullWidth label="Username" name="username" placeholder="Enter your Name" onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField variant="outlined" fullWidth label="Email" name="email" type="email" placeholder="example@gmail.com" onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField variant="outlined" fullWidth label="Password" name="password" type="password" placeholder="Enter your password" onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField variant="outlined" fullWidth label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm your password" onChange={handleChange} />
              </Grid>
            </Grid>
            {InputStart && (
                <Box mt={4} mb={4} p={2} border={1} borderColor="grey.300" borderRadius={4}>
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
            <div className="mt-8">
                <Button type="submit" fullWidth variant="contained" color="primary">
                    Sign up
                </Button>
            </div>
          </form>
          <Box className=''>

          </Box>
          <Box className='place-self-start mt-6'>
            <Typography variant="body2"  className='text-black'>
              Already have an account?{' '}
              <Link to={`/login`} className='ml-2 hover:underline hover:text-blue-800'>
                Login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </section>
  );
};

export default Signup;