// Libraries
import { createContext, useCallback } from "react";

// Custom Hooks
import useUserRole from "./hooks/UserRole";
import useUserAccess from "./hooks/UserAccess";
import useFetchUserDetails from './hooks/UserDetails';

// Context Creation
const Context = createContext(null);

// Context Provider
export const ContextProvider = ({ children }) => {
  // Custom Hooks
  const userRole = useUserRole();
  const userAccess = useUserAccess();
  const fetchUserDetails = useFetchUserDetails();

  const fetchCartDetails = useCallback(async () => {
  }, []);

  const fetchOrdersDetails = useCallback(async () => {
  }, []);

  return (
    <Context.Provider value={{ userRole, userAccess, fetchUserDetails, fetchCartDetails, fetchOrdersDetails }}>
      {children}
    </Context.Provider>
  );
};

export default Context;