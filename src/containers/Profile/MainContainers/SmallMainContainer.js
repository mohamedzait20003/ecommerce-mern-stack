// Libraries
import React, { useState } from 'react'

// Containers
import ProfileSubContainer from '../SubContainers/ProfileSubContainer';

// Icons
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';


const LargeMainContainer = () => {
    // State
    const [BarVisible, setBarVisible] = useState(false);
    const [state, setState] = useState(1);

    return (
        <section className='flex flex-col lg:hidden'>
            <section className={`w-full flex items-center justify-center ${BarVisible && 'bg-white'}`}>
                <button className={`bg-white flex flex-row items-center justify-center px-5 py-3 rounded-b-full ${!BarVisible && 'shadow-md'}`} onClick={() => setBarVisible(!BarVisible)}>
                    Toggle Menu {BarVisible ? <FaChevronUp className='ml-2' /> : <FaChevronDown className='ml-2' />}
                </button>
            </section>
            {
                BarVisible && (
                    <section className='w-full flex px-5 py-2 bg-white'>
                        <div className='w-full flex flex-row items-start justify-center gap-6'>
                            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-t-2xl ${state === 1 && 'bg-gray-300'}`} onClick={() => setState(1)}>Profile</button>
                            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-t-2xl ${state === 2 && 'bg-gray-300'}`} onClick={() => setState(2)}>Addresses</button>
                            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-t-2xl ${state === 3 && 'bg-gray-300'}`} onClick={() => setState(3)}>Orders</button>
                            <button className={`w-full flex items-center justify-start px-3 py-2 text-lg text-purple-900 rounded-t-2xl ${state === 4 && 'bg-gray-300'}`} onClick={() => setState(4)}>Cards</button>
                        </div>
                    </section>
                )
            }
            
            <main className='w-full h-full py-8 px-4'>
                {state === 1 ? (
                    <ProfileSubContainer />
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
    )
}

export default LargeMainContainer