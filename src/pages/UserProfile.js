// Libraries
import React, { useState, useEffect } from 'react';
import { Avatar } from '@mui/material';
import { useSelector } from 'react-redux';

// Icons
import { FaUser, FaCreditCard  } from 'react-icons/fa';
import { FaLocationDot } from "react-icons/fa6";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { ImProfile } from "react-icons/im";

// Containers
import Profile from '../components/Profile';

const UserProfile = () => {
  // State
  const [state, setState] = useState(1);

  // User Data
  const userState = useSelector(state => state?.user?.user);
  const [user, setUser] = useState(userState);

  useEffect(() => {
    setUser(userState);
  }, [userState]);

  return (
    <section className='flex flex-grow'>
      <aside className='max-w-80 bg-slate-50 flex flex-col flex-grow py-8 px-4 shadow-md'>
        <section className='w-full h-80 flex flex-col items-center justify-center'>
          <div className='w-50 flex flex-col items-center justify-center gap-8'>
              {user?.profilePic ? (
                  <Avatar src={user?.profilePic} alt="Profile" sx={{ width: 80, height: 80 }} />
                ) : (
                  <FaUser className='w-20 h-20' />
              )}
              <p className='capitalize text-lg font-semibold mt-4'>{user?.username}</p>
          </div>
        </section>
        <section className='w-full flex px-5 py-2'>
          <div className='w-full flex flex-col items-start justify-center gap-6'>
            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 1 && 'bg-gray-300'}`} onClick={() => setState(1)}><ImProfile className='mr-2' />Profile</button>
            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 2 && 'bg-gray-300'}`} onClick={() => setState(2)}><FaLocationDot className='mr-2' />Addresses</button>
            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 3 && 'bg-gray-300'}`} onClick={() => setState(3)}><RiShoppingBag3Fill className='mr-2' />Orders</button>
            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 4 && 'bg-gray-300'}`} onClick={() => setState(4)}><FaCreditCard className='mr-2' /> Cards</button>
          </div>
        </section>
      </aside>
      <main className='w-full h-full py-8 px-4'>
        {state === 1 ? (
          <Profile user={user} />
        ) : state === 2 ? (
          <section>

          </section>
        ) : state === 3 ? (
          <section>

          </section>
        ) : state === 4 ? (
          <section>

          </section>
        ) : null}
      </main>
    </section>
  );
};

export default UserProfile;