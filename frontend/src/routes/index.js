// Libraries
import { createBrowserRouter } from 'react-router-dom';

// Helpers
import ProtectedRoute from './protectedroute'; 
import RoleRedirect from './roleRedirect';

// Main Pages
import App from '../App';
import Home from '../pages/User/Home';

// User Pages
import Login from '../pages/User/Login';
import Forgot from '../pages/User/Forgot';
import Signup from '../pages/User/Signup';
import UserProfile from '../pages/User/UserProfile';
import PassChange from '../pages/User/PassChange';
import PicChange from '../pages/User/PicChange';

// Admin Pages
import Admin from '../pages/Admin/Admin';

// Client Pages
import Client from '../pages/Client/Client';
import Cart from '../pages/Client/Cart';


const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <RoleRedirect />
            },
            {
                path: "home",
                element: <Home />
            },
            {
                path: "admin",
                element: (
                    <ProtectedRoute>
                        <Admin />
                    </ProtectedRoute>
                )
            },
            {
                path: "client",
                element: (
                    <ProtectedRoute>
                        <Client />
                    </ProtectedRoute>
                )
            },
            {
                path: "login",
                element: <Login />
            },
            {
                path: "forgot-password",
                element: <Forgot />
            },
            {
                path: "sign-up",
                element: <Signup />
            },
            {
                path: "user-profile",
                element: (
                    <ProtectedRoute>
                        <UserProfile />
                    </ProtectedRoute>
                ),
            },
            {
                path: "picture-change",
                element: (
                    <ProtectedRoute>
                        <PicChange />
                    </ProtectedRoute>
                )
            },
            {
                path: "password-change",
                element: (
                    <ProtectedRoute>
                        <PassChange />
                    </ProtectedRoute>
                )
            },
            {
                path: "cart",
                element: (
                    <ProtectedRoute>
                        <Cart />
                    </ProtectedRoute>
                )
            }
        ]
    }
]);

export default router;