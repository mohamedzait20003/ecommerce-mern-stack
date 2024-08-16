// Libraries
import React from 'react'

// Components
import LargeFooterContainer from '../containers/Footer/LargeFooterContainer';
import MediumFooterContainer from '../containers/Footer/MediumFooterContainer';
import SmallFooterContainer from '../containers/Footer/SmallFooterContainer';

// Footer Links
const FooterData = [
  {
    title: 'About Us',
    links: [
      {
        title: 'Our Team',
        path: '',
      },
      {
        title: 'Careers',
        path: '',
      },
      {
        title: 'Blog',
        path: '',
      }
    ]
  },
  {
    title: 'Contact Us',
    links: [
      {
        title: 'Contact Forum',
        path: '',
      },
      {
        title: 'Customer Service',
        path: '',
      },
      {
        title: 'Live Chat',
        path: '',
      }
    ]
  },
  {
    title: 'Help & Support',
    links: [
      {
        title: 'FAQ',
        path: '',
      },
      {
        title: 'Terms & Conditions',
        path: '',
      },
      {
        title: 'Privacy Policy',
        path: '',
      }
    ]
  }
];

const Footer = () => {
  const handleTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  return (
    <footer className='bg-[#272d44] shadow-md'>
      <button className='w-full bg-[#3c4569] flex items-center justify-center px-5 py-3 mb-5 text-white hover:bg-[#616a8d]' onClick={handleTop}>
        Back to top
      </button>

      {/* Large Screens */}
      <LargeFooterContainer Data={FooterData} />

      {/* Medium Screens */}
      <MediumFooterContainer Data={FooterData} />

      {/* Small Screens */}
      <SmallFooterContainer Data={FooterData} />

      <div className='bg-slate-300 py-3'>
        <p className='text-center'>All Rights Reserved &copy; 2024 to Mohammed Zaitoun</p>
      </div>
    </footer>
  )
}

export default Footer

