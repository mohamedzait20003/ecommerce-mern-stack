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
const Billing = lazy(() => import('./pages/billing'));
const PPrivacy = lazy(() => import('./pages/privacy'));
const Shipping = lazy(() => import('./pages/shipping'));
const Security = lazy(() => import('./pages/security'));
const Information = lazy(() => import('./pages/information'));

const ProfileRoutes: RouteObject = {
    path: 'profile',
    ...guarded(RoutePolicy.protected(['CUSTOMER', 'ADMIN'])),
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
                    <Information />
                </Wrapper>
            )
        },
        {
            path: 'security',
            element: (
                <Wrapper islazy={true}>
                    <Security />
                </Wrapper>
            )
        },
        {
            path: 'privacy',
            element: (
                <Wrapper islazy={true}>
                    <PPrivacy />
                </Wrapper>
            )
        },
        {
            path: 'shipping',
            element: (
                <Wrapper islazy={true}>
                    <Shipping />
                </Wrapper>
            )
        },
        {
            path: 'billing',
            element: (
                <Wrapper islazy={true} >
                    <Billing />
                </Wrapper>
            )
        },
    ],
};

export default ProfileRoutes;