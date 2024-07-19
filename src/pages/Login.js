// Libraries
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

// Images
import LoginGIF from '../assets/Login GIF/Login.gif'

const Login = () => {
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

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <section id='login' className='mt-10'>
            <div className='container mx-auto p-4'>
                <div className='w-full max-w-md flex flex-col items-center bg-white shadow-2xl px-8 py-5 mx-auto rounded-t-md'>
                    <div className='flex items-center justify-center w-20 h-20 mx-auto'>
                        <img src={LoginGIF} alt="Login GIF" />
                    </div>
                    <form className='w-full grid gap-8 pt-6' onSubmit={handleSubmit}>
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
                            <Link className='block w-fit place-self-end mt-3 hover:text-red-800 hover:underline' to={"forgot-password"}>
                                Forgot password?
                            </Link>
                        </div>
                        <button className='block bg-amber-500 place-self-end mx-auto mt-4 px-5 py-3 text-white text-2xl rounded-full hover:scale-105 transition-all'>
                            Login
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

export default Login