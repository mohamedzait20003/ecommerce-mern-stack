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
const AHome = lazy(() => import('./pages/home'));
const Users = lazy(() => import('./pages/users'));
const Products = lazy(() => import('./pages/products'));
const Dashboard = lazy(() => import('./pages/dashboard'));

/** The admin console, under the signed-in admin's own id. */
const AdminRoutes: RouteObject = {
    path: 'admin/:publicUserId',
    ...guarded(RoutePolicy.protected(['ADMIN'], { owner: true })),
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
                    <AHome />
                </Wrapper>
            )
        },
        {
            path: 'dashboard',
            element: (
                <Wrapper islazy={true}>
                    <Dashboard />
                </Wrapper>
            )
        },
        {
            path: 'users',
            element: (
                <Wrapper islazy={true}>
                    <Users />
                </Wrapper>
            )
        },
        {
            path: 'products',
            element: (
                <Wrapper islazy={true}>
                    <Products />
                </Wrapper>
            )
        },
    ],
};

export default AdminRoutes;
