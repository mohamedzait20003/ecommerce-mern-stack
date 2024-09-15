// Libraries
import React, { useState } from 'react';

// Icons
import { FaArrowDown, FaArrowLeft } from 'react-icons/fa';

const DownloadContainer = () => {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <div className='w-full mt-4 mb-2'>
        <div className='bg-[#556294] flex flex-row items-center justify-between px-6 py-8'>
          <h2 className='text-white text-lg font-bold'>Download Our App</h2>
          <button
            className={`flex h-10 w-10 p-3 text-white border-2 border-white rounded-full ${isOpen ? 'rotate-90' : 'rotate-0'}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaArrowLeft /> : <FaArrowDown />}
          </button>
        </div>
        {isOpen && (
          <div className='w-full bg-slate-200 flex flex-row px-4 py-4 mb-3 gap-5 items-center justify-center'>
            <img src="https://framestrapimaster.blob.core.windows.net/assets/images/app_store_ios_f40b1630bfweb_2aebd07a1c.svg" width="100" height="80" alt='appstore-badge' />
            <img src="https://framestrapimaster.blob.core.windows.net/assets/images/google_play_acbf35dweb_046378895a.svg" width="100" height="50" alt='googleplay-badge' />
            <img src="https://framestrapimaster.blob.core.windows.net/assets/images/download_huawei_2x_05f90e4afe.png" width="100" height="150" alt='appgallery-badge' />
          </div>
        )}
      </div>
    );
  };

export default DownloadContainer