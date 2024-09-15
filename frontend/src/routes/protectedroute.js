// Libraries
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Context
import Context from '../context';

const ProtectedRoute = ({ children }) => {
  // Auth State
  const [isLoading, setIsLoading] = useState(true);
  const isAuthorized = useSelector(state => state?.auth?.Authorized);

  // Context
  const { userAccess } = useContext(Context);

  // Check Auth
  const AccessCheck = useCallback(async () => {
    await userAccess();
    setIsLoading(false);
  }, [userAccess]);
  
  useEffect(() => {
    AccessCheck();
  }, [isAuthorized ,AccessCheck]);

  if (!isLoading) {
    return isAuthorized ? children : <Navigate to='/login' />;
  }
};

export default ProtectedRoute;