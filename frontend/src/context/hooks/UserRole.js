// Libraries
import { useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";

// Redux Actions
import { setRole } from '../../stores/slices/authSlice';

const useUserRole = () => {
    // Redux Dispatch
    const dispatch = useDispatch();

    // User Role
    const setUserRole = useCallback(() => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            return;
        }

        const decoded = jwtDecode(accessToken);
        const userRole = decoded.role;

        dispatch(setRole(userRole));
    }, [dispatch]);

    return setUserRole;
};

export default useUserRole;
