// Libraries
import { useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import axios from "axios";

// Redux Actions
import { setAuthorized } from '../../stores/slices/authSlice';

// Common
import SummaryApi from '../../common/index';

const useUserAccess = () => {
    // Redux Dispatch
    const dispatch = useDispatch();

    const refreshAccess = useCallback(async () => {
        axios({
            url: SummaryApi.refresh_access.url,
            method: SummaryApi.refresh_access.method,
            withCredentials: true
        }).then(response => {
            const response_data = response.data;
            if (response_data.success) {
                localStorage.setItem('accessToken', response_data.accessToken);
                dispatch(setAuthorized(true));
            } else {
                localStorage.removeItem('accessToken');
                dispatch(setAuthorized(false));
            }
        }).catch(error => {
            throw error;
        });
    }, [dispatch]);

    // Authenticated function  
    const setAuthorize = useCallback(async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            dispatch(setAuthorized(false));
            await refreshAccess();
            return;
        }

        const decoded = jwtDecode(accessToken);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            await refreshAccess();
        } else {
            dispatch(setAuthorized(true));
        }
    }, [refreshAccess, dispatch]);

    return setAuthorize;
}

export default useUserAccess;