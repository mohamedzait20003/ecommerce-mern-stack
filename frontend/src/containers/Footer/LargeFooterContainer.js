// Libraries
import React from 'react'
import { Link } from 'react-router-dom'

// Icons
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa'

// Images
import Logo from '../../assets/Logo/Logo.svg'

const LargeFooterContainer = ({ Data }) => {
  return (
    <div className='container hidden lg:grid lg:grid-cols-6 mx-auto p-4'>
        <div className='col-span-2 flex flex-col items-start justify-start'>
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
        <div className='col-span-6 md:col-span-4 flex flex-row items-center justify-center lg:space-x-32 xl:space-x-64'>
            {Data.map((section, index) => (
                <div key={index} className='flex flex-col text-white'>
                <h2 className='text-base xl:text-lg font-semibold'>{section.title}</h2>
                <div className='flex flex-col mt-3 gap-2'>
                    {section.links.map((link, linkIndex) => (
                    <Link key={linkIndex} to={link.path} className='text-sm hover:text-amber-300'>
                        {link.title}
                    </Link>
                    ))}
                </div>
                </div>
            ))}
        </div>
        <div className='md:col-span-6 mt-10 flex flex-row items-center justify-center gap-24'>
            <p className='text-white text-xl font-bold'>Download Our App</p>
            <div className='flex flex-row gap-8'>
                <img src="https://framestrapimaster.blob.core.windows.net/assets/images/app_store_ios_f40b1630bfweb_2aebd07a1c.svg" width="100" height="80" alt='appstore-badge' />
                <img src="https://framestrapimaster.blob.core.windows.net/assets/images/google_play_acbf35dweb_046378895a.svg" width="100" height="80" alt='googleplay-badge' />
                <img src="https://framestrapimaster.blob.core.windows.net/assets/images/download_huawei_2x_05f90e4afe.png" width="100" height="80" alt='appgallery-badge' />
            </div>
        </div>
    </div>
  )
}

export default LargeFooterContainer