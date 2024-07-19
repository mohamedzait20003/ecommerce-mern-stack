// Libraries
import React from 'react'
import { Link } from 'react-router-dom'

// Components
import FooterFeatureContainer from './FooterFeatureContainer'

// Icons
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa'

// Images
import Logo from '../../assets/Logo/Logo.svg'

const MediumFooterContainer = ({ Data }) => {
  return (
    <div className='w-full hidden sm:flex lg:hidden flex-col justify-between p-4'>
        <div className='container flex flex-row mx-auto items-center justify-between'>
          <div className='flex flex-col'>
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
          </div>
          <div className='hidden sm:flex flex-col'>
            <p className='text-white text-xl font-bold'>Download Our App</p>
            <div className='grid grid-cols-2 mt-3 gap-4 items-end justify-end'>
                <img src="https://framestrapimaster.blob.core.windows.net/assets/images/app_store_ios_f40b1630bfweb_2aebd07a1c.svg" width="100" height="80" alt='appstore-badge' />
                <img src="https://framestrapimaster.blob.core.windows.net/assets/images/google_play_acbf35dweb_046378895a.svg" width="100" height="80" alt='googleplay-badge' />
                <img src="https://framestrapimaster.blob.core.windows.net/assets/images/download_huawei_2x_05f90e4afe.png" width="100" height="80" alt='appgallery-badge' />
            </div>
          </div>
        </div>
        <div className='w-full flex flex-col mt-10'>
            {Data.map((section, index) => (
                <FooterFeatureContainer key={index} FeatureData={section} />
            ))};
        </div>
    </div>
  )
}

export default MediumFooterContainer