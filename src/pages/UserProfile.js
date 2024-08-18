// Libraries
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Icons
import { FaUserPlus } from 'react-icons/fa';

const UserProfile = () => {
  const userState = useSelector(state => state?.user?.user);
  const [user, setUser] = useState(userState);

  useEffect(() => {
    setUser(userState);
  }, [userState]);

  const handleUploadPic = async (e) => {
    
  };

  return (
    <section className='flex flex-grow'>
      <aside className='max-w-80 bg-slate-50 flex flex-grow py-8 px-4 shadow-md'>
        <div className='w-full h-80 flex flex-col items-center justify-center'>
        <div className='w-50 flex items-center justify-center gap-8'>
            <label htmlFor='fileInput' className='-mt-20 cursor-pointer'>
              {user?.profilePic ? (
                  <img className='w-20 h-20' src={user?.profilePic} alt="Profile" />
              ) : (
                  <FaUserPlus className='w-20 h-20' />
              )}
            </label>
          <input type='file' id='fileInput' className='hidden' onChange={handleUploadPic} />
        </div>
          <p className='capitalize text-lg font-semibold mt-8'>{user?.username}</p>
        </div>
      </aside>
      <main className='flex-grow h-full py-8 px-4'>
        main
      </main>
    </section>
  );
};

export default UserProfile;