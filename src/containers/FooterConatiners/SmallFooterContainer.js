//Libraries
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

// Components
import FooterFeatureContainer from './FooterFeatureContainer'

// Images
import Logo from '../../assets/Images/Logo/Logo.svg'

// Icons
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa'
import { FaArrowDown, FaArrowLeft } from "react-icons/fa";

const DownloadContainer = () => {
    const [isOpen, setIsOpen] = useState(false);

    return(
        <div className='w-full mt-4 mb-2'>
            <div className='bg-[#556294] flex flex-row items-center justify-between px-6 py-8'>
                <h2 className='text-white text-lg font-bold'>Download Our App</h2>
                <button className='flex h-10 w-10 p-3 text-white border-2 border-whie rounded-full' onClick={() => setIsOpen(!isOpen)}>
                    {
                        isOpen ?
                            <FaArrowLeft />
                        :
                            <FaArrowDown />
                    }
                </button>
            </div>
            {
                isOpen ? (
                    <div className='w-full bg-slate-200 flex flex-row px-4 py-4 mb-3 gap-5 items-center justify-center'>
                        <img src="https://framestrapimaster.blob.core.windows.net/assets/images/app_store_ios_f40b1630bfweb_2aebd07a1c.svg" width="100" height="80" alt='appstore-badge' />
                        <img src="https://framestrapimaster.blob.core.windows.net/assets/images/google_play_acbf35dweb_046378895a.svg" width="100" height="50" alt='googleplay-badge' />
                        <img src="https://framestrapimaster.blob.core.windows.net/assets/images/download_huawei_2x_05f90e4afe.png" width="100" height="150" alt='appgallery-badge' />
                    </div>
                ) : null
            }
        </div>
    );
}

const SmallFooterContainer = ({ Data }) => {
  return (
    <div className='w-full sm:hidden flex flex-col justify-between p-4'>
        <div className='container flex flex-col mx-auto items-center justify-center'>
            <div className='flex flex-row'>
                <img className='w-16 h-10' src={Logo} alt="ZCommerce Logo" />
                <h1 className='text-4xl text-white font-extrabold'>ZC</h1>
            </div> 
            <p className='pl-3 mt-5 text-white text-sm'>Stay in touch with us</p>
            <div className='flex flex-row pl-2 mt-4 gap-4'>
              <Link to='/' className='bg-[#394162] text-white text-base px-2 py-2 rounded-full hover:bg-[#2c365f]'><FaFacebook /></Link>
              <Link to='/' className='bg-[#394162] text-white text-base px-2 py-2 rounded-full hover:bg-[#2c365f]'><FaTwitter /></Link>
              <Link to='/' className='bg-[#394162] text-white text-base px-2 py-2 rounded-full hover:bg-[#2c365f]'><FaInstagram /></Link>
              <Link to='/' className='bg-[#394162] text-white text-base px-2 py-2 rounded-full hover:bg-[#2c365f]'><FaYoutube /></Link>
            </div>
            <DownloadContainer />
            <div className='w-full flex flex-col'>
                {Data.map((section, index) => (
                    <FooterFeatureContainer key={index} FeatureData={section} />
                ))};
            </div>
        </div>
    </div>
  )
}

export default SmallFooterContainer