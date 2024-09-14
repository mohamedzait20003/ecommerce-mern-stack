// Libraries
import { createContext, useCallback } from "react";

// Custom Hooks
import useFetchUserDetails from './hooks/UserDetails';

// Context Creation
const Context = createContext(null);

// Context Provider
export const ContextProvider = ({ children }) => {
  // Custom Hooks
  const fetchUserDetails = useFetchUserDetails();

  const fetchCartDetails = useCallback(async () => {
  }, []);

  const fetchOrdersDetails = useCallback(async () => {
  }, []);

  return (
    <Context.Provider value={{ fetchUserDetails, fetchCartDetails, fetchOrdersDetails }}>
      {children}
    </Context.Provider>
  );
};

export default Context;