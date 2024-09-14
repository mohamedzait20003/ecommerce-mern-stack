// Libraries
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check Auth
  useEffect(() => {
    const sessionToken = localStorage.getItem('accessToken');
    if (sessionToken) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false); 
  }, []);

  if (!isLoading) {
    return isAuthenticated ? children : <Navigate to='/login' />;
  }
};

export default ProtectedRoute;