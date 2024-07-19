// Libraries
import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

// Logo
import Logo from '../assets/Images/Logo/Logo.svg'

// Icons
import { GrSearch } from 'react-icons/gr'
import { FaRegUserCircle, FaShoppingCart } from 'react-icons/fa'

const Header = () => {
    const [LoggedIn, setLoggedIn] = useState(false);
    const [searchplaceholder, setSearchplaceholder] = useState('search for Bread');
    const placeholders = useMemo(() => ['Bread', 'Milk', 'Butter', 'Fruits', 'a Story', 'a Book', 'a Dress', 'a Phone', 'a T.V', 'a Laptop'], []);

    useEffect(() => {
        let index = 0;

        const interplace = setInterval(() => {
            setSearchplaceholder(`Search for ${placeholders[index]}`);
            index = (index + 1) % placeholders.length;
        }, 2000);

        return () => clearInterval(interplace);
    },[placeholders]);

    return (
        <header className='h-16 bg-white shadow-md'>
            <div className='h-full container mx-auto flex items-center justify-between px-4'>
                <Link to={"/"} className='flex flex-row items-center justify-start space-x-2'>
                    <img className='w-16 h-10' src={Logo} alt="ZCommerce Logo" />
                    <h1 className='text-4xl text-amber-900 font-extrabold'>ZC</h1>
                </Link>
                <div className='hidden w-full md:flex items-center justify-between max-w-sm border rounded-full focus-within:shadow'>
                    <input className='w-full outline-none pl-3 pr-2 py-2 rounded-l-full' type='text' placeholder={searchplaceholder} />
                    <button className='h-10 min-w-[50px] bg-amber-500 flex items-center justify-center rounded-r-full text-white text-2xl font-extrabold'>
                        <GrSearch />
                    </button>
                </div>
                <div className='flex items-center gap-5 md:-mr-10'>
                    <div className='relative'>
                        <button className='h-10 min-w-[50px] bg-transparent flex items-center justify-center rounded-full text-2xl text-blue-950'>
                            <FaShoppingCart  />
                        </button>
                        <p className=' w-5 h-5 -top-1 -right-0 absolute flex items-center justify-center bg-red-600 text-white rounded-full p-1'>0</p>
                    </div>
                    <div className='flex items-center justify-center'>
                        {
                            LoggedIn ? (
                                <button className='h-10 min-w-[50px] bg-transparent flex items-center justify-center rounded-full text-3xl text-slate-700'>
                                    <FaRegUserCircle  />
                                </button>
                            ) : (
                                <Link to={"login"} className='h-10 min-w-max bg-amber-500 flex items-center justify-center p-4 rounded-full text-xl font-bold text-white hover:bg-emerald-600 '>
                                    Login
                                </Link>
                            )
                        }
                    </div>
                </div>
            </div>
        </header>
  )
}

export default Header