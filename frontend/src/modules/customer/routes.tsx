import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';

// Middleware
import { RoutePolicy } from '../../lib/auth/policy';
import { guarded } from '../../lib/middlewares/middleware';

// Module Layout
import Layout from './layout';

// Common Components
import Wrapper from '@/common/components/main/wrapper';

// Module Pages
const Cart = lazy(() => import('./pages/cart'));
const CShop = lazy(() => import('./pages/shop'));
const CDeals = lazy(() => import('./pages/deals'));
const Orders = lazy(() => import('./pages/orders'));
const Dashboard = lazy(() => import('./pages/dashboard'));

const CustomerRoutes: RouteObject = {
    path: 'user/:publicUserId',
    ...guarded(RoutePolicy.protected(['CUSTOMER'], { owner: true })),
    element: (
        <Wrapper islazy={true}>
            <Layout />
        </Wrapper>
    ),
    children: [
        {
            index: true,
            element: (
                <Wrapper islazy={true}>
                    <Dashboard />
                </Wrapper>
            )
        },
        {
            path: 'shop',
            element: (
                <Wrapper islazy={true}>
                    <CShop />
                </Wrapper>
            )
        },
        {
            path: 'deals',
            element: (
                <Wrapper islazy={true}>
                    <CDeals />
                </Wrapper>
            )
        },
        {
            path: 'cart',
            element: (
                <Wrapper islazy={true}>
                    <Cart />
                </Wrapper>
            )
        },
        {
            path: 'orders',
            element: (
                <Wrapper islazy={true}>
                    <Orders />
                </Wrapper>
            )
        },
    ],
};

export default CustomerRoutes;
