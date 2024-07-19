// Libraries
import { createBrowserRouter } from 'react-router-dom';

// Components
import App from '../App';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Forgot from '../pages/Forgot';
import Signup from '../pages/Signup';

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
            }
        ]
    }
]);

export default router;