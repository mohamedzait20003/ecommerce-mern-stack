// Libraries
import React, { useState } from 'react'

// Containers
import ProfileSubContainer from '../SubContainers/ProfileSubContainer';
import SecuritySubContainer from '../SubContainers/SecuritySubContainer';

// Icons
import { FaCreditCard , FaLock } from 'react-icons/fa';
import { FaLocationDot } from "react-icons/fa6";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { ImProfile } from "react-icons/im";

const LargeMainContainer = () => {
    // State
    const [state, setState] = useState(1);

    return (
        <section className='hidden lg:flex lg:flex-grow'>
            <aside className='max-w-80 bg-slate-50 flex flex-col flex-grow py-8 px-4 shadow-md'>
                <section className='w-full h-48 flex flex-col items-center justify-center'>
                    <div className='w-50 flex flex-col items-center justify-center gap-8'>
                        <h3 className='text-2xl font-bold'>Options</h3>
                    </div>
                </section>
                <section className='w-full flex px-5 py-2'>
                    <div className='w-full flex flex-col items-start justify-center gap-6'>
                        <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 1 && 'bg-gray-300'}`} onClick={() => setState(1)}><ImProfile className='mr-2' />Profile</button>
                        <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 2 && 'bg-gray-300'}`} onClick={() => setState(2)}><FaLock className='mr-2' />Security</button>
                        <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 3 && 'bg-gray-300'}`} onClick={() => setState(3)}><FaLocationDot className='mr-2' />Addresses</button>
                        <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 4 && 'bg-gray-300'}`} onClick={() => setState(4)}><RiShoppingBag3Fill className='mr-2' />Orders</button>
                        <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-r-3xl ${state === 5 && 'bg-gray-300'}`} onClick={() => setState(5)}><FaCreditCard className='mr-2' /> Cards</button>
                    </div>
                </section>
            </aside>
            <main className='w-full h-full py-8 px-4'>
                {state === 1 ? (
                    <ProfileSubContainer />
                ) : state === 2 ? (
                    <SecuritySubContainer />
                ) : state === 3 ? (
                <section>

                </section>
                ) : state === 4 ? (
                <section>

                </section>
                ) : null}
            </main>
        </section>
    )
}

export default LargeMainContainer