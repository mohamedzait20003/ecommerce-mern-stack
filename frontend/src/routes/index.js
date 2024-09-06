// Libraries
import { createBrowserRouter } from 'react-router-dom';

// Components
import App from '../App';
import Home from '../pages/Home';
import Cart from '../pages/Cart';
import Login from '../pages/Login';
import Forgot from '../pages/Forgot';
import Signup from '../pages/Signup';
import UserProfile from '../pages/UserProfile';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '/',
                element: <Home />
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
                element: <UserProfile />
            },
            {
                path: "cart",
                element: <Cart />
            }
        ]
    }
]);

export default router;