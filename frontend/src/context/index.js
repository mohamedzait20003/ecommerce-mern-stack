// Libraries
import { createContext, useCallback } from "react";
import axios from 'axios';
import { useDispatch } from 'react-redux';

// Redux Actions
import { setUser } from '../stores/slices/userSlice';

// Summary Api
import SummaryApi from '../common/index';

// Context Creation
const Context = createContext(null);

export const ContextProvider = ({ children }) => {
  const dispatch = useDispatch();

  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await axios({
        url: SummaryApi.current_user.url,
        method: SummaryApi.current_user.method,
        withCredentials: true
      });

      const response_data = response.data;
      console.log("User Details:", response_data);

      if (response_data.success) {
        dispatch(setUser(response_data.data));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, [dispatch]);

  return (
    <Context.Provider value={{ fetchUserDetails }}>
      {children}
    </Context.Provider>
  );
};

export default Context;