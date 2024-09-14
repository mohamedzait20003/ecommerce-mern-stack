// Libraries
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import axios from 'axios'

// Context
import { setUser } from '../../stores/slices/userSlice'

// Common
import SummaryApi from '../../common/index';

// Logo
import Logo from '../../assets/Logo/Logo.svg'

// Icons
import { GrSearch } from 'react-icons/gr'
import { FaRegUserCircle, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa'

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const user = useSelector(state => state?.user?.user);
    
    const handleLogout = async () => {
        try{
            const response = await axios({
                url: SummaryApi.Logout.url,
                method: SummaryApi.Logout.method,
                withCredentials: true
            });
        
            if (response.data.success) {
                dispatch(setUser(null));
                navigate("/");
                toast.success(response.data.message);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userRole');
            } else if (response.data.error) {
                toast.error(response.data.error);
            }
        } catch (err){
            console.log(err);
        }
    }

    const [searchplaceholder, setSearchplaceholder] = useState('search for Bread');
    const placeholders = useMemo(() => ['Bread', 'Milk', 'Butter', 'Fruits', 'a Story', 'a Book', 'a Dress', 'a Phone', 'a T.V', 'a Laptop'], []);
    
    const updatePlaceholder = useCallback(() => {
        let index = 0;
        return () => {
            setSearchplaceholder(`Search for ${placeholders[index]}`);
            index = (index + 1) % placeholders.length;
        };
    }, [placeholders]);

    useEffect(() => {
        const interplace = setInterval(updatePlaceholder(), 2000);
        return () => clearInterval(interplace);
    },[updatePlaceholder]);

    return (
        <header className='h-16 sticky bg-white md:shadow-md z-50'>
            <div className='h-full container mx-auto flex items-center justify-between px-4'>
                <Link to={"/"} className='flex flex-row items-center justify-start space-x-2'>
                    <img className='w-16 h-10' src={Logo} alt="ZCommerce Logo" />
                    <h1 className='text-4xl text-amber-900 font-extrabold'>ZMart</h1>
                </Link>
                {(user && user.Role === 'User') && (
                    <div className='hidden w-full lg:flex items-center justify-between max-w-sm border rounded-full focus-within:shadow'>
                        <input className='w-full outline-none pl-3 pr-2 py-2 rounded-l-full' type='text' placeholder={searchplaceholder} />
                        <button className='h-10 min-w-[50px] bg-amber-500 flex items-center justify-center rounded-r-full text-white text-2xl font-extrabold'>
                            <GrSearch />
                        </button>
                    </div>
                )}
                <div className='flex items-center gap-12 md:-mr-10'>
                    {(user && user.Role === 'User') && (
                        <div className='relative'>
                            <Link to={"cart"} className='h-10 min-w-[50px] bg-transparent flex items-center justify-center rounded-full text-2xl text-blue-950'>
                                <FaShoppingCart  />
                            </Link>
                            <p className=' w-5 h-5 -top-1 -right-0 absolute flex items-center justify-center bg-red-600 text-white rounded-full p-1'>0</p>
                        </div>
                    )}
                    <div className='flex items-center justify-center'>
                        {user ? (
                            <div className='flex flex-row gap-5 items-center'>
                                {user?.Role !== 'Admin' && (
                                    <Link to={"user-profile"} className='h-10 min-w-[50px] bg-transparent flex items-center justify-center rounded-full text-3xl text-blue-950'>
                                        <FaRegUserCircle  />
                                    </Link>
                                )}
                                <button className='h-10 min-w-[50px] bg-transparent flex items-center justify-center rounded-full text-3xl text-slate-900' onClick={handleLogout}>
                                    <FaSignOutAlt  />
                                </button>
                            </div>
                        ) : (
                            <Link to={"login"} className='h-10 min-w-max bg-amber-500 flex items-center justify-center p-4 rounded-full text-xl font-bold text-white hover:bg-emerald-600 '>
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
  )
}

export default Header