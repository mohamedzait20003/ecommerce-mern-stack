// Libraries
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Material-UI
import { TextField, Button, Container, Box, Typography, Avatar, Grid, Link } from '@mui/material';

// Helpers
import imagetobase64 from '../helpers/imagetobase64';

// Icons
import { FaUserPlus } from 'react-icons/fa';

// API
import SummaryApi from '../common/index';

const Signup = () => {
  // Navigation
  const navigate = useNavigate();

  // Data handling
  const [data, setData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePic: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Image handling
  const handleUploadPic = async (e) => {
    const file = e.target.files[0];
    const imagePic = await imagetobase64(file);
    setData((prev) => ({
      ...prev,
      profilePic: imagePic,
    }));
  };

  // Form handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (data.password === data.confirmPassword) {
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
      toast.error('Please check password and confirm password');
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
            <div className="mt-8">
                <Button type="submit" fullWidth variant="contained" color="primary">
                    Sign up
                </Button>
            </div>
          </form>
          <Box className="mt-8">
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/login" variant="body2">
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