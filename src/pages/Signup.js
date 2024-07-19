// Libraries
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

// Helpers
import imagetobase64 from '../helpers/imagetobase64'

// Images
import SignupIcon from '../assets/Images/SignUp/SignUp.png'

const Signup = () => {
  const [data, setData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePic: '',
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
  const handleUploadPic = async (e) => {
    const file = e.target.files[0];

    const imagePic = await imagetobase64(file);
    setData((preve) => {
      return {
        ...preve,
        profilePic: imagePic
      }
    });
  };


  const handleSubmit = (e) => {
      e.preventDefault();
  };

  return (
    <section id='login' className='mt-10 mb-10'>
            <div className='container mx-auto p-4'>
                <div className='w-full max-w-md flex flex-col items-center bg-white shadow-2xl px-8 py-5 mx-auto rounded-t-md'>
                    <div className='flex items-center justify-center gap-8 w-50 h-20'>
                        <img className='w-20 h-20' src={data.profilePic || SignupIcon} alt="Login GIF" />
                        <input type='file' id='fileInput' className='hidden' onChange={handleUploadPic} />
                        <label htmlFor='fileInput' className='cursor-pointer p-2 shadow-2xl rounded-full'>
                          Upload your photo
                        </label>
                    </div>
                    <form className='w-full grid gap-8 pt-6' onSubmit={handleSubmit}>
                        <div className='w-full flex flex-col'>
                            <label className='text-lg'>Username:</label>
                            <div className='flex bg-slate-200 p-2 shadow-lg mt-2'>
                                <input name='username' type='text' placeholder='Enter your Name' className='w-full h-full px-3 py-2 bg-transparent outline-none' onChange={handleChange} />
                            </div> 
                        </div>
                        <div className='w-full flex flex-col'>
                            <label className='text-lg'>Email:</label>
                            <div className='flex bg-slate-200 p-2 shadow-lg mt-2'>
                                <input name='email' type='email' placeholder='example@gmail.com' className='w-full h-full px-3 py-2 bg-transparent outline-none' onChange={handleChange} />
                            </div> 
                        </div>
                        <div className='w-full flex flex-col'>
                            <label className='text-lg'>Password:</label>
                            <div className='flex bg-slate-200 p-2 shadow-lg mt-2'>
                                <input name='password' type='password' placeholder='Enter your password' className='w-full h-full px-3 py-2 bg-transparent outline-none' onChange={handleChange} />
                            </div> 
                        </div>
                        <div className='w-full flex flex-col'>
                            <label className='text-lg'>Confirm Password:</label>
                            <div className='flex bg-slate-200 p-2 shadow-lg mt-2'>
                                <input name='confirmpassword' type='password' placeholder='Confirm your password' className='w-full h-full px-3 py-2 bg-transparent outline-none' onChange={handleChange} />
                            </div> 
                        </div>
                        <button className='block bg-amber-500 place-self-end mx-auto mt-4 px-5 py-3 text-white text-2xl rounded-full hover:scale-105 transition-all'>
                            Sign up
                        </button>
                    </form>
                    <div className='place-self-start mt-6'>
                        <p className='text-black'>Don&apos;t have an account ?<Link to={"/sign-up"} className='ml-2 hover:underline hover:text-red-800'>Sign up</Link></p>
                    </div>
                </div>
            </div>
        </section>
  )
}

export default Signup