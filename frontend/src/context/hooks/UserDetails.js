// Libraries
import { useCallback } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';

// Redux Actions
import { setUser, setAuthorized } from '../../stores/slices/authSlice';

// Summary Api
import SummaryApi from '../../common/index';

const useFetchUserDetails = () => {
  const dispatch = useDispatch();

  return useCallback(async () => {
    axios({
      url: SummaryApi.current_user.url,
      method: SummaryApi.current_user.method,
      withCredentials: true
    })
    .then(response => {
      const response_data = response.data;
      console.log("User Details:", response_data);
    
      if (response_data.success) {
        dispatch(setUser(response_data.data));
      } else {
        localStorage.removeItem('accessToken');
        dispatch(setAuthorized(false));
        dispatch(setUser(null));
      }
    })
    .catch(error => {
      console.error("Error fetching user details:", error);
    });
  }, [dispatch]);
};

export default useFetchUserDetails;