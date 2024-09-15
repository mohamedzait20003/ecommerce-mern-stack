// Libraries
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

// Icons
import { FaArrowDown, FaArrowLeft } from "react-icons/fa";

const FooterFeatureContainer = ({ FeatureData }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return(
        <div className='mb-2'>
            <div className='bg-[#556294] flex flex-row items-center justify-between px-6 py-8'>
                <h2 className='text-white text-lg font-bold'>{FeatureData.title}</h2>
                <button
                    className={`flex h-10 w-10 p-3 text-white border-2 border-white rounded-full ${isOpen ? 'rotate-90' : 'rotate-0'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <FaArrowLeft /> : <FaArrowDown />}
                </button>
            </div>
            {
                isOpen ? (
                    <div className='w-full bg-slate-200 flex flex-col px-4 py-4 mb-3 items-start justify-center'>
                        {FeatureData.links.map((link, linkIndex) => (
                            <Link key={linkIndex} to={link.path} className='text-base font-semibold hover:text-amber-800'>
                                {link.title}
                            </Link>
                        ))}
                    </div>
                ) : null
            }
        </div>
    );
}

export default FooterFeatureContainer