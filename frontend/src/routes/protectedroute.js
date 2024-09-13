// Libraries
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


const ProtectedRoute = ({ children }) => {
    const userState = useSelector(state => state?.user?.user);
    const [user, setUser] = useState(userState);

    useEffect(() => {
      setUser(userState);
    }, [userState]);

    return user ? children : <Navigate to='/login' />;
};

export default ProtectedRoute;