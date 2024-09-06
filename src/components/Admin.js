// Libraries
import React, { useState } from 'react';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';

// Conatiners
import DashboardContainer from '../containers/Home/admin/DashboardContainer';
import UsersContainer from '../containers/Home/admin/UsersContainer';

// Icons
import { ChartNoAxesCombined, LayoutDashboard, ShoppingBasket, ShoppingBag, Users} from 'lucide-react';
import { MdAdminPanelSettings, MdAssignmentReturn } from "react-icons/md";

const Admin = () => {
  // State
  const [state, setState] = useState(1);

  // renderContent function
  const renderContent = () => {
    switch (state) {
      case 1:
        return <DashboardContainer />;
      case 2:
        return <UsersContainer />;
      case 3:
        return <section>{/* Coordinators content */}</section>;
      case 4:
        return <section>{/* Products content */}</section>;
      case 5:
        return <section>{/* Orders content */}</section>;
      case 6:
        return <section>{/* Returns content */}</section>;
      default:
        return null;
    }
  };

  const MenuButton = ({ id, icon: Icon, label }) => (
    <ListItem button selected={state === id} onClick={() => setState(id)} className="w-full px-3 py-2" sx={{ mb: 3 }}>
      <ListItemIcon>
        <Icon className='text-purple-900' size={24} />
      </ListItemIcon>
      <ListItemText primary={label} sx={{ color: 'black' }} />
    </ListItem>
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
        <aside className='max-w-lg bg-slate-50 flex flex-col flex-grow items-center justify-center py-8 px-4 shadow-md'>
          <section className='w-full h-28 flex items-center justify-center'>
            <div className='w-full flex flex-row items-center justify-center gap-4 whitespace-nowrap px-4'>
              <ChartNoAxesCombined className='text-4xl text-purple-900' />
              <h3 className='flex text-2xl font-bold'>Admin Panel</h3>
            </div>
          </section>
          <section className='w-full flex px-5 py-2'>
            <List className='w-full'>
              <MenuButton id={1} icon={LayoutDashboard} label="Dashboard" />
              <MenuButton id={2} icon={Users} label="Users" />
              <MenuButton id={3} icon={MdAdminPanelSettings} label="Coordinators" />
              <MenuButton id={4} icon={ShoppingBasket} label="Products" />
              <MenuButton id={5} icon={ShoppingBag} label="Orders" />
              <MenuButton id={6} icon={MdAssignmentReturn} label="Returns" />
            </List>
          </section>
        </aside>
        <MainContent />
      </section>

      {/* Small Screen Layout */}
      <section className='w-full flex flex-col md:hidden sticky z-30'>
        {/* Add small screen layout here */}
      </section>
    </>
  );
};

export default Admin;