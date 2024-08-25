// Libraries
import React, { useState } from 'react';

// Containers
import ProfileSubContainer from '../containers/Profile/SubContainers/ProfileSubContainer';
import SecuritySubContainer from '../containers/Profile/SubContainers/SecuritySubContainer';

// Icons
import { FaCreditCard, FaLock, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MdAssignmentReturn } from "react-icons/md";
import { FaLocationDot } from "react-icons/fa6";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { ImProfile } from "react-icons/im";

const Profile = () => {
    // State
    const [state, setState] = useState(1);
    const [barVisible, setBarVisible] = useState(false);

    const renderContent = () => {
        switch (state) {
            case 1:
                return <ProfileSubContainer />;
            case 2:
                return <SecuritySubContainer />;
            case 3:
                return <section>{/* Addresses content */}</section>;
            case 4:
                return <section>{/* Orders content */}</section>;
            case 5:
                return <section>{/* Cards content */}</section>;
            default:
                return null;
        }
    };

    const MenuButton = ({ id, icon: Icon, label }) => (
        <button className={`w-full flex items-center px-3 py-2 text-lg text-purple-900 rounded-t-lg lg:rounded-r-3xl ${state === id && 'bg-gray-300'}`} onClick={() => setState(id)} >
            <Icon className='mr-2' />{label}
        </button>
    );

    const MainContent = () => (
        <main className='w-full h-full py-8 px-4'>
            {renderContent()}
        </main>
    );

    return (
        <>
            {/* Large Screen Layout */}
            <section className='hidden md:flex md:flex-grow'>
                <aside className='max-w-80 bg-slate-50 flex flex-col flex-grow py-8 px-4 shadow-md'>
                    <section className='w-full h-48 flex flex-col items-center justify-center'>
                        <div className='w-50 flex flex-col items-center justify-center gap-8'>
                            <h3 className='text-2xl font-bold'>Settings</h3>
                        </div>
                    </section>
                    <section className='w-full flex px-5 py-2'>
                        <div className='w-full flex flex-col items-start justify-center gap-6'>
                            <MenuButton id={1} icon={ImProfile} label="Profile" />
                            <MenuButton id={2} icon={FaLock} label="Security" />
                            <MenuButton id={3} icon={FaLocationDot} label="Addresses" />
                            <MenuButton id={4} icon={RiShoppingBag3Fill} label="Orders" />
                            <MenuButton id={5} icon={MdAssignmentReturn} label="Returns" />
                            <MenuButton id={6} icon={FaCreditCard} label="Cards" />
                        </div>
                    </section>
                </aside>
                <MainContent />
            </section>

            {/* Small Screen Layout */}
            <section className='w-full flex flex-col md:hidden sticky z-30'>
                <section className={`w-full flex items-center justify-center ${barVisible && 'bg-white'}`}>
                    <button className={`bg-white flex flex-row items-center justify-center px-5 py-3 rounded-b-full ${!barVisible && 'shadow-md'}`} onClick={() => setBarVisible(!barVisible)} >
                        Toggle Menu {barVisible ? <FaChevronUp className='ml-2' /> : <FaChevronDown className='ml-2' />}
                    </button>
                </section>
                {barVisible && (
                    <section className='w-full flex px-5 py-2 bg-white shadow-md'>
                        <div className='w-full grid grid-cols-3 items-center justify-center gap-3'>
                            <MenuButton id={1} icon={ImProfile} label="Profile" />
                            <MenuButton id={2} icon={FaLock} label="Security" />
                            <MenuButton id={3} icon={FaLocationDot} label="Addresses" />
                            <MenuButton id={4} icon={RiShoppingBag3Fill} label="Orders" />
                            <MenuButton id={5} icon={MdAssignmentReturn} label="Returns" />
                            <MenuButton id={6} icon={FaCreditCard} label="Cards" />
                        </div>
                    </section>
                )}
                <MainContent />
            </section>
        </>
    );
};

export default Profile;